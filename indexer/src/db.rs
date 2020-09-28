use near_indexer::near_primitives::{
    views::{ExecutionOutcomeWithIdView, ExecutionStatusView},
};
use near_indexer::Outcome;
use serde_json::{Result, Value};

use bigdecimal::BigDecimal;
use std::str::FromStr;

use diesel::{
    pg::upsert::*,
    prelude::*,
    r2d2::{ConnectionManager, Pool},
};
use tokio_diesel::*;

mod schema;
mod structs;

pub fn continue_if_valid_flux_receipt(outcome: HashMap<CryptoHash, ExecutionOutcomeWithId>) -> Option<ExecutionOutcomeWithIdView> {

    let receipt: ExecutionOutcomeWithIdView = match outcome {
        Outcome::Receipt(outcome) => outcome,
        _ => return None
    };
    
    if receipt.outcome.executor_id != "u1f92b_u1f680.flux-dev" {return None}

    let res: Option<&String> = match &receipt.outcome.status {
        ExecutionStatusView::SuccessValue(res) => Some(res),
        ExecutionStatusView::SuccessReceiptId(receipt_id) => None,
        _ => return None
    };

    return Some(receipt);
        
}

pub async fn process_logs(pool: &Pool<ConnectionManager<PgConnection>>, receipt: ExecutionOutcomeWithIdView) -> Result<()> {
    
    for log in receipt.outcome.logs {
        let json: Value = serde_json::from_str(log.as_str())?;
        println!("type: {:?} args: {:?}",  &json["type"], &json["params"]);
        execute_log(pool, &json["type"], &json["params"]).await;
    }

    Ok(())
}

// TODO: batch tx's
pub async fn execute_log(pool: &Pool<ConnectionManager<PgConnection>>, log_type: &Value, params: &Value) {    

	if log_type == &"market_creation".to_string() {
        add_market(pool, params).await;
    } else if log_type == &"order_placed".to_string() || log_type == &"order_filled_at_placement".to_string()  {
        add_order(pool, params, log_type).await;
        
        let filled = params["shares_filling"]
            .as_str()
            .unwrap()
            .to_string()
            .parse::<u128>()
            .unwrap();

        if filled > 0 {
            add_fill(pool, params).await;
        }

    } 
    else if log_type == &"updated_user_balance".to_string() {
        update_user_balance(pool, params).await;
    }
    else if log_type == &"order_filled".to_string() {
        add_fill(pool, params).await;
        fill_order(pool, params).await;
    } 
    else if log_type == &"order_closed".to_string() {
        close_order(pool, params).await;
    } 
    else if log_type == &"increased_claimable_if_valid".to_string() {
        add_to_claimable_if_valid(pool, params).await;
    }
    else if log_type == &"new_resolution_window".to_string() {
        add_resolution_window(pool, params).await;
    }
    else if log_type == &"market_resoluted".to_string() {
        add_stake(pool, params).await;
        set_resolute_market(pool, params).await;
    } 
    else if log_type == &"staked_on_resolution".to_string() {
        add_stake(pool, params).await;
    }
    else if log_type == &"resolution_disputed".to_string() {
        add_stake(pool, params).await;
        set_dispute_market(pool, params).await;
    }
    else if log_type == &"staked_on_dispute".to_string() {
        add_stake(pool, params).await;
    }
    else if log_type == &"market_finalized".to_string() {
        set_finalized_market(pool, params).await;
    }
    else if log_type == &"added_to_affiliate_earnings".to_string() {
        add_affiliate_earnings(pool, params).await;
    }
    else if log_type == &"earnings_claimed".to_string() {
        add_claimed_market(pool, params).await;
    }
    else if log_type == &"affiliate_earnings_claimed".to_string() {
        set_affiliate_earnings(pool, params).await;
    }
}


pub async fn set_affiliate_earnings(pool: &Pool<ConnectionManager<PgConnection>>, params: &Value) {
    let account_id = params["account_id"].as_str().unwrap().to_string();

    diesel::update(
        schema::accounts::table
            .filter(schema::accounts::dsl::id.eq(account_id))
    )
    .set(schema::accounts::dsl::affiliate_earnings.eq(BigDecimal::from_str(&"0".to_string()).unwrap()))
    .execute_async(pool)
    .await
    .expect("updated market resolute failed");
}

pub async fn add_claimed_market(pool: &Pool<ConnectionManager<PgConnection>>, params: &Value) {
    let claimed_market: structs::ClaimedMarket = structs::ClaimedMarket::from_args(params);

    diesel::insert_into(schema::claimed_markets::table)
        .values(claimed_market)
        .on_conflict_do_nothing()
        .execute_async(pool)
        .await
        .expect("something went wrong while trying to insert claimed market");
}

pub async fn add_stake(pool: &Pool<ConnectionManager<PgConnection>>, params: &Value) {
    let stake: structs::AccountStakeInOutcome = structs::AccountStakeInOutcome::from_args(params);

    println!("{:?}", stake);

    diesel::insert_into(schema::account_stake_in_outcomes::table)
        .values(stake)
        .on_conflict_do_nothing()
        .execute_async(pool)
        .await
        .expect("something went wrong while trying to insert staake");
}


pub async fn add_resolution_window(pool: &Pool<ConnectionManager<PgConnection>>, params: &Value) {
    let resolution_window: structs::ResolutionWindow = structs::ResolutionWindow::from_args(params);

    println!("{:?}", resolution_window);

    diesel::insert_into(schema::resolution_windows::table)
        .values(resolution_window)
        .on_conflict_do_nothing()
        .execute_async(pool)
        .await
        .expect("something went wrong while trying to insert resolution_window");
}

pub async fn add_market(pool: &Pool<ConnectionManager<PgConnection>>, params: &Value) {
    let market: structs::Market = structs::Market::from_args(params);

    println!("{:?}", market);

    diesel::insert_into(schema::markets::table)
        .values(market)
        .on_conflict_do_nothing()
        .execute_async(pool)
        .await
        .expect("something went wrong while trying to insert into markets");
}

pub async fn set_resolute_market(pool: &Pool<ConnectionManager<PgConnection>>, params: &Value) {
    let market_id = structs::val_to_i64(&params["market_id"]);
    let outcome = structs::val_to_i16(&params["outcome"]);
    
    diesel::update(
        schema::markets::table
            .filter(schema::markets::dsl::id.eq(market_id))
    )
    .set((
        schema::markets::dsl::resoluted.eq(true),
        schema::markets::dsl::winning_outcome.eq(outcome)
    ))
    .execute_async(pool)
    .await
    .expect("updated market resolute failed");
}

pub async fn add_affiliate_earnings(pool: &Pool<ConnectionManager<PgConnection>>, params: &Value) {
    let earnings = BigDecimal::from_str(&params["earned"].as_str().unwrap().to_string()).unwrap();
    let account: structs::Account = structs::Account::from_args(params);

    diesel::insert_into(schema::accounts::table)
    .values(account)
    .on_conflict(schema::accounts::dsl::id)
    .do_update()
    .set(schema::accounts::dsl::affiliate_earnings.eq(earnings))
    .execute_async(pool)
    .await
    .expect("updated market resolute failed");
}

pub async fn update_user_balance(pool: &Pool<ConnectionManager<PgConnection>>, params: &Value) {
    let account_share_balance: structs::AccountShareBalance = structs::AccountShareBalance::from_args(params);
    println!("");
    println!("acc share b {:?}", account_share_balance);
    println!("");

    let balance = BigDecimal::from_str(&params["balance"].as_str().unwrap().to_string()).unwrap();
    let to_spend = BigDecimal::from_str(&params["to_spend"].as_str().unwrap().to_string()).unwrap();
    let spent = BigDecimal::from_str(&params["spent"].as_str().unwrap().to_string()).unwrap();

    diesel::insert_into(schema::account_share_balances::table)
    .values(account_share_balance)
    .on_conflict(on_constraint("account_share_balances_pkey"))
    .do_update()
    .set((
        schema::account_share_balances::dsl::balance.eq(balance), schema::account_share_balances::dsl::to_spend.eq(to_spend), schema::account_share_balances::dsl::spent.eq(spent)
    ))
    .execute_async(pool)
    .await
    .expect("updating user balance failed");
}

pub async fn set_dispute_market(pool: &Pool<ConnectionManager<PgConnection>>, params: &Value) {
    let market_id = structs::val_to_i64(&params["market_id"]);
    let outcome = structs::val_to_i16(&params["outcome"]);

    diesel::update(
        schema::markets::table
            .filter(schema::markets::dsl::id.eq(market_id))
    )
    .set((
        schema::markets::dsl::disputed.eq(true),
        schema::markets::dsl::winning_outcome.eq(outcome)
    ))
    .execute_async(pool)
    .await
    .expect("updated market resolute failed");
}

pub async fn set_finalized_market(pool: &Pool<ConnectionManager<PgConnection>>, params: &Value) {
    let market_id = structs::val_to_i64(&params["market_id"]);
    let winning_outcome = structs::val_to_i16(&params["winning_outcome"]);

    diesel::update(
        schema::markets::table
            .filter(schema::markets::dsl::id.eq(market_id))
    )
    .set((
        schema::markets::dsl::finalized.eq(true),
        schema::markets::dsl::winning_outcome.eq(winning_outcome)
    ))
    .execute_async(pool)
    .await
    .expect("updated market resolute failed");
}

pub async fn add_order(pool: &Pool<ConnectionManager<PgConnection>>, params: &Value, log_type: &Value) {
    let order: structs::Order = structs::Order::from_args(params, log_type);

    println!("{:?}", order);

    diesel::insert_into(schema::orders::table)
        .values(order)
        .on_conflict_do_nothing()
        .execute_async(pool)
        .await
        .expect("something went wrong while trying to insert into orders");
}

pub async fn add_fill(pool: &Pool<ConnectionManager<PgConnection>>, params: &Value) {
    let fill: structs::Fill = structs::Fill::from_args(params);

    diesel::insert_into(schema::fills::table)
        .values(fill)
        .on_conflict_do_nothing()
        .execute_async(pool)
        .await
        .expect("something went wrong while trying to insert into fills");
}

pub async fn fill_order(pool: &Pool<ConnectionManager<PgConnection>>, params: &Value) {
    let order_id = BigDecimal::from_str(&params["order_id"].as_str().unwrap().to_string()).unwrap();
    let outcome = structs::val_to_i64(&params["outcome"]);
    let market_id = structs::val_to_i64(&params["market_id"]);
    let filled = BigDecimal::from_str(&params["filled"].as_str().unwrap().to_string()).unwrap();
    let shares_filled = BigDecimal::from_str(&params["shares_filled"].as_str().unwrap().to_string()).unwrap();

    diesel::update(
        schema::orders::table
            .filter(
                schema::orders::dsl::market_id.eq(market_id).and(schema::orders::dsl::id.eq(order_id)).and(schema::orders::dsl::outcome.eq(outcome))
            )
    )
    .set((
        schema::orders::dsl::filled.eq(filled),
        schema::orders::dsl::shares_filled.eq(shares_filled),
    ))
    .execute_async(pool)
    .await
    .expect("filling order failed");
}

pub async fn close_order(pool: &Pool<ConnectionManager<PgConnection>>, params: &Value) {
    let order_id = BigDecimal::from_str(&params["order_id"].as_str().unwrap().to_string()).unwrap();
    let outcome = structs::val_to_i64(&params["outcome"]);
    let market_id = structs::val_to_i64(&params["market_id"]);

    diesel::update(
        schema::orders::table
            .filter(
                schema::orders::dsl::market_id.eq(market_id).and(schema::orders::dsl::id.eq(order_id)).and(schema::orders::dsl::outcome.eq(outcome))
            )
    )
    .set((
        schema::orders::dsl::closed.eq(true),
    ))
    .execute_async(pool)
    .await
    .expect("canceling order failed");
}

pub async fn add_to_claimable_if_valid(pool: &Pool<ConnectionManager<PgConnection>>, params: &Value) {
    let claimable_if_valid: structs::ClaimableIfValid = structs::ClaimableIfValid::from_args(params);

    println!("{:?}", claimable_if_valid);

    diesel::insert_into(schema::claimable_if_valids::table)
        .values(claimable_if_valid)
        .on_conflict_do_nothing()
        .execute_async(pool)
        .await
        .expect("something went wrong while trying to insert into markets");
}
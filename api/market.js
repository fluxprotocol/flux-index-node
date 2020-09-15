const express = require("express");
const router = express.Router();
const moment = require("moment");

router.post("/get", (req, res) => {
	const {pool, body} = req;
	
	const query = `
		SELECT 
			SUM(orders.filled) as volume,
			markets.*,
			extract(epoch from markets.creation_date) as creation_timestamp,
			extract(epoch from markets.end_date_time) as end_timestamp
		FROM markets
		LEFT JOIN orders
		ON markets.id = orders.market_id
		WHERE markets.id = $1
		GROUP BY markets.id
		ORDER BY volume
		LIMIT 1;
	`;

	const values = [body.marketId];
	
  	pool.query(query, values, (error, results) => {
		if (error) {
			console.error(error)
			return res.status(404).json(error)
		}
		return res.status(200).json(results.rows)
	})
});


router.post("/market_prices", (req, res) => {
	const {pool, body} = req;

	const marketQuery = `SELECT outcomes FROM markets WHERE markets.id = $1`;

	const query = `
		SELECT 
			outcome,
			SUM(shares - shares_filled) as amount,
			MAX(price) best_price
		FROM orders
		WHERE closed = false AND market_id = $1
		GROUP BY outcome
		ORDER BY outcome
	`;

	const values = [body.marketId];
	
	pool.query(marketQuery, values, (error , marketRes) => {
		if (error) {
			console.error(error) 
			return res.status(404).json(error)
		}

		if (marketRes.fields.length === 0) return res.status(400).json({"error": "invalid market id"});
		let market = marketRes.rows[0];

		pool.query(query, values, (error, results) => {
			if (error) {
				console.error(error) 
				return res.status(404).json(error)
			}
	
			const marketPriceDepthPerOutcome = {}
	
			const rows = results.rows;
			
			for (let i = 0; i < rows.length; i++) {
				const marketData = rows[i];
				for (let outcome = 0; outcome < market.outcomes; outcome++) {
					if (outcome == marketData.outcome) continue;
					if (!marketPriceDepthPerOutcome[outcome]) {
						marketPriceDepthPerOutcome[outcome] = {
							marketPrice: 100 - marketData.best_price,
							depth: marketData.amount,
						}
					} else {
						marketPriceDepthPerOutcome[outcome].marketPrice -= marketData.best_price;
						if (marketPriceDepthPerOutcome[outcome].depth > marketData.amount) marketPriceDepthPerOutcome[outcome].depth = marketData.amount
					}
				}
			}
			return res.status(200).json(marketPriceDepthPerOutcome)
		})
	})
});

router.post("/last_filled_prices", (req, res) => {
	const {pool, body} = req;

	const query = `
		SELECT fills.outcome, MAX(fills.price) AS price FROM fills 
		JOIN (
			SELECT 
				market_id, 
				MAX(block_height) as block_height
			FROM fills 
			WHERE market_id = $1 
			AND block_height = block_height
			GROUP BY market_id
		) f2
		ON fills.block_height = f2.block_height
		GROUP BY fills.outcome;
	`;

	const values = [body.marketId];
	
 	pool.query(query, values, (error, results) => {
		if (error) {
			console.error(error)
			return res.status(404).json(error)
		}

		const rows = results.rows;
		const lastFillPricePerOutcome = {}

		rows.forEach(lastFill => {
			lastFillPricePerOutcome[lastFill.outcome] = lastFill.price;
		});
		return res.status(200).json(lastFillPricePerOutcome)
	})
});


router.post("/get_open_orders_for_user", (req, res) => {
	const {pool, body} = req;

	const query = `
		SELECT
			id,
			price,
			shares,
			shares_filled,
			outcome
		FROM orders
		WHERE orders.creator = $1 AND closed = false AND market_id = $2;	
	`;

	const values = [body.accountId, body.marketId]
	
  pool.query(query, values, (error, results) => {
    if (error) {
      console.error(error)
      res.status(404).json(error)
		}

    res.status(200).json(results.rows);
	})
});

router.post("/get_share_balances_for_user", (req, res) => {
	const {pool, body} = req;

	const query = `
		SELECT
			outcome,
			balance,
			(spent / balance) avg_price_per_share
		FROM account_share_balances
		WHERE account_id = $1 AND market_id = $2
		AND balance > 0;
	`;

	const values = [body.accountId, body.marketId]
	
  pool.query(query, values, (error, results) => {
    if (error) {
		console.error(error)
		return res.status(404).json(error)
	}

    res.status(200).json(results.rows);
	})
});


router.post("/get_avg_prices_for_date", (req, res) => {
	const {pool, body} = req;

	const startDate = moment(body.date);
	const endDate = moment(body.date).add(1, "day");

	const query = `
		SELECT outcome, SUM(price * amount) / SUM(amount) avg_price
		FROM fills
		WHERE (fill_time BETWEEN TO_TIMESTAMP($1) AND TO_TIMESTAMP($2)) AND market_id = $3
		GROUP BY outcome;
	`;

	const values = [startDate.unix(), endDate.unix(), body.marketId]

	pool.query(query, values, (error, results) => {
    if (error) {
		console.error(error)
		return res.status(404).json(error)
	}

    res.status(200).json(results.rows);
	})
});


module.exports = router;
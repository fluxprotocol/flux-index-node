#[macro_use]
extern crate diesel;

use std::env;
use std::io;
use actix;
use clap::derive::Clap;
use tokio::sync::mpsc;
use tracing_subscriber::EnvFilter;

use diesel::{
    prelude::*,
    r2d2::{ConnectionManager, Pool},
};
use std::error::Error;
use tokio_diesel::*;
use configs::{init_logging, Opts, SubCommand};

mod configs;
mod db;


use near_indexer;

pub async fn db_connect() -> Pool<ConnectionManager<PgConnection>> {
    eprintln!("connected to db");

    let manager =
        ConnectionManager::<PgConnection>::new("postgres://flux:flux@localhost:5432/flux");
    Pool::builder().build(manager).unwrap_or_else(|_| panic!("Error connecting to db"))
}

async fn listen_blocks(mut stream: mpsc::Receiver<near_indexer::StreamerMessage>) {
    let pool = db_connect().await;

    eprintln!("listening to blocks");

    while let Some(block) = stream.recv().await {
        eprintln!("Block height {:?}", block.block.header.height);
        for tx_res in block.receipt_execution_outcomes {
            let (_, outcome) = tx_res;
            let outcome = db::continue_if_valid_flux_receipt(outcome);
            if outcome.is_none() { continue; }
            db::process_logs(&pool, outcome.unwrap()).await;
        }
    }
}

fn main() {
    openssl_probe::init_ssl_cert_env_vars();

    let env_filter = EnvFilter::new(
        "tokio_reactor=info,near=info,near=error,stats=info,telemetry=info,indexer_for_wallet=info",
    );
    tracing_subscriber::fmt::Subscriber::builder()
        .with_env_filter(env_filter)
        .with_writer(std::io::stderr)
        .init();

    let opts: Opts = Opts::parse();

    let home_dir =
        opts.home_dir.unwrap_or(std::path::PathBuf::from(near_indexer::get_default_home()));

    match opts.subcmd {
        SubCommand::Run => {
            let indexer_config = near_indexer::IndexerConfig {
                home_dir,
                sync_mode: near_indexer::SyncModeEnum::FromInterruption,
            };
            let indexer = near_indexer::Indexer::new(indexer_config);
            let stream = indexer.streamer();
            actix::spawn(listen_blocks(stream));
            indexer.start();
        }
        SubCommand::Init(config) => near_indexer::init_configs(
            &home_dir,
            config.chain_id.as_ref().map(AsRef::as_ref),
            config.account_id.as_ref().map(AsRef::as_ref),
            config.test_seed.as_ref().map(AsRef::as_ref),
            config.num_shards,
            config.fast,
            config.genesis.as_ref().map(AsRef::as_ref),
            config.download,
            config.download_genesis_url.as_ref().map(AsRef::as_ref),
        ),
    }
}

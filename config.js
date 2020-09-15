require('dotenv').config();
const {Pool, Client} = require('pg');
const production = process.env.NODE_ENV === 'production';

const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`

const listener = new Client({
	connectionString: process.env.CONNECTION_STRING ? process.env.CONNECTION_STRING : connectionString,
  ssl: false,
})

const pool = new Pool({
	connectionString: process.env.CONNECTION_STRING ? process.env.CONNECTION_STRING : connectionString,
  ssl: false,
  connectionTimeoutMillis : 5000,
  idleTimeoutMillis : 30000
});

module.exports = {pool, listener}
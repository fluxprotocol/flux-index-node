const express = require("express");
const router = express.Router();

router.post("/get_affiliate_earnings", (req, res) => {
	const {pool, body} = req;

	const query = `
		SELECT 
			affiliate_earnings
		FROM accounts
		WHERE id = $1;
	`;

	const values = [body.accountId]

	pool.query(query, values, (error, results) => {
		if (error) {
			console.error(error)
			return res.status(404).json(error)
		}

		return res.status(200).json(results.rows);
	})
}); 


router.post("/get_open_orders", (req, res) => {
	const {pool, body} = req;

	const query = `
		SELECT orders.*, markets.outcome_tags, extract(epoch from orders.creation_time) as creation_time
		FROM orders
		LEFT JOIN markets
		ON orders.market_id = markets.id
		WHERE orders.creator = $1 AND orders.closed = false AND markets.end_date_time > to_timestamp(${new Date().getTime()} / 1000);
	`;

	const values = [body.accountId]

	pool.query(query, values, (error, results) => {
		if (error) {
			console.error(error)
			return res.status(404).json(error)
		}

		return res.status(200).json(results.rows);
	})
}); 

router.post("/get_order_history", (req, res) => {
	const {pool, body} = req;

	const query = `
		SELECT orders.*, markets.outcome_tags ,extract(epoch from orders.creation_time) as creation_time
		FROM orders
		LEFT JOIN markets
		ON orders.market_id = markets.id
		WHERE orders.creator = $1 AND (orders.closed = true OR markets.end_date_time < to_timestamp(${new Date().getTime()} / 1000));
	`;
	const values = [body.accountId]

	pool.query(query, values, (error, results) => {
		if (error) {
			console.error(error)
			return res.status(404).json(error)
		}

    	return res.status(200).json(results.rows);
	})
});

router.post("/get_finalized_participated_markets", (req, res) => {
	const {pool, body} = req;

	const query = `
		SELECT orders.market_id, orders.creator, markets.description FROM orders
		RIGHT JOIN markets
		ON orders.market_id = markets.id
		WHERE orders.creator = $1 AND markets.finalized = true
		GROUP BY orders.market_id, orders.creator, markets.description;
	`;
	const values = [body.accountId]

	pool.query(query, values, (error, results) => {
		if (error) {
			console.error(error)
			return res.status(404).json(error)
		}

    	return res.status(200).json(results.rows);
	})
});


module.exports = router;
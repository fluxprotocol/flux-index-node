const express = require("express");
const router = express.Router();

router.post("/get_best", (req, res) => {
	const {pool, body} = req;

	const query = `
		SELECT 
			outcome, 
			MAX(price) as price, 
			SUM((spend - filled) / price) as depth
		FROM orders
		WHERE market_id = $1 AND orders.closed = false
		GROUP BY outcome;
	`;

	const values = [body.marketId]

	pool.query(query, values, (error, results) => {
		if (error) {
			console.error(error)
			return res.status(404).json(error)
		}

		return res.status(200).json(results.rows);
	})
}); 

router.post("/get", (req, res) => {
	const {pool, body} = req;

	const query = `
		SELECT 
			outcome, 
			price, 
			SUM((spend - filled) / price) as depth
		FROM orders
		WHERE market_id = $1 AND orders.closed = false
		GROUP BY outcome, price
		ORDER BY price DESC;
	`;

	const values = [body.marketId]

	pool.query(query, values, (error, results) => {
		if (error) {
			console.error(error)
			return res.status(404).json(error)
		}

		return res.status(200).json(results.rows);
	})
}); 

module.exports = router;
const express = require("express");
const router = express.Router();
const moment = require("moment");

router.post("/get_avg_price_per_date_metric", (req, res) => {
	const {pool, body} = req;

	const startDate = moment(body.startDate);
	const endDate = moment(body.endDate);
	
	const dateSelection = body.dateMetrics.reduce((collector, _, index) => {
		return collector + `date_part($${index + 1}, fill_time) as date_type_${index}, `
	}, "")

	const groupByDate = body.dateMetrics.reduce((collector, item, index) => {
		return collector + `date_type_${index}, `
	}, "")

	const query = `
		SELECT
			${dateSelection}
			MAX(extract(epoch from fills.fill_time)) as fill_time,
			outcome, 
			SUM(price * amount) / SUM(amount) avg_price
		FROM fills
		WHERE (fill_time BETWEEN TO_TIMESTAMP($${body.dateMetrics.length + 1}) AND TO_TIMESTAMP($${body.dateMetrics.length + 2})) AND market_id = $${body.dateMetrics.length + 3}
		GROUP BY ${groupByDate}outcome
		ORDER BY fill_time, outcome
		;
	`;
	
	const values = [...body.dateMetrics, startDate.unix(), endDate.unix(), body.marketId]

	pool.query(query, values, (error, results) => {
		if (error) {
			console.error(error)
			return res.status(404).json(error)
		}



		return res.status(200).json(results.rows);
	})
}); 

module.exports = router;
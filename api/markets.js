const express = require("express");

const router = express.Router();
router.post("/get", async (req, res) => {
	const {pool, body} = req;

	let whereString = "";
	const categoryValues = [] // [categories[0], ...items]
	if (body.filter && body.filter.categories) {
		whereString = body.filter.categories.reduce((collector, item, index) => {
			categoryValues.push(body.filter.categories[index]);
			if (index == 0 ) return collector;
			return collector + ` OR $${index + 1} = ANY (markets.categories)`
		},  `AND $1 = ANY(markets.categories)`)
	}
	let limit = body.limit || 20;
	let limitString = `LIMIT $${categoryValues.length + 1}`;
	let offset =  body.offset || 0;
	let offsetString = `OFFSET $${categoryValues.length + 2}`
	const values = categoryValues.concat([limit, offset]);

	const query = `
		SELECT 
			SUM(orders.filled) as volume,
			markets.*,
			extract(epoch from markets.creation_date) as creation_timestamp,
			extract(epoch from markets.end_date_time) as end_timestamp
		FROM markets
		LEFT JOIN orders
		ON markets.id = orders.market_id 
		WHERE markets.end_date_time > to_timestamp(${new Date().getTime()} / 1000) ${whereString && whereString}
		GROUP BY markets.id
		ORDER BY volume
		${limitString} ${offsetString}
		;
	`;
	const totalQuery = `
		SELECT 
			COUNT(*) total_markets
		FROM markets
		WHERE markets.end_date_time > to_timestamp(${new Date().getTime()} / 1000) ${whereString && whereString};
	`;

	pool.query(totalQuery, categoryValues, (error, results) => {
		if (error) {
			console.error(error)
			return res.status(404).json(error)
		}

		const total_markets = results.rows[0] ? results.rows[0].total_markets : 0;

		pool.query(query, values, (error, results) => {
			if (error) {
				console.error(error)
				return res.status(404).json(error)
			}
		  
		  res.status(200).json({count: total_markets, data: results.rows})
	  })
	});

});

router.post("/best_prices", (req, res) => {
	const {pool, body} = req;

	let whereString = "";
	const categoryValues = [] // [categories[0], ...items]
	if (body.filter && body.filter.categories) {
		whereString = body.filter.categories.reduce((collector, item, index) => {
			categoryValues.push(body.filter.categories[index]);
			if (index == 0 ) return collector;
			return collector + ` OR $${index + 1} = ANY (markets.categories)`
		},  `WHERE  $1 = ANY(markets.categories)`)
	}

	let limit = body.limit || 20;
	let limitString = `LIMIT $${categoryValues.length + 1}`;
	let offset =  body.offset || 0;
	let offsetString = `OFFSET $${categoryValues.length + 2}`
	const values = categoryValues.concat([limit, offset]);


	const query = `
		SELECT 
			orders.market_id,
			orders.outcome,
			MAX(orders.price) best_price
		FROM orders
		JOIN (SELECT * from markets ${limitString} ${offsetString}) markets
		ON orders.market_id = markets.id
		WHERE orders.closed = false ${whereString && whereString} AND markets.end_date_time > to_timestamp(${new Date().getTime()} / 1000)
		GROUP BY orders.market_id, orders.outcome;
	`;
	
  	pool.query(query, values, (error, results) => {
	
		if (error) {
			console.error(error)
			return res.status(404).json(error)
		}

		const marketPricePerOutcome = {
			total: 0
		}

		const rows = results.rows;

		rows.forEach(outcomes => {
			if (!marketPricePerOutcome[outcomes.market_id]) marketPricePerOutcome[outcomes.market_id] = {};
			marketPricePerOutcome[outcomes.market_id][outcomes.outcome] = outcomes.best_price;
			marketPricePerOutcome.total += parseInt(outcomes.best_price);
		});
		return res.status(200).json(marketPricePerOutcome)
	})
});

router.post("/last_filled_prices", (req, res) => {
	const {pool, body} = req;

	let whereString = "";
	const categoryValues = [] // [categories[0], ...items]
	if (body.filter && body.filter.categories) {
		whereString = body.filter.categories.reduce((collector, item, index) => {
			categoryValues.push(body.filter.categories[index]);
			if (index == 0 ) return collector;
			return collector + ` OR $${index + 1} = ANY (markets.categories)`
		},  `AND  $1 = ANY(markets.categories)`)
	}
	let limit = body.limit || 20;
	let limitString = `LIMIT $${categoryValues.length + 1}`;
	let offset =  body.offset || 0;
	let offsetString = `OFFSET $${categoryValues.length + 2}`
	const values = categoryValues.concat([limit, offset]);

	const query = `
		SELECT fills.market_id, fills.outcome, MAX(fills.price) AS price FROM fills 
		JOIN (
			SELECT 
				market_id, 
				MAX(block_height) as block_height
			FROM fills
			JOIN (
				SELECT * FROM markets
				WHERE markets.end_date_time > to_timestamp(${new Date().getTime()} / 1000) ${whereString && whereString}
				${limitString} ${offsetString}
			) markets
			ON fills.market_id = markets.id
			AND block_height = block_height
			GROUP BY market_id
		) f2
		ON fills.block_height = f2.block_height
		GROUP BY fills.market_id, fills.outcome;
	`;
	
	pool.query(query, values, (error, results) => {
		if (error) {
			console.error(error)
			return res.status(404).json(error)
		}

			const rows = results.rows;
			const lastFillPricePerOutcome = {}
			rows.forEach(lastFill => {
				if (!lastFillPricePerOutcome[lastFill.market_id]) lastFillPricePerOutcome[lastFill.market_id] = {};
				lastFillPricePerOutcome[lastFill.market_id][lastFill.outcome] = lastFill.price;
			});
		return res.status(200).json(lastFillPricePerOutcome)
	})
});

router.post("/get_resoluting", async (req, res) => {
	const {pool, body} = req;

	let limit = body.limit || 20;
	let limitString = `LIMIT $1`;
	let offset =  body.offset || 0;
	let offsetString = `OFFSET $2`
	const values = [limit, offset];

	const query = `
		SELECT 
			SUM(orders.filled) as volume,
			markets.*,
			extract(epoch from markets.creation_date) as creation_timestamp,
			extract(epoch from markets.end_date_time) as end_timestamp,
			res_win.resolution_state,
			res_win.resolution_round_end_time
		FROM markets
		JOIN (
			SELECT 
				MAX(resolution_windows.round) AS resolution_state, 
				resolution_windows.end_time AS resolution_round_end_time,
				resolution_windows.market_id
			FROM resolution_windows
			GROUP BY resolution_windows.end_time, resolution_windows.market_id
		) res_win
		ON markets.id = res_win.market_id
		LEFT JOIN orders 
		ON markets.id = orders.market_id
		WHERE markets.end_date_time <= to_timestamp(${new Date().getTime()} / 1000) AND markets.finalized = false
		GROUP BY markets.id, res_win.resolution_state, res_win.resolution_round_end_time
		ORDER BY volume
		${limitString}
		${offsetString};
	`;

	const totalQuery = `
		SELECT 
			COUNT(*) total_markets
		FROM markets
		WHERE markets.end_date_time <= to_timestamp(${new Date().getTime()} / 1000);
	`;

	pool.query(totalQuery, categoryValues, (error, results) => {
		if (error) {
			console.error(error)
			return res.status(404).json(error)
		}

		const total_markets = results.rows[0] ? results.rows[0].total_markets : 0;
		pool.query(query, values, (error, results) => {
			if (error) {
				console.error(error)
				return res.status(404).json(error)
			}
			return res.status(200).json({count: total_markets, data: results.rows})
		})
	});


});


router.post("/get_resolution_state", async (req, res) => {
	const {pool, body} = req;

	let limit = body.limit || 20;
	let limitString = `LIMIT $1`;
	let offset =  body.offset || 0;
	let offsetString = `OFFSET $2`
	const values = [limit, offset];

	const query = `
		SELECT 
			markets.id as market_id,
			SUM(orders.filled) as volume,
			total_stake_in_outcomes.outcome,
			MAX(total_stake_in_outcomes.round) max_round
		FROM markets
		LEFT JOIN orders
		ON markets.id = orders.market_id
		RIGHT JOIN total_stake_in_outcomes
		ON markets.id = total_stake_in_outcomes.market_id
		WHERE markets.end_date_time <= to_timestamp(${new Date().getTime()} / 1000)
		GROUP BY markets.id, total_stake_in_outcomes.outcome
		ORDER BY volume
		${limitString}
		${offsetString};
	`;

  	pool.query(query, values, (error, results) => {
		if (error) {
			console.error(error)
			return res.status(404).json(error)
		}
    	return res.status(200).json(results.rows)
	})
});



module.exports = router;
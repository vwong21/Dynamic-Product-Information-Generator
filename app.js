const express = require('express');
const llm = require('./llm');
const scraper = require('./scraper');
require('dotenv').config();

const port = process.env.PORT;

const app = express();

app.get('/', async (req, res) => {
	try {
		// Name sent through query
		const product_name = req.query.name;
		const scraperRes = await scraper(product_name);
		const gptRes = await llm(product_name, scraperRes);
		res.status(200).json(JSON.parse(gptRes));
	} catch (error) {
		console.error(error);
		res.status(400).json({ status: 'error', message: error.message });
	}
});

app.listen(port, () => {
	console.log(`App is running on port ${port}`);
});

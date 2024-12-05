const express = require('express');
const chatGptExecute = require('./llm');
require('dotenv').config();

const port = process.env.PORT;

const app = express();

app.get('/', async (req, res) => {
	try {
		// Name sent through query
		product_name = req.query.name;
		gptRes = await chatGptExecute(product_name);
		res.json(JSON.parse(gptRes));
	} catch (error) {
		console.error(typeof error);
		res.json({ status: 'error', message: error.message });
	}
});

app.listen(port, () => {
	console.log(`App is running on port ${port}`);
});

const express = require('express');
const chatGptExecute = require('./llm');
const productInfo = require('./productInfo');
require('dotenv').config();

const port = process.env.PORT;

const app = express();

app.get('/', async (req, res) => {
	try {
		// Name sent through query
		product_name = req.query.name;
		productRes = await productInfo(product_name);
		gptRes = await chatGptExecute(product_name, productRes);
		res.status(200).json(JSON.parse(gptRes));
	} catch (error) {
		console.error(typeof error);
		res.status(400).json({ status: 'error', message: error.message });
	}
});

app.listen(3000, () => {
	console.log(`App is running on port ${port}`);
});

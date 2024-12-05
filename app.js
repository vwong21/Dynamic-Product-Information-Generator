const express = require('express');
require('dotenv').config();

const port = process.env.PORT;

const app = express();

app.get('/', (req, res) => {
	product_name = req.query.name;
	res.json({ name: product_name });
});

app.listen(port, () => {
	console.log(`App is running on port ${port}`);
});

const puppeteer = require('puppeteer');

const productInfo = async (name) => {
	const res = {};

	// Connect to headless browser
	console.log('Connecting to browser...');
	const browser = await puppeteer.launch({ headless: true });

	// Create new page in browser
	console.log('Creating new page...');
	const page = await browser.newPage();

	// Connect to Amacon
	console.log('Connecting to Amazon.ca...');
	await page.goto('https://www.amazon.ca/');

	// Wait for search bar to render, type name into search bar and click on search button
	console.log('Searching for item...');
	await page.waitForSelector('#twotabsearchtextbox');
	await page.type('#twotabsearchtextbox', name);
	await page.click('#nav-search-submit-button');

	// Wait for product a tag to render and get product link
	console.log('Getting product page...');
	await page.waitForSelector(
		'a.a-link-normal.s-underline-text.s-underline-link-text.s-link-style.a-text-normal'
	);
	const productLink = await page.$eval(
		'a.a-link-normal.s-underline-text.s-underline-link-text.s-link-style.a-text-normal',
		(el) => el.href
	);

	// Connect to product page
	console.log('Going to product page...');
	await page.goto(productLink);

	// Wait for title to load and add title to res obj
	console.log('Getting title...');
	await page.waitForSelector('#productTitle');
	res.title = await page.evaluate(() => {
		const titleElement = document.querySelector('#productTitle');
		return titleElement ? titleElement.textContent.trim() : null;
	});
	console.log(res);

	await browser.close();
};

productInfo('irobot roomba j7+');

module.exports = productInfo;

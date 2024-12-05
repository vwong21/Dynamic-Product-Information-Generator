process.env.DEBUG = 'puppeteer:page';
const puppeteer = require('puppeteer');

const productInfo = async (name) => {
	const res = {};

	// Connect to headless browser
	console.log('Connecting to browser...');
	const browser = await puppeteer.launch({
		// Headless set to false to manually complete captcha
		headless: false,
	});

	// Create new page in browser
	console.log('Creating new page...');
	const page = await browser.newPage();

	// Connect to Amacon
	console.log('Connecting to Amazon.ca...');
	await page.goto('https://www.amazon.ca/');

	// May need to complete captcha

	// Wait for search bar to render, type name into search bar and click on search button
	console.log('Searching for item...');
	await page.waitForSelector('#twotabsearchtextbox');
	await page.waitForSelector('#nav-search-submit-button');
	await page.type('#twotabsearchtextbox', name);
	await page.click('#nav-search-submit-button');

	// Wait for product a tag to render and get product link
	console.log('Getting product page...');
	await page.waitForSelector(
		'a.a-link-normal.s-underline-text.s-underline-link-text.s-link-style.a-text-normal'
	);
	const productLinks = await page.evaluate(() => {
		const products = Array.from(
			document.querySelectorAll(
				'div[data-component-type="s-search-result"]'
			)
		);

		return products
			.filter(
				(product) => !product.innerText.includes('Sponsored') // Exclude sponsored products
			)
			.map((product) => {
				const linkElement = product.querySelector(
					'a.a-link-normal.s-underline-text.s-underline-link-text.s-link-style.a-text-normal'
				);
				return linkElement ? linkElement.href : null;
			})
			.filter((href) => href !== null); // Remove null links
	});

	if (productLinks.length === 0) {
		console.log('No valid product links found.');
		await browser.close();
		return res;
	}

	const productLink = productLinks[0];
	console.log('Found product link:', productLink);

	// Connect to product page
	console.log('Going to product page...');
	await page.goto(productLink);

	// Wait for title to load and add title to res obj
	console.log('Getting title...');
	await page.waitForSelector('#productTitle');
	res.name = await page.evaluate(() => {
		const titleElement = document.querySelector('#productTitle');
		return titleElement.textContent.trim();
	});

	// Wait for price to load and get price
	console.log('Getting prices...');
	await page.waitForSelector('.a-price-whole');
	await page.waitForSelector('.a-price-fraction');
	res.price = await page.evaluate(() => {
		const priceWhole = document.querySelector('.a-price-whole');
		const priceFraction = document.querySelector('.a-price-fraction');

		return Number(
			`${priceWhole.textContent.trim()}${priceFraction.textContent.trim()}`
		);
	});

	// Wait for manufacturer to load and get manufacturer
	console.log('Getting manufacturer');
	await page.waitForSelector('.a-size-base.po-break-word');
	res.manufacturer = await page.evaluate(() => {
		const manufacturer = document.querySelector(
			'.a-size-base.po-break-word'
		);
		return manufacturer.textContent.trim();
	});

	// Wait for reviews to load and get reviews
	await page.waitForSelector('#cm-cr-dp-review-list');
	const reviews = await page.evaluate(() => {
		const reviewElements = document.querySelectorAll(
			'#cm-cr-dp-review-list .a-section.celwidget'
		);
		const topReviews = [];

		// Loop through the first 3 reviews (or all if less than 3)
		for (let i = 0; i < Math.min(reviewElements.length, 3); i++) {
			const review = reviewElements[i];

			const user =
				review.querySelector('.a-profile-name')?.textContent.trim() ||
				'Anonymous';
			const ratingElement = review.querySelector('.a-icon-alt');
			const rating = ratingElement
				? parseFloat(ratingElement.textContent.split(' ')[0])
				: null;
			const comment =
				review
					.querySelector('.review-text-content span')
					?.textContent.trim() || '';
			const date =
				review.querySelector('.review-date')?.textContent.trim() ||
				'Unknown';

			topReviews.push({ user, rating, comment, date });
		}

		return topReviews;
	});
	res.reviews = reviews;

	await browser.close();

	return res;
};

// productInfo('irobot roomba j7+');
// test();

module.exports = productInfo;

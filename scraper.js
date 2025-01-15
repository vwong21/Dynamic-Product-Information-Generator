process.env.DEBUG = 'puppeteer:page';
const { timeout } = require('puppeteer');
const puppeteer = require('puppeteer');

const scraper = async (name) => {
	const res = {};

	// Connect to headless browser
	console.log('Connecting to browser...');
	let page;
	let browser;
	try {
		browser = await puppeteer.launch({
			// Headless set to false to manually complete captcha
			headless: false,
		});

		// Create new page in browser
		console.log('Creating new page...');
		page = await browser.newPage();
	} catch (error) {
		throw new Error(`Unable to create page, with error message: ${error}`);
	}

	// Connect to Amazon
	try {
		console.log('Connecting to Amazon.ca...');
		await page.goto('https://www.amazon.ca/');
	} catch (error) {
		throw new Error(
			`Unable to connect to Amazon, with error message: ${error}`
		);
	}

	// May need to complete captcha

	// Wait for search bar to render, type name into search bar and click on search button
	try {
		console.log('Searching for item...');
		await page.waitForSelector('#twotabsearchtextbox');
		await page.waitForSelector('#nav-search-submit-button');
		await page.type('#twotabsearchtextbox', name);
		await page.click('#nav-search-submit-button');
	} catch (error) {
		throw new Error(
			`Unable to search for ${name}, with error message: ${error}`
		);
	}

	// Wait for product a tag to render and get product link
	let productLinks;
	try {
		console.log('Getting product page...');
		await page.waitForSelector(
			'a.a-link-normal.s-underline-text.s-underline-link-text.s-link-style.a-text-normal'
		);

		await page.waitForFunction(
			() =>
				document.querySelectorAll(
					'div[data-component-type="s-search-result"]'
				).length > 10
		);

		productLinks = await page.evaluate(() => {
			const products = Array.from(
				document.querySelectorAll(
					'div[data-component-type="s-search-result"]'
				)
			);
			return products
				.filter((product) => {
					// Check if the product contains the "Sponsored" tag
					const sponsoredTag = product.querySelector(
						'div.a-row.a-spacing-micro'
					);
					return !sponsoredTag; // Include only if no sponsoredTag exists
				})
				.map((product) => {
					const linkElement = product.querySelector(
						'a.a-link-normal.s-underline-text.s-link-style.a-text-normal'
					);
					return linkElement ? linkElement.href : null;
				})
				.filter((href) => href !== null);
		});

		if (productLinks.length === 0) {
			throw new Error('No valid product links found');
		}
	} catch (error) {
		throw new Error(
			`Unable to retrieve product links, with error message: ${error}`
		);
	}

	const productLink = productLinks[0];
	console.log('Found product link:', productLink);

	// Connect to product page
	try {
		console.log('Going to product page...');
		await page.goto(productLink);
	} catch (error) {
		throw new Error(
			`Unable to access product link, with error message: ${error}`
		);
	}

	// Wait for title to load and add title to res obj
	try {
		console.log('Getting title...');
		await page.waitForSelector('#productTitle');
		res.name = await page.evaluate(() => {
			const titleElement = document.querySelector('#productTitle');
			return titleElement.textContent.trim();
		});
	} catch (error) {
		throw new Error(
			`Unable to retrieve title, with error message: ${error}`
		);
	}

	// Wait for price to load and get price
	try {
		console.log('Getting prices...');
		await page.waitForSelector('.a-price-whole');
		await page.waitForSelector('.a-price-fraction');
		res.price = await page.evaluate(() => {
			const priceWhole = document.querySelector('.a-price-whole');
			const priceFraction = document.querySelector('.a-price-fraction');

			if (priceWhole && priceFraction) {
				// Remove commas from priceWhole and construct the float
				const whole = priceWhole.textContent.trim().replace(/,/g, '');
				const fraction = priceFraction.textContent.trim();
				return parseFloat(`${whole}${fraction}`);
			}
		});
	} catch (error) {
		throw new Error(
			`Unable to retrieve prices, with error message: ${error}`
		);
	}

	// Wait for manufacturer to load and get manufacturer
	try {
		console.log('Getting manufacturer');
		await page.waitForSelector('.a-size-base.po-break-word');
		res.manufacturer = await page.evaluate(() => {
			const manufacturer = document.querySelector(
				'.a-size-base.po-break-word'
			);
			return manufacturer.textContent.trim();
		});
	} catch (error) {
		throw new Error(
			`Unable to retrieve manufacturer, with error message: ${error}`
		);
	}

	// Wait for specifications to load and get specifications
	try {
		console.log('Getting specifications');
		await page.waitForSelector(
			'table#productDetails_techSpec_section_1.a-keyvalue.prodDetTable',
			{ timeout: 3000 }
		);

		// Extract the specifications after the table is loaded
		res.specifications = await page.evaluate(() => {
			const table = document.querySelector(
				'table#productDetails_techSpec_section_1.a-keyvalue.prodDetTable'
			);
			const rows = table.querySelectorAll('tbody tr');
			const specsObject = {};

			rows.forEach((row) => {
				const th = row.querySelector('th');
				const td = row.querySelector('td');
				if (th && td) {
					// Assign the th text as the key and td text as the value
					specsObject[th.textContent.trim()] = td.textContent.trim();
				}
			});

			return specsObject;
		});

		// Output the result
		console.log(res.specifications);
	} catch (error) {
		throw new Error(
			`Unable to retrieve specifications, with error message: ${error}`
		);
	}

	// Wait for reviews to load and get reviews
	try {
		console.log('getting reviews');
		await page.waitForSelector('#cm-cr-dp-review-list');
		res.reviews = await page.evaluate(() => {
			const reviewElements = document.querySelectorAll(
				'#cm-cr-dp-review-list .a-section.celwidget'
			);
			const topReviews = [];

			// Loop through the first 3 reviews (or all if less than 3)
			for (let i = 0; i < Math.min(reviewElements.length, 3); i++) {
				const review = reviewElements[i];

				const user =
					review
						.querySelector('.a-profile-name')
						?.textContent.trim() || 'Anonymous';
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
	} catch (error) {
		throw new Error(
			`Unable to retrieve reviews, with error message: ${error}`
		);
	}
	await browser.close();
	return res;
};

module.exports = scraper;

const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
	apiKey: process.env.API_KEY,
});

// Json schema for LLM
example_json = {
	product: {
		id: '12345',
		name: 'RoboBuddy 3000',
		description:
			'An interactive robot toy with AI-powered responses and educational games.',
		category: 'Toys & Games',
		manufacturer: {
			name: 'FuturePlay Inc.',
			address: {
				street: '123 Innovation Way',
				city: 'Playtown',
				state: 'California',
				postalCode: '90210',
				country: 'USA',
			},
			contact: {
				phone: '+1-800-123-4567',

				email: 'support@futureplay.com',
				website: 'https://www.futureplay.com',
			},
		},
		specifications: {
			dimensions: {
				width: '10 cm',
				height: '20 cm',
				depth: '8 cm',
			},
			weight: '1.2 kg',
			materials: ['ABS plastic', 'Silicone'],
			battery: {
				type: 'Rechargeable lithium-ion',
				capacity: '2000mAh',
				chargingTime: '2 hours',
				batteryLife: '6 hours of continuous use',
			},
			features: [
				'Voice recognition',
				'Interactive games',
				'AI learning mode',
				'LED display',
				'Bluetooth connectivity',
			],
		},
		pricing: {
			currency: 'USD',
			price: 79.99,
			discount: {
				isAvailable: true,
				percentage: 10,
				validUntil: '2024-12-31',
			},
		},
		availability: {
			inStock: true,
			stockCount: 150,
			warehouses: [
				{
					location: 'Los Angeles, CA',
					stock: 100,
				},
				{
					location: 'New York, NY',
					stock: 50,
				},
			],
		},
		reviews: [
			{
				user: 'johndoe',
				rating: 5,
				comment:
					"My kids love this toy! It's both fun and educational.",

				date: '2024-11-28',
			},
			{
				user: 'janedoe',
				rating: 4,
				comment: 'Great toy, but the battery could last longer.',
				date: '2024-11-25',
			},
		],
		tags: ['robot', 'educational', 'AI', 'kids', 'interactive'],
		relatedProducts: [
			{
				id: '67890',
				name: 'Coding Wizard Starter Kit',
				url: 'https://www.futureplay.com/products/67890',
			},
			{
				id: '11223',
				name: 'PuzzleBot Junior',
				url: 'https://www.futureplay.com/products/11223',
			},
		],
	},
};

const chatGptExecute = async (name) => {
	// Prompt to be plugged in as user to LLM. Takes the name variable
	const prompt = `Provide valid JSON output. Provide data on a product called ${name}.`;
	try {
		const completion = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo',
			response_format: { type: 'json_object' },
			messages: [
				{
					// Message from system for LLM to know what to respond
					role: 'system',
					content: `Provide output in valid JSON. The schema should be like this: ${JSON.stringify(
						example_json
					)}`,
				},
				{
					// User request
					role: 'user',
					content: prompt,
				},
			],
		});

		// Throw error if response finishes prematurely most likely due to token limit
		const finishReason = completion.choices[0].finish_reason;
		if (finishReason !== 'stop') {
			throw new Error(`Not enough tokens`);
		}

		return completion.choices[0].message.content;
	} catch (error) {
		throw new Error(error);
	}
};

module.exports = chatGptExecute;

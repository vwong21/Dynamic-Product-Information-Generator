const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
	apiKey: process.env.API_KEY,
});

// Json schema for LLM
example_json = {
	product: {
		name: 'RoboBuddy 3000',
		price: 1299.99,
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
	},
};

const error = {
	status: 'error',
	message: 'Product could not be found',
};

const llm = async (name, data) => {
	console.log('Starting LLM...');
	console.log(data.specifications);
	// Prompt to be plugged in as user to LLM. Takes the name variable and data
	const prompt = `Provide valid JSON output. Check to see if the product ${name} is the same product as ${
		data.name
	}. If the products differ, send this back:${JSON.stringify(
		error
	)}. If the products are the same, follow these steps:
	1.Following the schema strictly, fill out name, manufacturer.name, and price with ${JSON.stringify(
		data
	)}
	2. Fill out description and category based on information from the product, ${name}
	3. Do research to confirm that the manufacturer of the product, ${name} is the same manufacturer as ${
		data.manufacturer
	}. If they match, Fill out manufacturer.address, manufacturer.contact by doing research on ${
		data.manufacturer
	}. In your research, if you are unable to find information on any of the fields, omit them. If they don't match, omit the manufacturer field.
	4. Fill out the specifications with the specifications from this data: ${
		data.specifications
	}
	5. Fill out the reviews with ${JSON.stringify(data.reviews)}
`;

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
		console.log(completion.choices[0].message.content);
		return completion.choices[0].message.content;
	} catch (error) {
		throw new Error(error);
	}
};

module.exports = llm;

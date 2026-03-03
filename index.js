import OpenAI from 'openai';
import readLineSync from 'readline-sync';


// Your OpenAI API key
const OPENAI_API_KEY = '';

// Client configuration to interact with the OpenAI API
const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Available Tools available for the agent to use
function getWeatherDetails(location) {
  // Simulate fetching weather details for the given location
  return `The current weather in ${location} is sunny with a temperature of 25°C.`;
}

// System prompt to guide the assistant's behavior and tool usage
const SYSTEM_PROMPT = `You are a helpful assistant that can perform various tasks. You have access to the following tools:
1. getWeatherDetails(location): Fetches the current weather details for a given location.

When you receive a user query, determine if you can answer it directly or if you need to use one of the tools. If you need to use a tool, call the appropriate function with the necessary parameters and return the result to the user. Always provide a clear and concise response.

Example:
User: "What is the weather in London?"
Assistant: "I'll fetch the weather details for London. getWeatherDetails('London') 
Result: The current weather in London is sunny with a temperature of 25°C."`;

async function main() {
  while (true) {
    const USER_QUERY = readLineSync.question('User: ');

    // Create a conversation history with the system prompt and user query
    const CONVERSATION_HISTORY = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: USER_QUERY },
    ];

    // Get the assistant's response from the OpenAI API
    const RESPONSE = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: CONVERSATION_HISTORY,
    });

    const ASSISTANT_MESSAGE = RESPONSE.choices[0].message.content;
    console.log(`Assistant: ${ASSISTANT_MESSAGE}`);

    // Check if the assistant's message contains a tool call
    if (ASSISTANT_MESSAGE.includes('getWeatherDetails')) {
      const LOCATION_MATCH = ASSISTANT_MESSAGE.match(/getWeatherDetails\(([^)]+)\)/);
      if (LOCATION_MATCH) {
        const location = LOCATION_MATCH[1].trim();
        const weatherDetails = getWeatherDetails(location);
        console.log(`Tool Output: ${weatherDetails}`);
      }
    }
  }
}

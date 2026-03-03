import OpenAI from 'openai';   
import readLineSync from 'readline-sync';
import fetch from 'node-fetch';

// Your OpenAI API key
const OPENAI_API_KEY = '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';

// Client configuration to interact with the OpenAI API
const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Available Tools available for the agent to use
async function getWeatherDetails(location) {
  try {
    // First, get coordinates for the location using geocoding API
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
    );
    const geoData = await geoResponse.json();
    
    if (!geoData.results || geoData.results.length === 0) {
      return `Could not find location: ${location}`;
    }
    
    const { latitude, longitude, name, country } = geoData.results[0];
    
    // Fetch weather data using Open-Meteo API
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&temperature_unit=celsius`
    );
    const weatherData = await weatherResponse.json();
    
    const current = weatherData.current;
    const weatherDescription = getWeatherDescription(current.weather_code);
    
    return `The current weather in ${name}, ${country} is ${weatherDescription} with a temperature of ${current.temperature_2m}°C (feels like ${current.apparent_temperature}°C) and humidity of ${current.relative_humidity_2m}%.`;
  } catch (error) {
    return `Error fetching weather: ${error.message}`;
  }
}

// Helper function to interpret WMO weather codes
function getWeatherDescription(code) {
  const weatherCodes = {
    0: 'clear sky',
    1: 'mainly clear',
    2: 'partly cloudy',
    3: 'overcast',
    45: 'foggy',
    48: 'depositing rime fog',
    51: 'light drizzle',
    53: 'moderate drizzle',
    55: 'dense drizzle',
    61: 'slight rain',
    63: 'moderate rain',
    65: 'heavy rain',
    71: 'slight snow',
    73: 'moderate snow',
    75: 'heavy snow',
    80: 'slight rain showers',
    81: 'moderate rain showers',
    82: 'violent rain showers',
    85: 'slight snow showers',
    86: 'heavy snow showers',
    95: 'thunderstorm',
  };
  return weatherCodes[code] || 'unknown weather';
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

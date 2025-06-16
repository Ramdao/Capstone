// used examples from openweatherapi

// Import the API Key directly from environment variables
const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

// Define the base URL directly in this file
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Fetches current weather data for a given city and country code.
 * @param {string} city - The name of the city.
 * @param {string} countryCode - The two-letter country code (e.g., 'US', 'CA', 'JP').
 * @param {string} units - The units for temperature ('metric', 'imperial', 'standard'). Defaults to 'metric'.
 * @returns {Promise<Object>} A promise that resolves to the weather data.
 */
export async function fetchCurrentWeather(city, countryCode, units = 'metric') {
    if (!city || !countryCode) {
        throw new Error('City and country code are required to fetch weather data.');
    }
    
   
    if (!OPENWEATHER_API_KEY) {
        throw new Error('OpenWeather API Key is not configured. Please ensure VITE_OPENWEATHER_API_KEY is set in your .env file and your development server is restarted.');
    }

    const url = `${OPENWEATHER_BASE_URL}/weather?q=${city},${countryCode}&appid=${OPENWEATHER_API_KEY}&units=${units}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            // Attempt to parse error message from OpenWeather API response
            const errorData = await response.json();
            throw new Error(`Weather API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw error; // Re-throw to be caught by the component
    }
}
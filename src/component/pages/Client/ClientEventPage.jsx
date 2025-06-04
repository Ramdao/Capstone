import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion'; 
import '../PageGlobal.css';
import { fetchCurrentWeather } from '../../../weatherApi'; 

export default function ClientEventPage() {
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [city, setCity] = useState('Toronto'); // Default city
    const [countryCode, setCountryCode] = useState('CA'); // Default country code (Canada)
    const [units, setUnits] = useState('metric'); // Default units

    // useEffect to fetch weather when city, countryCode, or units change
    useEffect(() => {
        const getWeather = async () => {
            setLoading(true);
            setError(null); // Clear previous errors
            setWeatherData(null); // Clear previous data

            try {
                const data = await fetchCurrentWeather(city, countryCode, units);
                setWeatherData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        // Only fetch if city and countryCode are provided
        if (city && countryCode) {
            getWeather();
        }
    }, [city, countryCode, units]); // Dependencies for useEffect

    const handleCityChange = (e) => {
        setCity(e.target.value);
    };

    const handleCountryChange = (e) => {
        setCountryCode(e.target.value);
    };

    const handleUnitsChange = (e) => {
        setUnits(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent page reload on form submission
        // useEffect will re-run automatically when city/countryCode state changes
    };

    return (
        <>
            <div className='pagelayout'>
                <motion.h1
                    className='about-heading' 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    Current Weather Checker
                </motion.h1>

                <motion.div
                    className='weather-input-box' // New class for input container
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                    style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', textAlign: 'center' }}
                >
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '15px' }}>
                            <label htmlFor="city-input" style={{ marginRight: '10px', fontWeight: 'bold' }}>City:</label>
                            <input
                                id="city-input"
                                type="text"
                                value={city}
                                onChange={handleCityChange}
                                placeholder="e.g., London"
                                required
                                style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label htmlFor="country-input" style={{ marginRight: '10px', fontWeight: 'bold' }}>Country Code (2-letter):</label>
                            <input
                                id="country-input"
                                type="text"
                                value={countryCode}
                                onChange={handleCountryChange}
                                placeholder="e.g., GB, US, CA"
                                maxLength="2"
                                required
                                style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc', textTransform: 'uppercase' }}
                            />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label htmlFor="units-select" style={{ marginRight: '10px', fontWeight: 'bold' }}>Units:</label>
                            <select
                                id="units-select"
                                value={units}
                                onChange={handleUnitsChange}
                                style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
                            >
                                <option value="metric">Celsius</option>
                                <option value="imperial">Fahrenheit</option>
                                <option value="standard">Kelvin</option>
                            </select>
                        </div>
                        <motion.button
                            type="submit"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '1em' }}
                        >
                            Get Weather
                        </motion.button>
                    </form>
                </motion.div>

                <motion.div
                    className='box' 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                    style={{ padding: '20px', backgroundColor: '#e9f7ff', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', textAlign: 'center' }}
                >
                    {loading && (
                        <p style={{ fontSize: '1.1em', color: '#555' }}>Loading weather data...</p>
                    )}
                    {error && (
                        <p style={{ color: 'red', fontWeight: 'bold', fontSize: '1.1em' }}>Error: {error}</p>
                    )}
                    {weatherData && (
                        <div>
                            <h2>Weather in {weatherData.name}, {weatherData.sys.country}</h2>
                            <p style={{ fontSize: '1.5em', fontWeight: 'bold', margin: '10px 0' }}>
                                Temperature: {weatherData.main.temp}°{units === 'metric' ? 'C' : units === 'imperial' ? 'F' : 'K'}
                            </p>
                            <p style={{ fontSize: '1.2em' }}>
                                Feels like: {weatherData.main.feels_like}°{units === 'metric' ? 'C' : units === 'imperial' ? 'F' : 'K'}
                            </p>
                            <p style={{ fontSize: '1.2em' }}>
                                Description: {weatherData.weather[0].description}
                                {weatherData.weather[0].icon && (
                                    <img
                                        src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`}
                                        alt={weatherData.weather[0].description}
                                        style={{ verticalAlign: 'middle', marginLeft: '5px', width: '50px', height: '50px' }}
                                    />
                                )}
                            </p>
                            <p>Humidity: {weatherData.main.humidity}%</p>
                            <p>Wind Speed: {weatherData.wind.speed} {units === 'metric' ? 'm/s' : 'mph'}</p>
                        </div>
                    )}
                    {!loading && !error && !weatherData && (
                        <p style={{ fontSize: '1.1em', color: '#555' }}>Enter a city and country code to get weather information.</p>
                    )}
                </motion.div>
            </div>
        </>
    );
}
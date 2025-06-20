// src/component/pages/Client/ClientEventPage.jsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../PageGlobal.css'; 
import { fetchCurrentWeather } from '../../../weatherApi'; // weather API utility
import { fetchCalendarEvents } from '../../../calendarApi'; // calendar API utility

// Define a mapping of friendly names to Google Calendar IDs for holidays
const CALENDAR_OPTIONS = [
    { name: 'Canada', id: 'en.canadian%23holiday@group.v.calendar.google.com' },
    { name: 'United States', id: 'en.usa%23holiday@group.v.calendar.google.com' },
    { name: 'Japan', id: 'en.japanese%23holiday@group.v.calendar.google.com' },
    { name: 'United Kingdom', id: 'en.uk%23holiday@group.v.calendar.google.com' },
    { name: 'India', id: 'en.indian%23holiday@group.v.calendar.google.com' },
    { name: 'Australia', id: 'en.australian%23holiday@group.v.calendar.google.com' },
    { name: 'Brazil', id: 'en.brazilian%23holiday@group.v.calendar.google.com' },
    { name: 'France', id: 'en.french%23holiday@group.v.calendar.google.com' },
    { name: 'Germany', id: 'en.german%23holiday@group.v.calendar.google.com' },
    { name: 'Mexico', id: 'en.mexican%23holiday@group.v.calendar.google.com' },
];

export default function ClientEventPage({ auth }) {
    // --- Weather State ---
    const [weatherData, setWeatherData] = useState(null);
    const [weatherLoading, setWeatherLoading] = useState(false);
    const [weatherError, setWeatherError] = useState(null);
    // Initialize city and countryCode from auth prop or use defaults
    
    const [city, setCity] = useState(auth?.client?.city || 'Toronto');
    const [countryCode, setCountryCode] = useState(auth?.client?.country || 'CA');
    const [units, setUnits] = useState('metric'); // Default units for weather

    // --- Holidays State ---
    const [holidayEvents, setHolidayEvents] = useState([]);
    const [holidaysLoading, setHolidaysLoading] = useState(false);
    const [holidaysError, setHolidaysError] = useState(null);
    // State to hold the currently selected calendar ID and its country name for display
    const [selectedCalendarId, setSelectedCalendarId] = useState(CALENDAR_OPTIONS[0].id);
    const [selectedCalendarCountryName, setSelectedCalendarCountryName] = useState(CALENDAR_OPTIONS[0].name);

    // --- useEffect for Weather Fetching ---
    useEffect(() => {
        const getWeather = async () => {
            setWeatherLoading(true);
            setWeatherError(null); // Clear previous errors
            setWeatherData(null); // Clear previous data

            if (city && countryCode) {
                try {
                    const data = await fetchCurrentWeather(city, countryCode, units);
                    setWeatherData(data);
                } catch (err) {
                    setWeatherError(err.message);
                } finally {
                    setWeatherLoading(false);
                }
            } else {
                setWeatherLoading(false);
                setWeatherError('City and country code not available from profile for weather. Please update your profile or enter them manually.');
            }
        };

        getWeather();
    }, [city, countryCode, units]); 

    // --- useEffect for Holiday Calendar Determination (uses full country name) ---
    useEffect(() => {
        const getHolidaysBasedOnCountry = () => {
            setHolidaysLoading(true); // Indicate loading for holidays
            setHolidaysError(null);

            // Get the full country name directly from the auth prop
            const clientCountryNameFromAuth = auth?.client?.country;

            let finalCalendarOption = CALENDAR_OPTIONS[0]; // Default to Canada

            if (clientCountryNameFromAuth) {
                
                const foundOption = CALENDAR_OPTIONS.find(
                    (option) => option.name.toLowerCase() === clientCountryNameFromAuth.toLowerCase()
                );

                if (foundOption) {
                    finalCalendarOption = foundOption;
                } else {
                    console.warn(`Full country name '${clientCountryNameFromAuth}' from profile not found in CALENDAR_OPTIONS. Defaulting to Canada for holidays.`);
                }
            } else {
                console.warn('Client country name not available in auth prop, defaulting to Canada for holidays.');
            }

            setSelectedCalendarId(finalCalendarOption.id);
            setSelectedCalendarCountryName(finalCalendarOption.name);
            
        };

        getHolidaysBasedOnCountry();
    }, [auth]); 

    // --- useEffect for Holiday Events Fetching (depends on selectedCalendarId) ---
    useEffect(() => {
        const fetchHolidays = async () => {
            if (!selectedCalendarId) {
                
                setHolidaysLoading(false); 
                return;
            }
            setHolidaysLoading(true);
            setHolidaysError(null);
            try {
                const fetchedEvents = await fetchCalendarEvents(selectedCalendarId);
                setHolidayEvents(fetchedEvents);
            } catch (err) {
                setHolidaysError(err.message);
            } finally {
                setHolidaysLoading(false);
            }
        };

        fetchHolidays();
    }, [selectedCalendarId]); 

    // --- Handlers for manual weather input (kept as per your previous code) ---
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
        e.preventDefault(); 
        
    };

    // --- Conditional Rendering if not logged in as a client ---
    if (!auth || auth.role !== 'client' || !auth.client) {
        return (
            <div className="pagelayout">
                <h1 className="about-heading">Client Dashboard</h1>
                <div className="box">
                    <p>Please log in as a client to view personalized weather and holiday information.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className='pagelayout'>
                <motion.h1
                    className='about-heading'
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    Upcoming Events for {selectedCalendarCountryName}
                </motion.h1>

               

                <motion.div
                    className='weather-box'
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                    
                >
                    {weatherLoading && (
                        <p style={{ fontSize: '1.1em', color: '#555' }}>Loading weather data...</p>
                    )}
                    {weatherError && (
                        <p style={{ color: 'red', fontWeight: 'bold', fontSize: '1.1em' }}>Error: {weatherError}</p>
                    )}
                    {weatherData && (
                        <div className='weather-info-design'>
                            <h2>Weather in {weatherData.name}, {weatherData.sys.country}</h2>
                            <p >
                                Temperature: {weatherData.main.temp}°{units === 'metric' ? 'C' : units === 'imperial' ? 'F' : 'K'}
                            </p>
                            <p >
                                Feels like: {weatherData.main.feels_like}°{units === 'metric' ? 'C' : units === 'imperial' ? 'F' : 'K'}
                            </p>
                            <p >
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
                    {!weatherLoading && !weatherError && !weatherData && (
                        <p style={{ fontSize: '1.1em', color: '#555' }}>Enter a city and country code to get weather information, or ensure your profile has them filled.</p>
                    )}
                </motion.div>

                {/* --- Holiday Calendar Section --- */}
            <div className='holiday-container'>
                

                {holidaysLoading && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        style={{ textAlign: 'center', fontSize: '1.1em', color: '#555' }}
                    >
                        Loading upcoming holidays...
                    </motion.p>
                )}
                {holidaysError && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="error-message"
                        style={{ textAlign: 'center', color: 'red', fontSize: '1.1em' }}
                    >
                        Error loading holidays: {holidaysError}
                    </motion.p>
                )}

                {!holidaysLoading && !holidaysError && holidayEvents.length > 0 ? (
                    <div className='events-container'>
                        {holidayEvents.map((event, index) => (
                            <motion.div
                                key={event.id}
                                className='event-box'
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index, duration: 0.6, ease: "easeOut" }}
                                style={{
                                    justifyContent: 'space-between',
                                    minWidth: '200px',
                                    
                                }}
                            >
                                <h3 style={{ margin: '0 0 10px 0', color: '#007bff' }}>{event.summary}</h3>
                                <p style={{ margin: '0', fontSize: '0.95em', color: '#666' }}>Date: {event.start.date}</p>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    !holidaysLoading && !holidaysError && <p style={{ textAlign: 'center', fontSize: '1.1em', color: '#555' }}>No upcoming holidays found for this country.</p>
                )}
            </div>
        </div>
        </>
    );
}
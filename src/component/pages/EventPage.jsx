import './PageGlobal.css';
import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { fetchCalendarEvents } from '../../calendarApi'; 

// Define a mapping of friendly names to Google Calendar IDs
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

export default function EventPage() {
    const [events, setEvents] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    // State to hold the currently selected calendar ID, default to Canada
    const [selectedCalendarId, setSelectedCalendarId] = useState(CALENDAR_OPTIONS[0].id);

    useEffect(() => {
        const getHolidays = async () => {
            setLoading(true); // Set loading to true when fetching starts
            setError(null);   // Clear any previous errors
            try {
                // Pass the selectedCalendarId to the fetch function
                const fetchedEvents = await fetchCalendarEvents(selectedCalendarId);
                setEvents(fetchedEvents);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false); // Set loading to false once fetching is complete (success or error)
            }
        };

        getHolidays();
        // Add selectedCalendarId to the dependency array so useEffect runs when it changes
    }, [selectedCalendarId]);

    const handleCalendarChange = (event) => {
        setSelectedCalendarId(event.target.value);
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
                    Upcoming Holidays
                </motion.h1>

                {/* Dropdown for Calendar Selection */}
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                    <label htmlFor="calendar-select" style={{ marginRight: '10px', fontSize: '1.2em', fontWeight: 'bold' }}>
                        Select Country:
                    </label>
                    <select
                        id="calendar-select"
                        value={selectedCalendarId}
                        onChange={handleCalendarChange}
                        style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '1em' }}
                    >
                        {CALENDAR_OPTIONS.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.name}
                            </option>
                        ))}
                    </select>
                </div>

                {loading && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        style={{ textAlign: 'center', fontSize: '1.1em' }}
                    >
                        Loading upcoming holidays...
                    </motion.p>
                )}
                {error && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="error-message"
                        style={{ textAlign: 'center', color: 'red', fontSize: '1.1em' }}
                    >
                        Error loading events: {error}
                    </motion.p>
                )}

                {!loading && !error && events.length > 0 ? (
                    <div className='events-container'> {/* A container for all event-boxes */}
                        {events.map((event, index) => (
                            <motion.div
                                key={event.id}
                                className='event-box'
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                // Stagger animation for each box
                                transition={{ delay: 0.1 * index, duration: 0.6, ease: "easeOut" }}
                            >
                                <h3>{event.summary}</h3>
                                <p>Date: {event.start.date}</p>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    !loading && !error && <p style={{ textAlign: 'center', fontSize: '1.1em' }}>No upcoming holidays found for this country.</p>
                )}
            </div>
        </>
    );
}
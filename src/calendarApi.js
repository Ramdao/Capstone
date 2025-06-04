// src/api/calendarApi.js

const API_KEY = import.meta.env.VITE_CALANDER_API_KEY;
const MAX_RESULTS = 5; // Changed to 5

export async function fetchCalendarEvents(calendarIdentifier) { // Renamed and accepts calendarIdentifier
    if (!calendarIdentifier) {
        throw new Error("Calendar identifier is required.");
    }

    const timeMin = new Date().toISOString();
    // Use the passed calendarIdentifier in the URL
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarIdentifier}/events?key=${API_KEY}&maxResults=${MAX_RESULTS}&orderBy=startTime&singleEvents=true&timeMin=${timeMin}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.error.message || 'Unknown error'}`);
        }
        const data = await response.json();
        return data.items;
    } catch (error) {
        console.error('Error in fetchCalendarEvents:', error);
        throw error;
    }
}
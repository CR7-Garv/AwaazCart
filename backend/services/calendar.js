import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

// Require setting up the Google Cloud Service Account
// 1. Go to Google Cloud Console -> IAM & Admin -> Service Accounts
// 2. Create one, get keys as JSON, format it or load it via ENV
const credentials = {
    client_email: process.env.GOOGLE_CLIENT_EMAIL || "mock-email@awaazcart.iam.gserviceaccount.com",
    private_key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, '\n'),
};

const calendarId = process.env.CALENDAR_ID || 'primary';

let calendar;
try {
    const auth = new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key,
        ['https://www.googleapis.com/auth/calendar.events']
    );
    calendar = google.calendar({ version: 'v3', auth });
} catch (error) {
    console.warn("⚠️ Google Auth initialization failed. Verify GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY. Proceeding in Mock Mode.");
}

/**
 * Creates an appointment in Google Calendar for the AwaazCart Caller
 * @param {string} customerName 
 * @param {string} phone 
 * @param {string} timeSlot ISO String format
 */
export const createCalendarAppointment = async (customerName, phone, timeSlot) => {
    if (!calendar) {
        console.log(`[Mock Calendar] Booking created for ${customerName} at ${timeSlot}`);
        return { success: true, meetingLink: "https://meet.google.com/mock-link" };
    }

    const event = {
        summary: `AwaazCart Appointment: ${customerName}`,
        description: `Customer Phone: ${phone}. Booked via AI Voice Agent.`,
        start: {
            dateTime: timeSlot,
            timeZone: 'Asia/Kolkata', // Localized for Indian SMEs
        },
        end: {
            dateTime: new Date(new Date(timeSlot).getTime() + 30 * 60000).toISOString(), // +30 mins
            timeZone: 'Asia/Kolkata',
        },
    };

    try {
        const response = await calendar.events.insert({
            calendarId: calendarId,
            resource: event,
        });
        console.log(`[Google Calendar] Successfully booked: ${response.data.htmlLink}`);
        return { success: true, meetingLink: response.data.htmlLink };
    } catch (error) {
        console.error('[Google Calendar Error]', error);
        return { success: false, error: "Failed to book calendar slot." };
    }
};

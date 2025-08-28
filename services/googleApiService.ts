import { User } from '../types';

const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

if (!SCRIPT_URL) {
    console.warn("GOOGLE_SCRIPT_URL environment variable not set. User logging will be disabled.");
}

export const logNewUser = async (user: User): Promise<void> => {
    if (!SCRIPT_URL) {
        console.log("Simulating user log because SCRIPT_URL is not set:", user);
        return;
    }

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            // Using text/plain avoids a CORS preflight request, which simplifies the Google Apps Script endpoint.
            // The script can still parse the body as JSON.
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify({
                name: user.name,
                yoe: user.yoe,
                resumeLink: user.resumeLink || ''
            }),
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok. Status: ${response.status}`);
        }
        
        // We don't need to read the response body for a fire-and-forget log.
        console.log("User logged successfully to Google Sheet.");

    } catch (error) {
        console.error('Error logging new user:', error);
    }
};

export const getVisitorCount = async (): Promise<number | null> => {
    if (!SCRIPT_URL) {
        console.log("Simulating visitor count because SCRIPT_URL is not set.");
        // Return a mock count for local development to not block UI
        return 1337;
    }

    try {
        // Append a dummy query param to prevent caching
        const url = new URL(SCRIPT_URL);
        url.searchParams.append('action', 'getVisitorCount');
        url.searchParams.append('cacheBust', new Date().getTime().toString());

        const response = await fetch(url.toString(), {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok. Status: ${response.status}`);
        }

        const data = await response.json();
        return data.visitorCount;
    } catch (error) {
        console.error('Error fetching visitor count:', error);
        return null;
    }
};
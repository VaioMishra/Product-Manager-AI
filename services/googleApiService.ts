import { User } from '../types';

const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

if (!SCRIPT_URL) {
    console.warn("GOOGLE_SCRIPT_URL environment variable not set. User logging and file uploads will be disabled.");
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // result is "data:mime/type;base64,thebase64string"
            // we want to remove the prefix
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });
};

export const logNewUser = async (user: User): Promise<void> => {
    if (!SCRIPT_URL) {
        console.log("Simulating user log because SCRIPT_URL is not set:", user);
        return;
    }

    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'logUser',
                payload: {
                    name: user.name,
                    yoe: user.yoe,
                    resumeLink: user.resumeLink || ''
                }
            }),
        });
        console.log("User logged successfully to Google Sheet.");
    } catch (error) {
        console.error('Error logging new user:', error);
    }
};

export const uploadResume = async (file: File, user: User): Promise<{ success: boolean, message: string }> => {
    if (!SCRIPT_URL) {
        console.log("Simulating resume upload because SCRIPT_URL is not set.");
        return { success: true, message: "Simulated upload successful." };
    }

    try {
        const base64Data = await fileToBase64(file);
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'uploadFile',
                payload: {
                    fileName: file.name,
                    mimeType: file.type,
                    data: base64Data,
                    userName: user.name
                }
            }),
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok. Status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.status === 'success') {
            console.log("Resume uploaded successfully:", result.fileUrl);
            return { success: true, message: "Upload successful!" };
        } else {
            throw new Error(result.message || "Unknown error during upload.");
        }

    } catch (error) {
        console.error('Error uploading resume:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `Upload failed: ${errorMessage}` };
    }
};

export const getVisitorCount = async (): Promise<number | null> => {
    if (!SCRIPT_URL) {
        console.log("Simulating visitor count because SCRIPT_URL is not set.");
        return 1337;
    }

    try {
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

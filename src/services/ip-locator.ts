'use server';

/**
 * @fileOverview A service to fetch geolocation data for a given IP address.
 */

export interface IpLocation {
    city: string;
    regionName: string;
    country: string;
    query: string;
    status: 'success' | 'fail';
    message?: string;
}

/**
 * Fetches geolocation data for a given IP address from ip-api.com.
 * @param ip The IP address to locate.
 * @returns A promise that resolves to an object containing location data, or null on failure.
 */
export async function getLocationForIp(ip: string): Promise<IpLocation | null> {
    // Note: For internal/reserved IPs, the API will return a "private range" error.
    // For a real application, you might want to handle this or use a client-side IP detection method first.
    // Using a public IP like 8.8.8.8 for demo purposes works best.
    try {
        const response = await fetch(`http://ip-api.com/json/${ip}`);
        if (!response.ok) {
            console.error(`IP API request failed with status: ${response.status}`);
            return null;
        }
        const data: IpLocation = await response.json();
        if (data.status === 'fail') {
            console.error(`IP API returned an error: ${data.message}`);
            return null;
        }
        return data;
    } catch (error) {
        console.error("Failed to fetch IP location:", error);
        return null;
    }
}

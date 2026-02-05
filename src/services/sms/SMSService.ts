
export interface SMSOptions {
    numbers: string;
    message: string;
}

export class SMSService {
    private static AUTH_KEY = process.env.FAST2SMS_AUTH_KEY || "YOUR_AUTH_KEY_HERE";
    private static BASE_URL = "https://www.fast2sms.com/dev/bulkV2";

    /**
     * Sends a welcome SMS after E-Pass activation
     * @param phone The recipient's phone number
     * @param details Object containing dynamic fields for the message
     */
    static async sendActivationSMS(phone: string, details: { slotId?: string, time?: string }) {
        const welcomeMessage = `Hello! Welcome to Ooty 🌄
Your visit is confirmed.

${details.slotId ? `🅿 Parking Slot: ${details.slotId}` : "🅿 High-Demand Area. Follow Signs."}
🕒 Entry Time: ${details.time || new Date().toLocaleTimeString()}

Live updates & guidelines:
https://ooty-smart-portal.vercel.app

Thank you for supporting responsible tourism 🌱`;

        return this.sendSMS(phone, welcomeMessage);
    }

    /**
     * Core method to call Fast2SMS GET API
     */
    static async sendSMS(phoneNumber: string, message: string) {
        if (!this.AUTH_KEY || this.AUTH_KEY === "YOUR_AUTH_KEY_HERE") {
            console.warn("[SMSService] No Auth Key provided. SMS will not be sent.");
            return { success: false, error: "Missing Auth Key" };
        }

        try {
            // Fast2SMS expects numbers as a comma-separated string
            const url = new URL(this.BASE_URL);
            url.searchParams.append("authorization", this.AUTH_KEY);
            url.searchParams.append("route", "q");
            url.searchParams.append("message", message);
            url.searchParams.append("flash", "0");
            url.searchParams.append("numbers", phoneNumber);

            console.log(`[SMSService] Sending SMS to ${phoneNumber}...`);

            const response = await fetch(url.toString(), {
                method: "GET",
                headers: {
                    "cache-control": "no-cache"
                }
            });

            const result = await response.json();

            if (result.return === true) {
                console.log(`[SMSService] SMS sent successfully. ID: ${result.request_id}`);
                return { success: true, requestId: result.request_id };
            } else {
                console.error(`[SMSService] Failed to send SMS:`, result.message);
                return { success: false, error: result.message };
            }

        } catch (error: any) {
            console.error(`[SMSService] Network Error:`, error.message);
            return { success: false, error: error.message };
        }
    }
}

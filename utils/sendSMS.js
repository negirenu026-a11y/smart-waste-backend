const axios = require('axios');

const sendSMS = async (options) => {
    const accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
    const authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
    const fromPhone = (process.env.TWILIO_PHONE_NUMBER || '').trim();

    if (!accountSid || !authToken || !fromPhone || accountSid.includes('your_')) {
        throw new Error("Twilio is not configured. Check your .env file.");
    }

    let toPhone = options.phone;
    if (toPhone.length === 10 && !toPhone.startsWith('+')) {
        toPhone = `+91${toPhone}`;
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    // Create Basic Auth header
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const params = new URLSearchParams();
    params.append('To', toPhone);
    params.append('From', fromPhone);
    params.append('Body', options.message);

    try {
        const response = await axios.post(url, params, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        console.log(`SMS sent successfully via API to ${toPhone}. Message SID: ${response.data.sid}`);
    } catch (error) {
        console.error("Twilio API Error:", error.response ? error.response.data : error.message);
        const errorMessage = error.response?.data?.message || error.message;
        throw new Error(`Twilio Error: ${errorMessage}`);
    }
};

module.exports = sendSMS;

const sgMail = require('@sendgrid/mail');

const sendEmail = async (options) => {
    if (!process.env.SENDGRID_API_KEY) {
        console.error("SendGrid API Key is missing");
        throw new Error("Email service is not configured.");
    }
    
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
        to: options.email,
        from: process.env.SENDGRID_FROM_EMAIL || "ranunegi407@gmail.com",
        subject: options.subject,
        text: options.message,
        html: options.html || `<p>${options.message}</p>`,
    };

    try {
        await sgMail.send(msg);
        console.log('Email sent successfully via SendGrid to:', options.email);
    } catch (error) {
        console.error('SendGrid Error:', error);
        if (error.response) {
            console.error(error.response.body);
        }
        throw new Error('Email could not be sent');
    }
};

module.exports = sendEmail;

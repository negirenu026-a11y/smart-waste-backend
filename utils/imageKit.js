const ImageKit = require("imagekit");

function isConfigured() {
    return Boolean(
        process.env.IMAGEKIT_PUBLIC_KEY &&
        process.env.IMAGEKIT_PRIVATE_KEY &&
        process.env.IMAGEKIT_URL_ENDPOINT
    );
}

let client = null;

function getImageKit() {
    if (!isConfigured()) return null;
    if (!client) {
        client = new ImageKit({
            publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
            urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT.replace(/\/$/, ""),
        });
    }
    return client;
}

/**
 * @param {Buffer} buffer
 * @param {string} fileName
 * @param {string} [folder] e.g. "/wastewise/complaints"
 * @returns {Promise<string>} absolute file URL on ImageKit CDN
 */
async function uploadBuffer(buffer, fileName, folder = "/wastewise") {
    const ik = getImageKit();
    if (!ik) {
        throw new Error(
            "ImageKit is not configured. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in .env."
        );
    }
    const result = await ik.upload({
        file: buffer,
        fileName,
        folder,
        useUniqueFileName: true,
    });
    if (!result || !result.url) {
        throw new Error("ImageKit upload did not return a URL.");
    }
    return result.url;
}

module.exports = { getImageKit, isConfigured, uploadBuffer };

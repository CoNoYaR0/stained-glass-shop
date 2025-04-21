const axios = require("axios");

exports.handler = async function (event) {
  const encodedUrl = event.queryStringParameters?.url;

  if (!encodedUrl) {
    return {
      statusCode: 400,
      body: "Missing image URL"
    };
  }

  const imageUrl = decodeURIComponent(encodedUrl);

  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      headers: {
        DOLAPIKEY: process.env.DOLIBARR_TOKEN,
        Accept: "image/png"
      }
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": response.headers["content-type"] || "image/png",
        "Cache-Control": "public, max-age=86400"
      },
      body: Buffer.from(response.data).toString("base64"),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error("Proxy image error:", error.message);
    return {
      statusCode: 404,
      body: "Image not found"
    };
  }
};
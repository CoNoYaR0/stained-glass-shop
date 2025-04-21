const axios = require("axios");
const fs = require("fs");
const path = require("path");

exports.handler = async function (event, context) {
  const ref = event.queryStringParameters?.ref;
  if (!ref) {
    return {
      statusCode: 400,
      body: "Missing product ref"
    };
  }

  const encodedRef = encodeURIComponent(ref.trim().replace(/\s+/g, "_"));
  const fallbackPath = path.resolve(__dirname, "..", "..", "static", "images", "products", "default.png");
  const imageUrl = `https://7ssab.stainedglass.tn/document.php?modulepart=product&entity=1&file=${encodedRef}%2F${encodedRef}-showcase-1.png`;

  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      headers: {
        DOLAPIKEY: process.env.DOLIBARR_TOKEN
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
    console.warn("Image proxy failed, using fallback:", error.message);
    const fallback = fs.readFileSync(fallbackPath);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400"
      },
      body: fallback.toString("base64"),
      isBase64Encoded: true
    };
  }
};

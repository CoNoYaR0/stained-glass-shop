const axios = require("axios");

exports.handler = async function (event, context) {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  const { token } = event.queryStringParameters;

  if (!token) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing payment token" }),
    };
  }

  try {
    const response = await axios.get(
      `https://sandbox.paymee.tn/api/v1/payments/${token}/check`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${process.env.PAYMEE_API_KEY}`,
        },
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    console.error("Error checking payment:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to check payment" }),
    };
  }
};

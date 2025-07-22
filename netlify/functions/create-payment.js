const axios = require("axios");

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  const { cart } = JSON.parse(event.body);

  if (!cart || cart.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Cart is empty" }),
    };
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  try {
    const response = await axios.post(
      "https://sandbox.paymee.tn/api/v1/payments/create",
      {
        amount: total,
        note: "Order from stainedglass.tn",
        first_name: "Anonymous",
        last_name: "User",
        email: "user@example.com",
        phone: "+21612345678",
        return_url: "https://stainedglass.tn/merci",
        cancel_url: "https://stainedglass.tn/checkout",
        webhook_url: "https://stainedglass.tn/api/paymee-webhook",
      },
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
    console.error("Error creating payment:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to create payment" }),
    };
  }
};

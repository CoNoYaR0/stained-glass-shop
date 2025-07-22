const axios = require("axios");

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  const { name, email, address, city, country, zip, cart } = JSON.parse(
    event.body
  );

  if (!name || !email || !address || !city || !country || !zip || !cart || cart.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing required fields" }),
    };
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  try {
    // Here you would typically save the order to your database.
    // For this example, we'll just log it.
    console.log("Creating order:", {
      name,
      email,
      address,
      city,
      country,
      zip,
      total,
      cart,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Order created successfully" }),
    };
  } catch (error) {
    console.error("Error creating order:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to create order" }),
    };
  }
};

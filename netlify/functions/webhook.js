exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  const { payment } = JSON.parse(event.body);

  if (!payment) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing payment data" }),
    };
  }

  // Here you would typically update the order in your database
  // to mark it as paid. For this example, we'll just log it.
  console.log("Payment received:", payment);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Webhook received successfully" }),
  };
};

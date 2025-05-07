// /.netlify/functions/paymee-status.js
const fetch = require("node-fetch");

exports.handler = async (event) => {
  const note = event.queryStringParameters.note;
  if (!note) {
    return { statusCode: 400, body: "Missing note" };
  }

  const res = await fetch(`https://app.paymee.tn/api/v1/payments/${note}`, {
    headers: {
      "Authorization": `Token ${process.env.PAYMEE_API_KEY}`
    }
  });

  const data = await res.json();
  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
};

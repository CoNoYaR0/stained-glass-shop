const fs = require("fs");
const path = require("path");
const axios = require("axios");

const API_BASE = process.env.URL || "https://stainedglass.tn";
const SECRET_KEY = process.env.ORDER_SECRET;

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" })
    };
  }

  try {
    const payload = JSON.parse(event.body);
    const token = payload.note;
    const filePath = path.join("/tmp/pending-orders", `${token}.json`);

    if (!payload.status || payload.status !== "success") {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Ignored non-success status" })
      };
    }

    if (!fs.existsSync(filePath)) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Commande introuvable" })
      };
    }

    const data = JSON.parse(fs.readFileSync(filePath));

    const res = await axios.post(`${API_BASE}/.netlify/functions/create-order`, data, {
      headers: {
        "x-secret-key": SECRET_KEY,
        "Content-Type": "application/json"
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, from: "webhook", result: res.data })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur serveur webhook" })
    };
  }
};
// netlify/functions/track-view.js

const fs = require("fs");
const path = require("path");
const fsp = require("fs/promises");

const TRACK_PATH = path.join(__dirname, "../../data/views.json");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Méthode non autorisée"
    };
  }

  const { slug } = JSON.parse(event.body || "{}");
  if (!slug) {
    return {
      statusCode: 400,
      body: "Champ 'slug' requis"
    };
  }

  try {
    let data = {};
    if (fs.existsSync(TRACK_PATH)) {
      const raw = await fsp.readFile(TRACK_PATH, "utf8");
      data = JSON.parse(raw);
    }

    if (!data[slug]) {
      data[slug] = { vues: 0, commandes: 0 };
    }

    data[slug].vues += 1;

    await fsp.writeFile(TRACK_PATH, JSON.stringify(data, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error("Erreur suivi vue:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur serveur" })
    };
  }
};

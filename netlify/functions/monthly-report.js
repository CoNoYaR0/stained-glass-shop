// netlify/functions/monthly-report.js
const fs = require("fs");
const path = require("path");

exports.handler = async function () {
  try {
    const folder = path.resolve("./data/monthly");
    const viewsFile = path.resolve("./data/views.json");

    if (!fs.existsSync(viewsFile)) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Aucune donnée à archiver." })
      }
    }

    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

    const raw = fs.readFileSync(viewsFile);
    const data = JSON.parse(raw);

    const now = new Date();
    const mois = now.toLocaleString("fr-FR", { month: "long", year: "numeric" }).replace(" ", "-");
    const filename = path.join(folder, `stats-${mois}.json`);

    fs.writeFileSync(filename, JSON.stringify(data, null, 2));

    // Reset views.json pour le mois suivant
    const reset = {};
    Object.keys(data).forEach(k => (reset[k] = { views: 0, commandes: 0 }));
    fs.writeFileSync(viewsFile, JSON.stringify(reset, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({ archived: true, fichier: filename })
    }
  } catch (err) {
    console.error("Erreur monthly-report:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur archivage stats mensuelles." })
    }
  }
};

// netlify/functions/daily-report.js
const fs = require("fs");
const path = require("path");

exports.handler = async function () {
  try {
    const dataPath = path.resolve("./data/views.json");
    if (!fs.existsSync(dataPath)) {
      return { statusCode: 200, body: JSON.stringify({ message: "Aucune donnée à afficher." }) };
    }

    const raw = fs.readFileSync(dataPath);
    const stats = JSON.parse(raw);

    let totalViews = 0;
    let totalCmds = 0;
    let lignes = [];

    for (const slug in stats) {
      const { views, commandes } = stats[slug];
      totalViews += views;
      totalCmds += commandes;
      const taux = views > 0 ? ((commandes / views) * 100).toFixed(1) : "0";

      lignes.push({
        produit: slug,
        vues: views,
        commandes,
        conversion: `${taux}%`
      });
    }

    lignes.sort((a, b) => b.vues - a.vues);

    const global = {
      total_produits: Object.keys(stats).length,
      total_vues: totalViews,
      total_commandes: totalCmds,
      taux_global: totalViews > 0 ? ((totalCmds / totalViews) * 100).toFixed(1) + "%" : "0%"
    };

    return {
      statusCode: 200,
      body: JSON.stringify({ global, details: lignes })
    };
  } catch (err) {
    console.error("Erreur daily-report:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur lors du rapport quotidien." })
    };
  }
};

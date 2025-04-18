// netlify/functions/create-order.js
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

exports.handler = async function (event) {
  console.log("[START] create-order function triggered");

  if (event.httpMethod !== "POST") {
    console.warn("[WARN] Méthode non autorisée :", event.httpMethod);
    return { statusCode: 405, body: "Méthode non autorisée" };
  }

  const secretHeader = event.headers["x-secret-key"];
  if (secretHeader !== process.env.ORDER_SECRET_KEY) {
    console.warn("[SECURITY] Clé secrète invalide :", secretHeader);
    return { statusCode: 401, body: "Clé secrète invalide" };
  }

  let client, cart;
  try {
    ({ client, cart } = JSON.parse(event.body));
    console.log("[INPUT] Client:", client);
    console.log("[INPUT] Cart:", cart);
  } catch (parseError) {
    console.error("[ERROR] JSON parsing failed:", parseError);
    return { statusCode: 400, body: "Format JSON invalide." };
  }

  if (!client?.email || !Array.isArray(cart)) {
    console.error("[ERROR] Données manquantes client/panier");
    return { statusCode: 400, body: "Données client ou panier invalides." };
  }

  const dolibarrUrl = process.env.DOLIBARR_API;
  if (!dolibarrUrl || !dolibarrUrl.startsWith("http")) {
    console.error("[FATAL] Variable DOLIBARR_API invalide ou manquante :", dolibarrUrl);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Configuration API Dolibarr invalide." })
    };
  }
  console.log("[DEBUG] DOLIBARR_API =", dolibarrUrl);

  try {
    const dolibarrKey = process.env.DOLIBARR_KEY;
    const headers = { "DOLAPIKEY": dolibarrKey, "Content-Type": "application/json" };

    // Étape 1 - Vérification ou création client
    console.log("[STEP 1] Vérification du client existant...");
    const checkRes = await fetch(`${dolibarrUrl}/thirdparties?sqlfilters=(email:=:${client.email})`, { headers });
    const existingClients = await checkRes.json();
    console.log("[DOLIBARR] Clients trouvés:", existingClients);
    let clientId = existingClients?.[0]?.id;

    if (!clientId) {
      console.log("[STEP 1.1] Création du client");
      const newClient = await fetch(`${dolibarrUrl}/thirdparties`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: client.name,
          email: client.email,
          zip: client.zip,
          town: client.city,
          address: client.address,
          country_id: 1
        })
      });
      const created = await newClient.json();
      console.log("[DOLIBARR] Client créé:", created);
      clientId = created.id;
    }

    // Étape 2 - Création de la facture
    console.log("[STEP 2] Création de la facture...");
    const factureRes = await fetch(`${dolibarrUrl}/invoices`, {
      method: "POST",
      headers,
      body: JSON.stringify({ socid: clientId, type: 0, note_private: "Via site" })
    });
    const facture = await factureRes.json();
    console.log("[DOLIBARR] Facture créée:", facture);
    const factureId = facture.id;

    // Étape 3 - Ajout des lignes
    console.log("[STEP 3] Ajout des lignes de facture...");
    for (let item of cart) {
      console.log("[LINE] Ajout produit:", item);
      await fetch(`${dolibarrUrl}/invoices/${factureId}/lines`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          fk_product: item.id,
          qty: item.qty,
          subprice: item.price,
          tva_tx: item.vat || 0,
          desc: item.name
        })
      });
    }

    // Étape 4 - Validation
    console.log("[STEP 4] Validation de la facture...");
    await fetch(`${dolibarrUrl}/invoices/${factureId}/validate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ notrigger: 0 })
    });

    // Étape 5 - Tracking
    console.log("[STEP 5] Tracking commandes vues.json...");
    const viewsPath = path.resolve("./data/views.json");
    let stats = {};
    if (fs.existsSync(viewsPath)) {
      stats = JSON.parse(fs.readFileSync(viewsPath));
    }
    cart.forEach(item => {
      if (!stats[item.slug]) stats[item.slug] = { views: 0, commandes: 0 };
      stats[item.slug].commandes += 1;
    });
    fs.writeFileSync(viewsPath, JSON.stringify(stats, null, 2));

    // Étape 6 - Envoi email
    console.log("[STEP 6] Envoi de l'e-mail de facture...");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: `Commande StainedGlass <${process.env.SMTP_USER}>`,
      to: client.email,
      subject: "Votre facture - Stained Glass",
      text: `Bonjour ${client.name},\n\nMerci pour votre commande. Voici votre facture.`,
      html: `<p>Bonjour <b>${client.name}</b>,</p><p>Merci pour votre commande. Voici votre facture.</p>`,
      attachments: [
        {
          filename: `facture-${factureId}.pdf`,
          path: `${dolibarrUrl}/documents/invoices/${facture.ref}/pdf`,
          headers: { DOLAPIKEY: dolibarrKey }
        }
      ]
    });

    console.log("[SUCCESS] Facture envoyée et commande finalisée.");
    return {
      statusCode: 200,
      body: JSON.stringify({ factureId, message: "Commande validée et envoyée." })
    };
  } catch (err) {
    console.error("[ERROR] Erreur create-order:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur serveur lors de la création de commande." })
    };
  }
};
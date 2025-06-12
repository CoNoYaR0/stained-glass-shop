const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Méthode non autorisée" })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { nom, prenom, email, tel, adresse, amount, cart } = body;

    console.info("🎯 Création de paiement Paymee pour:", nom, prenom);

    const PAYMEE_TOKEN = process.env.PAYMEE_TOKEN;
    const PAYMEE_VENDOR = process.env.PAYMEE_VENDOR;

    const note = `SG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const return_url = "https://stainedglass.tn/merci";
    const webhook_url = "https://stainedglass.tn/.netlify/functions/webhook";
    
    const payload = {
  vendor: PAYMEE_VENDOR,
  amount: amount,
  note: note,
  first_name: nom,
  last_name: prenom,
  phone_number: tel,
  email: email,
  success_url: return_url,
  fail_url: return_url,
  webhook_url: webhook_url,
  redirect_url: return_url  // 🛠️ clé manquante pour forcer la redirection
};


    const headers = {
      "Content-Type": "application/json",
      Authorization: `Token ${PAYMEE_TOKEN}`
    };

    const response = await axios.post(
      "https://app.paymee.tn/api/v2/payments/create",
      payload,
      { headers }
    );

    // Enregistrement dans Supabase avec tentatives
    const MAX_RETRIES = 3;
    let lastSupabaseError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.info(`ℹ️ Tentative ${attempt}/${MAX_RETRIES} d'insertion Supabase pour la note: ${note}`);
        const { error: supabaseError } = await supabase.from("pending_orders").insert({
          note: note,
          data: {
            customer: { nom, prenom, email, tel, adresse },
            cart: cart.map((p) => ({
              id: p.id,
              qty: p.quantity,
              price_ht: p.price,
              tva: 20
            })),
            totalTTC: amount,
            paiement: "cb"
          }
        });

        if (supabaseError) {
          lastSupabaseError = supabaseError;
          console.error(`❌ Erreur insertion Supabase (tentative ${attempt}/${MAX_RETRIES}):`, lastSupabaseError);
          if (attempt < MAX_RETRIES) {
            console.info(`ℹ️ Attente de 1 seconde avant la prochaine tentative...`);
            await delay(1000);
          }
        } else {
          console.info(`✅ Insertion Supabase réussie (tentative ${attempt}/${MAX_RETRIES}) pour la note: ${note}`);
          lastSupabaseError = null; // Réinitialiser l'erreur en cas de succès
          break; // Sortir de la boucle si l'insertion réussit
        }
      } catch (e) {
        lastSupabaseError = e; // Attribuer l'exception à lastSupabaseError
        console.error(`💥 Exception lors de l'insertion Supabase (tentative ${attempt}/${MAX_RETRIES}):`, lastSupabaseError);
        if (attempt < MAX_RETRIES) {
          console.info(`ℹ️ Attente de 1 seconde avant la prochaine tentative...`);
          await delay(1000);
        }
      }
    }

    if (lastSupabaseError) {
      console.error(`❌ Échec de toutes les tentatives d'insertion Supabase pour la note: ${note}. Dernière erreur:`, lastSupabaseError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Erreur Supabase après plusieurs tentatives", details: lastSupabaseError })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(response.data)
    };
  } catch (err) {
    console.error("💥 Erreur create-payment:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur interne" })
    };
  }
};

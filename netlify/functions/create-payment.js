export async function handler(event) {
    const body = JSON.parse(event.body);
  
    // ✅ Domaine dynamique : Netlify > fallback netlify.app a changer avec https://stainedglass.tn
    const DOMAIN = process.env.DOMAIN || "https://resplendent-centaur-abf462.netlify.app";
  
    const response = await fetch("https://sandbox.paymee.tn/api/v2/payments/create", {
      method: "POST",
      headers: {
        "Authorization": "Token 43acae674b258afc9219af50d778c12781455a0f",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        vendor: 3724,
        amount: body.amount,
        note: "Commande checkout",
        first_name: body.prenom,
        last_name: body.nom,
        email: body.email,
        phone: body.tel,
        return_url: DOMAIN + "/merci",
        cancel_url: DOMAIN + "/checkout",
        webhook_url: DOMAIN + "/webhook"
      })
    });
  
    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  }
  
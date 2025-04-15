
// netlify/functions/login-admin.js

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Méthode non autorisée" };
  }

  const { password } = JSON.parse(event.body || "{}");
  const expected = process.env.ADMIN_DASH_PASSWORD;

  if (!expected || password !== expected) {
    return {
      statusCode: 401,
      body: JSON.stringify({ success: false, error: "Mot de passe invalide." })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};

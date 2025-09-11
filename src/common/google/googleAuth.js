// utils/googleAuth.js
const axios = require("axios");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function googleAuthenticate(code) {
  try {
    // Exchange code for tokens
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }
    );

    const { id_token, access_token } = tokenResponse.data;

    // Verify id_token
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload(); // { email, name, picture, sub }
    return { payload, tokens: { id_token, access_token } };
  } catch (err) {
    console.error(
      "Error during Google authentication:",
      err.response?.data || err.message
    );
    throw new Error("Google authentication failed");
  }
}

module.exports = { googleAuthenticate };

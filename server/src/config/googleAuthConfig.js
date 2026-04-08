const fs = require("fs");
const path = require("path");
const { OAuth2Client } = require("google-auth-library");

const GOOGLE_AUTH_PATH = path.join(__dirname, "..", "..", "google_auth.json");

// cachedConfig = undefined -> not loaded yet
// cachedConfig = null -> missing/invalid file
// cachedConfig = object -> ok
let cachedConfig;

// reads server/google_auth.json (Google Cloud OAuth client)
function readGoogleAuthConfig() {
  if (cachedConfig !== undefined) {
    return cachedConfig;
  }

  let raw;
  try {
    raw = fs.readFileSync(GOOGLE_AUTH_PATH, "utf8");
  } catch {
    cachedConfig = null;
    return null;
  }

  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    cachedConfig = null;
    return null;
  }

  const block = json.installed || json.web;
  if (!block || typeof block.client_id !== "string" || !block.client_id.trim()) {
    cachedConfig = null;
    return null;
  }

  const secret =
    typeof block.client_secret === "string" && block.client_secret.trim()
      ? block.client_secret.trim()
      : null;

  cachedConfig = {
    clientId: block.client_id.trim(),
    clientSecret: secret,
    tokenUri: typeof block.token_uri === "string" ? block.token_uri : null,
    authUri: typeof block.auth_uri === "string" ? block.auth_uri : null,
  };
  return cachedConfig;
}

// PKCE code exchange at Google's token endpoint; returns id_token from Google's JSON response
async function exchangeGoogleAuthCode({ code, codeVerifier, redirectUri, clientId, clientSecret }) {
  const oauth2Client = new OAuth2Client({
    clientId,
    clientSecret: clientSecret || undefined,
    redirectUri,
  });
  try {
    const { tokens } = await oauth2Client.getToken({
      code,
      codeVerifier,
    });
    if (!tokens.id_token) {
      return { ok: false, message: "Google did not return an id_token" };
    }
    return { ok: true, idToken: tokens.id_token };
  } catch (err) {
    const data = err.response?.data;
    const msg =
      (typeof data?.error_description === "string" && data.error_description) ||
      (typeof data?.error === "string" && data.error) ||
      err.message ||
      "Google code exchange failed";
    return { ok: false, message: String(msg) };
  }
}

// verifies ID token signature, aud, iss, exp via Google's JWKS
async function verifyGoogleIdToken(idToken, expectedClientId) {
  const client = new OAuth2Client(expectedClientId);
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: expectedClientId,
    });
    return { ok: true, payload: ticket.getPayload() };
  } catch (err) {
    return { ok: false, message: err.message || "Invalid Google ID token" };
  }
}

module.exports = {
  readGoogleAuthConfig,
  exchangeGoogleAuthCode,
  verifyGoogleIdToken,
  GOOGLE_AUTH_PATH,
};

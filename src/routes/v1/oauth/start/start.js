import { getClient } from "oauth/config";
import { generators } from "openid-client";

export default async function(req, res) {
  const providerName = req.query.provider;
  const client = await getClient(providerName);
  const nonce = generators.nonce();
  const url = await client.authUrl(nonce);
  const isDev = process.env.NODE_ENV === "development";
  const options = { httpOnly: true };
  if (!isDev) options.secure = true;
  res.cookie("nonce", nonce, options);
  res.redirect(url);
}

// Docker registry needs a libtrust compatible "kid" field in the JWT.
// This is generated from the configured cert.
// Below is a modified version of a code snippet provided here:
// https://github.com/docker/distribution/issues/813#issuecomment-171955975

import forge from "node-forge";
import crypto from "crypto";
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateKid(crt) {
  let cert = forge.pki.certificateFromPem(crt);
  let asn1 = forge.pki.publicKeyToAsn1(cert.publicKey);
  let der = forge.asn1.toDer(asn1);
  let buf = Buffer.from(der.getBytes(), "binary");
  let hash = crypto
    .createHash("sha256")
    .update(buf)
    .digest();
  let base32 = base32encode(hash.slice(0, 30));

  // Create key id (fingerprint)
  let kid = "";
  for (let i = 0; i < 48; ++i) {
    kid += base32[i];
    if (i % 4 === 3 && i + 1 !== 48) {
      kid += ":";
    }
  }
  return kid;
}

export function base32encode(value) {
  let skip = 0;
  let bits = 0;
  let output = "";

  // Iterate over bytes
  let i = 0;
  while (i < value.length) {
    let v = value[i];
    if (typeof v == "string") {
      v = v.charCodeAt(0);
    }

    // Set current bits
    if (skip < 0) {
      // We have a carry from the previous byte
      bits |= v >> -skip;
    } else {
      // No carry
      bits = (v << skip) & 248;
    }

    // Produce a character if there is enough data, otherwise, get more data
    if (skip < 4) {
      output += alphabet[bits >> 3];
      skip += 5;
    } else {
      skip -= 8;
      i++;
    }
  }

  // Consume any remaining bits left
  output += skip < 0 ? alphabet[bits >> 3] : "";

  return output;
}

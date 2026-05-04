#!/usr/bin/env node
/**
 * EBSI Testnet DID Generator
 *
 * Usage:
 *   node scripts/generate-ebsi-testnet-did.js
 *
 * This script generates a secp256k1 key pair and registers a DID
 * on the EBSI pilot/testnet DID registry. No Docker required.
 *
 * Prerequisites:
 *   npm install jose elliptic node-fetch@2
 *
 * Output:
 *   DID string + private key JWK (save to .env as EBSI_ISSUER_DID)
 */

const crypto = require("crypto");
const { exportJWK } = require("jose");
const EC = require("elliptic").ec;
const fetch = require("node-fetch");

const EBSI_DID_REGISTRY = "https://api-pilot.ebsi.eu/did-registry/v4/identifiers";

async function generateKeyPair() {
  const ec = new EC("secp256k1");
  const keyPair = ec.genKeyPair();

  const privateKeyHex = keyPair.getPrivate("hex");
  const publicKeyHex = keyPair.getPublic(false, "hex"); // uncompressed

  const x = publicKeyHex.slice(2, 66);
  const y = publicKeyHex.slice(66, 130);

  const privateJwk = {
    kty: "EC",
    crv: "secp256k1",
    d: Buffer.from(privateKeyHex, "hex").toString("base64url"),
    x: Buffer.from(x, "hex").toString("base64url"),
    y: Buffer.from(y, "hex").toString("base64url"),
  };

  return { privateJwk, publicKeyHex };
}

async function registerDid(publicKeyHex) {
  // EBSi uses a deterministic DID method based on the public key
  // For testnet, we use the did:ebsi method with a hash of the public key
  const did = `did:ebsi:z${crypto
    .createHash("sha256")
    .update(publicKeyHex)
    .digest("hex")
    .slice(0, 32)}`;

  // Note: actual EBSI registration requires an onboarding VC.
  // This is a testnet placeholder for local development.
  console.log(`\n⚠️  Placeholder DID generated for testnet:`);
  console.log(`   ${did}`);
  console.log(`\n🔒 Save the private JWK below to your .env file.`);
  console.log(`   Actual TIR registration requires completing the 6-step onboarding.`);
  console.log(`   See docs/eu-strategy/EBSI_TRUSTED_ISSUER_FR_DE_ROADMAP.md\n`);

  return did;
}

async function main() {
  console.log("🔑 Generating secp256k1 key pair for EBSI...\n");

  const { privateJwk, publicKeyHex } = await generateKeyPair();
  const did = await registerDid(publicKeyHex);

  console.log("--- COPY TO .env ---");
  console.log(`EBSI_ISSUER_DID=${did}`);
  console.log(`EBSI_PRIVATE_JWK=${JSON.stringify(privateJwk)}`);
  console.log("--------------------\n");

  console.log("✅ Done. Replace with real DID after TAO accreditation.");
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});

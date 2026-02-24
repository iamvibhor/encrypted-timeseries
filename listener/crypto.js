const crypto = require("crypto");

const PASS_KEY = "super_secret_pass";

function decrypt(text) {
  const [ivHex, encryptedHex] = text.split(":");
  const key = crypto.createHash("sha256").update(PASS_KEY).digest();

  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-ctr", key, iv);
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);

  return decrypted.toString();
}

function verifySecret(payload) {
  const clone = { ...payload };
  const originalSecret = clone.secret_key;
  delete clone.secret_key;

  const recalculated = crypto
    .createHash("sha256")
    .update(JSON.stringify(clone))
    .digest("hex");

  return originalSecret === recalculated;
}

module.exports = { decrypt, verifySecret };

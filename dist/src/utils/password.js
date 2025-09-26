"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
// src/utils/password.ts
const crypto_1 = __importDefault(require("crypto"));
const SCRYPT_N = 16384;
const SCRYPT_r = 8;
const SCRYPT_p = 1;
const KEYLEN = 64;
const SALT_BYTES = 16;
function b64url(buf) {
    return Buffer.from(buf)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}
function fromB64url(s) {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
    return Buffer.from(s + "=".repeat(pad), "base64");
}
async function hashPassword(password) {
    const salt = crypto_1.default.randomBytes(SALT_BYTES);
    const hash = await new Promise((resolve, reject) => crypto_1.default.scrypt(password, salt, KEYLEN, { N: SCRYPT_N, r: SCRYPT_r, p: SCRYPT_p }, (err, derivedKey) => {
        if (err)
            reject(err);
        else
            resolve(derivedKey);
    }));
    return `scrypt$${SCRYPT_N}$${SCRYPT_r}$${SCRYPT_p}$${b64url(salt)}$${b64url(hash)}`;
}
async function verifyPassword(password, stored) {
    try {
        const [alg, N, r, p, saltB64, hashB64] = stored.split("$");
        if (alg !== "scrypt")
            return false;
        const salt = fromB64url(saltB64);
        const expected = fromB64url(hashB64);
        const dk = await new Promise((resolve, reject) => crypto_1.default.scrypt(password, salt, expected.length, { N: +N, r: +r, p: +p }, (err, derivedKey) => {
            if (err)
                reject(err);
            else
                resolve(derivedKey);
        }));
        return crypto_1.default.timingSafeEqual(dk, expected);
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=password.js.map
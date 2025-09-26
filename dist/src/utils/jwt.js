"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signJWT = signJWT;
exports.verifyJWT = verifyJWT;
// src/utils/jwt.ts - VERSÃO TYPESCRIPT
const crypto_1 = __importDefault(require("crypto"));
function b64url(input) {
    return Buffer.from(JSON.stringify(input))
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}
function b64urlRaw(buf) {
    return Buffer.from(buf)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}
function parseB64urlJSON(part) {
    const s = part.replace(/-/g, "+").replace(/\_/g, "/");
    const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
    return JSON.parse(Buffer.from(s + "=".repeat(pad), "base64").toString("utf8"));
}
function signJWT(payload, options) {
    const { secret, expiresInSec = 3600 } = options;
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const body = { iat: now, exp: now + expiresInSec, ...payload };
    const head = b64url(header);
    const pay = b64url(body);
    const data = `${head}.${pay}`;
    const sig = crypto_1.default.createHmac("sha256", secret).update(data).digest();
    return `${data}.${b64urlRaw(sig)}`;
}
function verifyJWT(token, options) {
    const { secret } = options;
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) {
        throw new Error("Token malformado");
    }
    const data = `${h}.${p}`;
    const expected = crypto_1.default.createHmac("sha256", secret).update(data).digest();
    const given = Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + "==", "base64");
    if (!crypto_1.default.timingSafeEqual(expected, given)) {
        throw new Error("Assinatura inválida");
    }
    const payload = parseB64urlJSON(p);
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
        throw new Error("Token expirado");
    }
    return payload;
}
//# sourceMappingURL=jwt.js.map
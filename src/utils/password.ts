// src/utils/password.ts
import crypto from "crypto";

const SCRYPT_N = 16384;
const SCRYPT_r = 8;
const SCRYPT_p = 1;
const KEYLEN = 64;
const SALT_BYTES = 16;

function b64url(buf: Buffer): string {
    return Buffer.from(buf)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

function fromB64url(s: string): Buffer {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
    return Buffer.from(s + "=".repeat(pad), "base64");
}

export async function hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(SALT_BYTES);
    const hash = await new Promise < Buffer > ((resolve, reject) =>
        crypto.scrypt(
            password,
            salt,
            KEYLEN,
            { N: SCRYPT_N, r: SCRYPT_r, p: SCRYPT_p },
            (err, derivedKey) => {
                if (err) reject(err);
                else resolve(derivedKey);
            }
        )
    );

    return `scrypt$${SCRYPT_N}$${SCRYPT_r}$${SCRYPT_p}$${b64url(salt)}$${b64url(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
    try {
        const [alg, N, r, p, saltB64, hashB64] = stored.split("$");

        if (alg !== "scrypt") return false;

        const salt = fromB64url(saltB64);
        const expected = fromB64url(hashB64);

        const dk = await new Promise < Buffer > ((resolve, reject) =>
            crypto.scrypt(
                password,
                salt,
                expected.length,
                { N: +N, r: +r, p: +p },
                (err, derivedKey) => {
                    if (err) reject(err);
                    else resolve(derivedKey);
                }
            )
        );

        return crypto.timingSafeEqual(dk, expected);
    } catch {
        return false;
    }
}
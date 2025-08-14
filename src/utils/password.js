import crypto from "crypto"

const SCRYPT_N = 16384, SCRYPT_r = 8, SCRYPT_p = 1, KEYLEN = 64, SALT_BYTES = 16

function b64url(buf) {
    return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}
function fromB64url(s) {
    s = s.replace(/-/g, "+").replace(/_/g, "/")
    const pad = s.length % 4 ? 4 - (s.length % 4) : 0
    return Buffer.from(s + "=".repeat(pad), "base64")
}

export async function hashPassword(password) {
    const salt = crypto.randomBytes(SALT_BYTES)
    const hash = await new Promise((res, rej) =>
        crypto.scrypt(password, salt, KEYLEN, { N: SCRYPT_N, r: SCRYPT_r, p: SCRYPT_p }, (err, dk) => err ? rej(err) : res(dk))
    )
    return `scrypt$${SCRYPT_N}$${SCRYPT_r}$${SCRYPT_p}$${b64url(salt)}$${b64url(hash)}`
}

export async function verifyPassword(password, stored) {
    try {
        const [alg, N, r, p, saltB64, hashB64] = stored.split("$")
        if (alg !== "scrypt") return false
        const salt = fromB64url(saltB64)
        const expected = fromB64url(hashB64)
        const dk = await new Promise((res, rej) =>
            crypto.scrypt(password, salt, expected.length, { N: +N, r: +r, p: +p }, (err, out) => err ? rej(err) : res(out))
        )
        return crypto.timingSafeEqual(dk, expected)
    } catch {
        return false
    }
}

import crypto from "crypto"

function b64url(input) {
    return Buffer.from(JSON.stringify(input))
        .toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}
function b64urlRaw(buf) {
    return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}
function parseB64urlJSON(part) {
    const s = part.replace(/-/g, "+").replace(/\_/g, "/")
    const pad = s.length % 4 ? 4 - (s.length % 4) : 0
    return JSON.parse(Buffer.from(s + "=".repeat(pad), "base64").toString("utf8"))
}

export function signJWT(payload, { secret, expiresInSec = 3600 }) {
    const header = { alg: "HS256", typ: "JWT" }
    const now = Math.floor(Date.now() / 1000)
    const body = { iat: now, exp: now + expiresInSec, ...payload }
    const head = b64url(header)
    const pay = b64url(body)
    const data = `${head}.${pay}`
    const sig = crypto.createHmac("sha256", secret).update(data).digest()
    return `${data}.${b64urlRaw(sig)}`
}

export function verifyJWT(token, { secret }) {
    const [h, p, s] = token.split(".")
    if (!h || !p || !s) throw new Error("Token malformado")
    const data = `${h}.${p}`
    const expected = crypto.createHmac("sha256", secret).update(data).digest()
    const given = Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + "==", "base64")
    if (!crypto.timingSafeEqual(expected, given)) throw new Error("Assinatura inválida")
    const payload = parseB64urlJSON(p)
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) throw new Error("Token expirado")
    return payload
}

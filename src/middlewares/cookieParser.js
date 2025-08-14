// src/middlewares/cookieParser.js
export default function cookieParser(options = {}) {
    const decode = options.decode || decodeURIComponent;

    return function (req, res, next) {
        const header = req.headers.cookie;
        req.cookies = Object.create(null);

        if (header) {
            // "a=1; b=hello%20world; c=..."
            for (const part of header.split(";")) {
                const idx = part.indexOf("=");
                if (idx === -1) continue;
                const key = part.slice(0, idx).trim();
                const raw = part.slice(idx + 1).trim();
                if (!key) continue;

                try {
                    req.cookies[key] = decode(raw);
                } catch {
                    req.cookies[key] = raw;
                }
            }
        }

        // helper opcional para setar cookie sem depender de libs
        res.setCookie = (name, value, opts = {}) => {
            const pieces = [`${name}=${encodeURIComponent(value)}`];

            if (opts.maxAge != null) pieces.push(`Max-Age=${Math.floor(+opts.maxAge / 1000)}`);
            if (opts.expires instanceof Date) pieces.push(`Expires=${opts.expires.toUTCString()}`);
            if (opts.domain) pieces.push(`Domain=${opts.domain}`);
            pieces.push(`Path=${opts.path || "/"}`);
            if (opts.sameSite) {
                const ss = String(opts.sameSite).toLowerCase();
                if (["lax", "strict", "none"].includes(ss)) pieces.push(`SameSite=${ss.charAt(0).toUpperCase()}${ss.slice(1)}`);
            }
            if (opts.secure) pieces.push("Secure");
            if (opts.httpOnly) pieces.push("HttpOnly");

            res.append("Set-Cookie", pieces.join("; "));
        };

        next();
    };
}

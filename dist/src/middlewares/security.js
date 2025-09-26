"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.smartRateLimiter = exports.customSecurityHeaders = exports.securityLogger = exports.slotsLimiter = exports.apiLimiter = exports.createLimiter = exports.authLimiter = exports.generalLimiter = exports.helmetConfig = void 0;
// src/middlewares/security.ts - MIDDLEWARES DE SEGURANÇA
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// ✅ CONFIGURAÇÃO DO HELMET
exports.helmetConfig = (0, helmet_1.default)({
    // Content Security Policy
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
        }
    },
    // Cross Origin Embedder Policy
    crossOriginEmbedderPolicy: false,
    // Referrer Policy
    referrerPolicy: {
        policy: ["same-origin", "strict-origin-when-cross-origin"]
    },
    // HTTP Strict Transport Security (apenas em produção)
    hsts: process.env.NODE_ENV === 'production' ? {
        maxAge: 31536000, // 1 ano
        includeSubDomains: true,
        preload: true
    } : false,
    // X-Frame-Options
    frameguard: {
        action: 'deny'
    },
    // X-Content-Type-Options
    noSniff: true,
    // X-XSS-Protection
    xssFilter: true,
    // Hide X-Powered-By header
    hidePoweredBy: true
});
// ✅ RATE LIMITERS ESPECÍFICOS
// Rate limiter geral
exports.generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP por janela
    message: {
        error: 'Muitas requisições, tente novamente em 15 minutos',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Inclui headers de rate limit
    legacyHeaders: false,
    skip: (req) => {
        // Pular rate limit para health checks
        return req.path === '/health' || req.path === '/ping';
    }
});
// Rate limiter para autenticação (mais restritivo)
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 tentativas de login por IP
    message: {
        error: 'Muitas tentativas de login, tente novamente em 15 minutos',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true // Não conta requests bem-sucedidos
});
// Rate limiter para criação de recursos
exports.createLimiter = (0, express_rate_limit_1.default)({
    windowMs: 10 * 60 * 1000, // 10 minutos
    max: 10, // máximo 10 criações por IP
    message: {
        error: 'Muitas criações de recursos, tente novamente em 10 minutos',
        retryAfter: '10 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});
// Rate limiter para API em geral
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minuto
    max: 60, // máximo 60 requests por minuto por IP
    message: {
        error: 'Limite de API excedido, tente novamente em 1 minuto',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false
});
// Rate limiter para busca de slots (público)
exports.slotsLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 30, // máximo 30 consultas de slots por IP
    message: {
        error: 'Muitas consultas de horários, tente novamente em 5 minutos',
        retryAfter: '5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});
// ✅ MIDDLEWARE PERSONALIZADO PARA LOGS DE SEGURANÇA
const securityLogger = (req, res, next) => {
    // Log de requests suspeitos
    const suspiciousPatterns = [
        /\.\.\//g, // Path traversal
        /<script/gi, // XSS attempts
        /union.*select/gi, // SQL injection
        /eval\(/gi, // Code injection
        /javascript:/gi // JS injection
    ];
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(req.url) ||
        pattern.test(JSON.stringify(req.body)) ||
        pattern.test(req.get('user-agent') || ''));
    if (isSuspicious) {
        console.warn('🚨 SUSPICIOUS REQUEST DETECTED:', {
            ip: req.ip,
            method: req.method,
            url: req.url,
            userAgent: req.get('user-agent'),
            body: req.body,
            timestamp: new Date().toISOString()
        });
    }
    // Log de requests autenticados para auditoria
    if (req.headers.authorization || req.cookies?.access_token) {
        console.log('🔐 AUTHENTICATED REQUEST:', {
            ip: req.ip,
            method: req.method,
            url: req.url,
            timestamp: new Date().toISOString()
        });
    }
    next();
};
exports.securityLogger = securityLogger;
// ✅ MIDDLEWARE PARA HEADERS DE SEGURANÇA CUSTOMIZADOS
const customSecurityHeaders = (req, res, next) => {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    // XSS Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Permissions Policy (anteriormente Feature Policy)
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()');
    // Cache Control para dados sensíveis
    if (req.path.includes('/api/')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
    next();
};
exports.customSecurityHeaders = customSecurityHeaders;
// ✅ RATE LIMITER INTELIGENTE BASEADO EM ENDPOINT
const smartRateLimiter = (req, res, next) => {
    // Aplicar diferentes limiters baseado na rota
    if (req.path.includes('/auth/login') || req.path.includes('/auth/register')) {
        (0, exports.authLimiter)(req, res, next);
        return;
    }
    if (req.method === 'POST' && req.path.includes('/api/')) {
        (0, exports.createLimiter)(req, res, next);
        return;
    }
    if (req.path.includes('/agendamentos/slots')) {
        (0, exports.slotsLimiter)(req, res, next);
        return;
    }
    if (req.path.includes('/api/')) {
        (0, exports.apiLimiter)(req, res, next);
        return;
    }
    (0, exports.generalLimiter)(req, res, next);
};
exports.smartRateLimiter = smartRateLimiter;
//# sourceMappingURL=security.js.map
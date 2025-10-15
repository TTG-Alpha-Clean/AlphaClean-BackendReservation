"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
// Verificar se as credenciais do Cloudinary estão configuradas
const hasCloudinaryConfig = !!(process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name');
let upload;
if (hasCloudinaryConfig) {
    console.log('✅ Cloudinary configurado - Upload de imagens habilitado');
    const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
        cloudinary: cloudinary_1.default,
        params: async (req, file) => {
            return {
                folder: 'Alpha-Clean',
                allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
                public_id: `${Date.now()}-${file.originalname}`,
            };
        },
    });
    upload = (0, multer_1.default)({ storage });
}
else {
    console.warn('⚠️ Cloudinary não configurado - Upload de imagens desabilitado');
    // Usar memoryStorage temporariamente (imagens não serão salvas)
    upload = (0, multer_1.default)({
        storage: multer_1.default.memoryStorage(),
        limits: { fileSize: 5 * 1024 * 1024 } // 5MB
    });
}
exports.default = upload;
//# sourceMappingURL=upload.js.map
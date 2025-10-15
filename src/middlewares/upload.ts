import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';

// Verificar se as credenciais do Cloudinary estão configuradas
const hasCloudinaryConfig = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name'
);

let upload: multer.Multer;

if (hasCloudinaryConfig) {
  console.log('✅ Cloudinary configurado - Upload de imagens habilitado');
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      return {
        folder: 'Alpha-Clean',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        public_id: `${Date.now()}-${file.originalname}`,
      };
    },
  });
  upload = multer({ storage });
} else {
  console.warn('⚠️ Cloudinary não configurado - Upload de imagens desabilitado');
  // Usar memoryStorage temporariamente (imagens não serão salvas)
  upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
  });
}

export default upload;
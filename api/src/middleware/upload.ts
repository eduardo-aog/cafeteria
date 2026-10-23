import multer from 'multer'
import { ALLOWED_IMAGE_TYPES } from '../services/productImages.js'
import { AppError } from './error.js'

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024

// En memoria, un solo archivo en el campo "image", máximo 2 MB; jpeg, png o webp (8.3).
export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) return cb(null, true)
    cb(new AppError('INVALID_IMAGE', 'La imagen debe ser JPG, PNG o WebP.', 400))
  },
}).single('image')

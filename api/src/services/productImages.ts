import { randomUUID } from 'node:crypto'
import { env } from '../config/env.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { AppError } from '../middleware/error.js'

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as const
type ImageType = keyof typeof EXTENSIONS

export const ALLOWED_IMAGE_TYPES = Object.keys(EXTENSIONS)

// El tipo que declara el navegador no es de fiar: se comprueban los primeros bytes.
function detectImageType(buffer: Buffer): ImageType | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg'
  }
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png'
  }
  if (
    buffer.subarray(0, 4).toString('latin1') === 'RIFF' &&
    buffer.subarray(8, 12).toString('latin1') === 'WEBP'
  ) {
    return 'image/webp'
  }
  return null
}

// Sube la imagen al bucket público con la clave privada y devuelve su URL pública.
export async function uploadProductImage(productId: string, buffer: Buffer): Promise<string> {
  const type = detectImageType(buffer)
  if (!type) {
    throw new AppError('INVALID_IMAGE', 'La imagen debe ser JPG, PNG o WebP.', 400)
  }
  // Nombre nuevo en cada subida: así el navegador no muestra la imagen anterior en caché.
  const path = `${productId}/${randomUUID()}.${EXTENSIONS[type]}`
  const bucket = supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET)
  const { error } = await bucket.upload(path, buffer, { contentType: type })
  if (error) throw new Error(`No se pudo subir la imagen: ${error.message}`)
  return bucket.getPublicUrl(path).data.publicUrl
}

// Borra del bucket la imagen que corresponde a esa URL pública. Un fallo no debe romper la operación.
export async function deleteProductImage(imageUrl: string): Promise<void> {
  const marker = `/${env.SUPABASE_STORAGE_BUCKET}/`
  const index = imageUrl.indexOf(marker)
  if (index === -1) return
  const path = decodeURIComponent(imageUrl.slice(index + marker.length))
  const { error } = await supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET).remove([path])
  if (error) console.warn(`No se pudo borrar la imagen anterior: ${error.message}`)
}

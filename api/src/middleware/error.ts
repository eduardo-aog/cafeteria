import type { ErrorRequestHandler, RequestHandler } from 'express'
import { MulterError } from 'multer'
import { ZodError } from 'zod'

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado.' } })
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } })
    return
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son válidos.',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    })
    return
  }
  if (err instanceof MulterError) {
    const tooLarge = err.code === 'LIMIT_FILE_SIZE'
    res.status(400).json({
      error: {
        code: tooLarge ? 'IMAGE_TOO_LARGE' : 'INVALID_IMAGE',
        message: tooLarge ? 'La imagen no puede pesar más de 2 MB.' : 'No se pudo leer la imagen.',
      },
    })
    return
  }
  const status = (err as { status?: unknown })?.status
  if (typeof status === 'number' && status >= 400 && status < 500) {
    res.status(status).json({
      error: { code: 'BAD_REQUEST', message: 'La solicitud no es válida.' },
    })
    return
  }
  // Solo el mensaje: nunca tokens ni contraseñas.
  console.error('Error inesperado:', err instanceof Error ? err.message : 'desconocido')
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un error inesperado. Intenta de nuevo.' },
  })
}

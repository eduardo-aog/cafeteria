// Copia al portapapeles (8.6): navigator.clipboard y, de respaldo, un textarea oculto con execCommand.
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Sin permiso o sin HTTPS: se prueba el método antiguo.
  }
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    document.body.removeChild(area)
  }
}

// Pegar (8.6): devuelve null si el navegador no deja leer el portapapeles.
export async function readClipboardText(): Promise<string | null> {
  try {
    return await navigator.clipboard.readText()
  } catch {
    return null
  }
}

// Solo dígitos, hasta 22 (referencia de Pago Móvil).
export const digitsOnly = (text: string) => text.replace(/\D/g, '').slice(0, 22)

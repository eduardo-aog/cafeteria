import { setZXingModuleOverrides } from '@yudiel/react-qr-scanner'
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url'

// El lector de QR descarga por defecto su decodificador de un CDN externo; aquí se sirve desde nuestro propio sitio
// (en Chrome de Android se usa el lector nativo y esto no se necesita, pero Safari de iPhone sí lo usa).
setZXingModuleOverrides({
  locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasmUrl : prefix + path),
})

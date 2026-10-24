// Caché en memoria con vencimiento. Evita repetir consultas a la base de datos (cada viaje a
// Supabase cuesta de milisegundos a más de medio segundo según la red) con datos que casi no cambian.
// Solo es válido con un único proceso de servidor, que es el caso de este proyecto.

interface Entry<V> {
  value: Promise<V | null>
  expiresAt: number
}

export class TtlCache<K, V> {
  private entries = new Map<K, Entry<V>>()
  private ttlMs: number
  private maxEntries: number

  constructor(ttlMs: number, maxEntries = 500) {
    this.ttlMs = ttlMs
    this.maxEntries = maxEntries
  }

  // Devuelve el valor guardado o lo carga. Las cargas simultáneas comparten una sola consulta.
  // Un resultado null o un error no se guardan: la próxima llamada vuelve a consultar.
  async getOrLoad(key: K, loader: () => Promise<V | null>): Promise<V | null> {
    const now = Date.now()
    const hit = this.entries.get(key)
    if (hit && hit.expiresAt > now) return hit.value

    if (this.entries.size >= this.maxEntries) this.evictExpired(now)
    if (this.entries.size >= this.maxEntries) this.entries.clear()

    const value = loader()
    const entry: Entry<V> = { value, expiresAt: now + this.ttlMs }
    this.entries.set(key, entry)
    try {
      if ((await value) === null) this.deleteEntry(key, entry)
    } catch (error) {
      this.deleteEntry(key, entry)
      throw error
    }
    return value
  }

  delete(key: K) {
    this.entries.delete(key)
  }

  clear() {
    this.entries.clear()
  }

  private deleteEntry(key: K, entry: Entry<V>) {
    if (this.entries.get(key) === entry) this.entries.delete(key)
  }

  private evictExpired(now: number) {
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(key)
    }
  }
}

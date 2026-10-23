import { useState } from 'react'

export type GridColumns = 1 | 2

const STORAGE_KEY = 'catalog-columns'

// Preferencia por persona y dispositivo: solo comodidad, por eso basta con localStorage.
function readStored(): GridColumns {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1' ? 1 : 2
  } catch {
    return 2 // sin acceso al almacenamiento (por ejemplo, ventana privada): valor por defecto
  }
}

// Una o dos columnas en las vistas de catálogo (por defecto, dos). La comparten menú y catálogo.
export function useGridColumns() {
  const [columns, setColumns] = useState<GridColumns>(readStored)

  const update = (next: GridColumns) => {
    setColumns(next)
    try {
      localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      // sin almacenamiento: la elección vale solo para esta sesión
    }
  }

  return [columns, update] as const
}

export const gridColumnsClass = (columns: GridColumns) =>
  columns === 1 ? 'grid-cols-1' : 'grid-cols-2'

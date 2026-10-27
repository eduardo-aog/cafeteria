import { Menu } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useMe } from '@/hooks/useMe'

// Las secciones están en el menú hamburguesa; aquí solo se da la bienvenida.
export default function WorkHome() {
  const { data: me } = useMe()

  return (
    <section className="flex flex-col gap-2">
      {/* Marca de agua: centrada en la pantalla y por detrás del contenido. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 flex items-center justify-center"
      >
        <Logo className="w-3/4 max-w-80 opacity-10" />
      </div>
      <h1 className="text-2xl">Panel de trabajo</h1>
      {me && <p className="font-medium">Hola, {me.name}.</p>}
      <p className="text-muted-foreground">
        Toca el botón verde{' '}
        <Menu className="inline size-5 align-text-bottom" strokeWidth={1.5} aria-label="del menú" />{' '}
        de arriba a la izquierda para elegir una sección.
      </p>
    </section>
  )
}

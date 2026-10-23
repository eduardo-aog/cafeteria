// Pantalla provisional de las secciones que se construyen en fases posteriores.
export function PagePlaceholder({ title }: { title: string }) {
  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-2xl">{title}</h1>
      <p className="text-muted-foreground">Esta sección aún no está disponible.</p>
    </section>
  )
}

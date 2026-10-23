# Progreso del proyecto

## Estado actual
- Fase: 2 — Esquema de datos
- Rama: feat/fase-02-esquema
- Paso: esperando ⛔ PARADA 2.Z — Cierre de la Fase 2

## Paradas confirmadas
- 0.A Requisitos previos — 2026-10-23
- 1.A Supabase y archivos .env — 2026-10-23 (incluye 1.E1: la VPN bloqueaba el puerto 5432; `DIRECT_URL` verificada por el usuario con `prisma db execute`)
- 1.Z Cierre de la Fase 1 — 2026-10-23
- 2.E1 Conexión por `DIRECT_URL` (VPN activa) — 2026-10-23

## Fases cerradas
- Fase 1 — Base del repositorio (unida a main el 2026-10-23, PR #1)

## Decisiones menores tomadas
- Fase 1: el repositorio de GitHub pasó a ser público (decisión del usuario, para facilitar el despliegue). Ningún `.env` ni clave está en el historial.
- Fase 1: `@hookform/resolvers` fijado en la versión 5 (la 6.0.0 da conflicto de peer dependencies con npm).
- Fase 1: shadcn (preset `nova`, base `radix`) usa el paquete `cn` (mantenido por shadcn-ui) en vez de `clsx` + `tailwind-merge`. Se conserva tal como lo genera la CLI.
- Fase 1: `button.tsx`, `card.tsx` y `sonner.tsx` se ajustaron a 10.6 (alto mínimo 44 px, borde de 1 px sin anillo, radio de 10 px, sin `dark:` ni `next-themes`, transiciones de 150 ms).
- Fase 1: `npm run dev:https` en `web/` es `vite --host --mode https`; el plugin `@vitejs/plugin-basic-ssl` solo se activa con `mode === 'https'`.
- Fase 1: `lint` en `web/` usa ESLint (la plantilla de Vite traía oxlint, se reemplazó por lo que pide la sección 2).
- Fase 1: contraste de bordes de campos: se mantiene `#E4DACB` para tarjetas y separadores y se usará un borde más oscuro (propuesto `#8F7E6D`, 3,5:1) solo en campos de formulario y botones outline (decisión del usuario, 2026-10-23; se implementa en la Fase 3).
- Fase 1: con la VPN activa el puerto 5432 (`DIRECT_URL`) no responde. Las migraciones (Fase 2 en adelante) requieren desactivar la VPN o excluir `*.pooler.supabase.com` de su túnel. `DATABASE_URL` (6543) funciona con VPN.
- Fase 1: `GET /api/health/db` usa Prisma (`$queryRaw`); el esquema de Prisma queda vacío (solo generator y datasource) hasta la Fase 2.
- Fase 2: `prisma migrate dev` y `db execute` (puerto 5432) fallan desde la sesión del agente aunque la VPN esté apagada; el usuario los ejecuta con `! cd api && npx prisma …` (VPN apagada). El seed y el resto usan 6543 / HTTPS y los corre el agente.
- Fase 2: `paymentDocNumber` del seed es `123456789` (tipo `J` aparte, se muestra `J-12345678-9`). El `upsert` de `Settings` no pisa valores ya editados.
- Fase 2: se añadió `src/lib/supabase.ts` (cliente admin) y los scripts `db:migrate`, `db:deploy`, `db:seed` y `db:studio`. `db:seed:sales` y `db:reset-demo` llegan en las fases 9 y 10.
- Fase 2: el bloque de RLS también cubre `_prisma_migrations` (tabla de Prisma). Toda migración futura que cree tablas debe repetir el bloque (7.2a).

## Contraste de la paleta (10.6, mínimo AA)
| Pareja | Ratio |
|---|---|
| foreground / background | 14,60:1 |
| card-foreground / card | 15,90:1 |
| primary-foreground / primary | 11,74:1 |
| secondary-foreground / secondary | 10,89:1 |
| muted-foreground / background | 5,95:1 |
| muted-foreground / card | 6,48:1 |
| muted-foreground / muted | 5,41:1 |
| accent-foreground / accent | 12,25:1 |
| primary-foreground / destructive | 7,41:1 |
| caramel / card | 5,70:1 |
| caramel / background | 5,24:1 |
| success / card | 6,24:1 |
| warning / card | 5,82:1 |
| Etiqueta «En verificación» (warning sobre warning 12 %) | 4,56:1 |
| Etiqueta «Pagado» (success sobre success 12 %) | 4,87:1 |
| Etiqueta «Rechazado» (destructive sobre destructive 10 %) | 5,80:1 |
| Etiqueta «Expirado» (muted-foreground / muted) | 5,41:1 |
| Aviso de pago (warning sobre warning 10 %) | 4,68:1 |
| ring / background (no texto, mínimo 3:1) | 5,74:1 |

**Resuelto (ver Decisiones menores):** `--border` / `--input` (`#E4DACB`) sobre el fondo da 1,25:1, por debajo del 3:1 que 10.6 exige a los bordes de controles. La paleta fijada y la regla se contradicen; se resuelve antes de construir formularios (Fase 3).

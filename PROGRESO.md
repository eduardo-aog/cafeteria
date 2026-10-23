# Progreso del proyecto

## Estado actual
- Fase: 1 — Base del repositorio
- Rama: feat/fase-01-base
- Paso: `api/` y `web/` creados (typecheck, lint y build OK). Siguiente: ⛔ PARADA 1.A — Supabase y archivos .env

## Paradas confirmadas
- 0.A Requisitos previos — 2026-10-23

## Fases cerradas
- (ninguna todavía)

## Decisiones menores tomadas
- Fase 1: `@hookform/resolvers` fijado en la versión 5 (la 6.0.0 da conflicto de peer dependencies con npm).
- Fase 1: shadcn (preset `nova`, base `radix`) usa el paquete `cn` (mantenido por shadcn-ui) en vez de `clsx` + `tailwind-merge`. Se conserva tal como lo genera la CLI.
- Fase 1: `button.tsx`, `card.tsx` y `sonner.tsx` se ajustaron a 10.6 (alto mínimo 44 px, borde de 1 px sin anillo, radio de 10 px, sin `dark:` ni `next-themes`, transiciones de 150 ms).
- Fase 1: `npm run dev:https` en `web/` es `vite --host --mode https`; el plugin `@vitejs/plugin-basic-ssl` solo se activa con `mode === 'https'`.
- Fase 1: `lint` en `web/` usa ESLint (la plantilla de Vite traía oxlint, se reemplazó por lo que pide la sección 2).
- Fase 1: `GET /api/health/db` usa Prisma (`$queryRaw`); el esquema de Prisma queda vacío (solo generator y datasource) hasta la Fase 2.

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

**Pendiente de decisión:** `--border` / `--input` (`#E4DACB`) sobre el fondo da 1,25:1, por debajo del 3:1 que 10.6 exige a los bordes de controles. La paleta fijada y la regla se contradicen; se resuelve antes de construir formularios (Fase 3).

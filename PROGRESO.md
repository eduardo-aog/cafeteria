# Progreso del proyecto

## Estado actual
- Fase: 5 — Checkout
- Rama: feat/fase-05-checkout
- Paso: esperando ⛔ PARADA 5.Z — Cierre de la Fase 5

## Paradas confirmadas
- 0.A Requisitos previos — 2026-10-23
- 1.A Supabase y archivos .env — 2026-10-23 (incluye 1.E1: la VPN bloqueaba el puerto 5432; `DIRECT_URL` verificada por el usuario con `prisma db execute`)
- 1.Z Cierre de la Fase 1 — 2026-10-23
- 2.E1 Conexión por `DIRECT_URL` (VPN activa) — 2026-10-23
- 2.Z Cierre de la Fase 2 — 2026-10-23
- 3.Z Cierre de la Fase 3 — 2026-10-23
- 4.Z Cierre de la Fase 4 — 2026-10-23

## Fases cerradas
- Fase 1 — Base del repositorio (unida a main el 2026-10-23, PR #1)
- Fase 2 — Esquema de datos (unida a main el 2026-10-23, PR #2)
- Fase 3 — Autenticación y permisos (unida a main el 2026-10-23, PR #3)
- Fase 4 — Dominio, tasa BCV, catálogo y menú (unida a main el 2026-10-23, PR #4)

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
- Fase 3: `--input` pasa a `#8F7E6D` (campos de formulario y botones outline, implementa la decisión de la Fase 1); `--border` sigue en `#E4DACB` para tarjetas y separadores.
- Fase 3: `/me` devuelve `permissions` ya efectivos (`manager` incluye al administrador; `cashier` y `barista` no se heredan de `isAdmin`) más `isStaff` y `pointsBalance`.
- Fase 3: el correo se normaliza a minúsculas en registro e inicio de sesión. Correo repetido → 409 `EMAIL_TAKEN`.
- Fase 3: la lógica de permisos vive en `domain/permissions.ts` (pura, con pruebas) y los middlewares de permisos en `middleware/permissions.ts`, separados de `requireAuth` para poder probarlos sin Supabase.
- Fase 3: la prueba de integración de 403 usa una app de Express de prueba que inyecta `req.user` en lugar de `requireAuth` (no hay aún rutas reales por permiso). La verificación real contra Supabase (login de las 5 cuentas, `/me`, registro, correo duplicado) se ejecutó con un script temporal, no versionado.
- Fase 3: las pantallas de cliente (menú, checkout, pedidos, puntos) y las secciones de `/trabajo` son marcadores de posición (`PagePlaceholder`) hasta sus fases. `/cuenta` y el cierre de sesión ya funcionan.
- Fase 3: se eliminó `ThemePreview` (página de prueba de la Fase 1); `/` ahora redirige según la cuenta.
- Fase 3: el puerto 5173 estaba ocupado por un Vite anterior (proceso ajeno a esta sesión); las comprobaciones del agente usaron el 5174.
- Fase 4: `curl` a `BCV_API_URL` respondió 200 en 1,4 s con el formato esperado (USD, `price` con decimales y `date`), así que no hubo parada. Reintentos: 3 tras el primer intento (4 en total), con 60 s de timeout y 1 min entre intentos.
- Fase 4: la comprobación al arrancar sigue la letra de 8.4: consulta si no hay tasa o la última (`fetchedAt`) es anterior a las 8:00 a. m. de hoy en Caracas. Antes de las 8:00 siempre consulta (inofensivo). Las consultas simultáneas se unifican (una sola en vuelo).
- Fase 4: la API del BCV informa la fecha del día hábil siguiente (hoy 23/10 devolvió 27/10); `bcvDate` guarda ese valor y el menú lo muestra tal cual.
- Fase 4: el seed añade la tasa de respaldo (Bs 886,23) solo si no hay ninguna, con `fetchedAt` en el año 2000 para que el arranque consulte el BCV y cualquier tasa real la reemplace. En esta base ya existe una tasa real, así que no se insertó.
- Fase 4: el catálogo de 15 trae 14 productos (6 + 4 + 4, como lista la tabla). El seed solo crea los que no existen por nombre y no pisa ediciones.
- Fase 4: `GET /menu` añade `store.nextOpening` (ISO o null) para mostrar «Cerrado · Abrimos …»; `GET /products/:id` devuelve `{ product, rate }`. Ambos incluyen `priceBsCents` calculado en el servidor (null si no hay tasa).
- Fase 4: las imágenes se guardan como `<productId>/<uuid>.<ext>` (nombre nuevo en cada subida, para no servir una versión en caché) y el servidor valida los primeros bytes (JPG, PNG, WebP) además del tipo declarado. La imagen anterior se borra del bucket al reemplazar o quitar. Los CDN pueden seguir sirviendo unos minutos una URL que ya se había pedido.
- Fase 4: `daysUntil` cuenta días naturales en Caracas (0 el último día); el aviso fuerte de 8.9 («menos de 5 días») se aplicará en la Fase 8.
- Fase 4: el catálogo del gerente usa tres rutas: `/trabajo/catalogo` (lista), `/trabajo/catalogo/nuevo` y `/trabajo/catalogo/:id` (edición, imagen y, solo con administrador, baja o reactivación). Al crear un producto se pasa a la edición para subir la imagen (9.6 crea sin imagen).
- Fase 4: el precio se escribe en dólares (`4`, `4,5`, `4.50`, `1.250,50`) y la web lo convierte a centavos antes de enviarlo; el servidor valida de 1 centavo a $10.000,00.
- Fase 4: se añadió `ConfirmDialog` (AlertDialog de Radix) para acciones irreversibles, `NativeSelect` y `Textarea`. Las pruebas de `web/` arrancan con `format.test.ts`.
- Fase 4: las pruebas de la API real contra Supabase (menú, permisos, CRUD, imágenes, baja) se hicieron con un script temporal no versionado. El «Cerrado · Abrimos …» solo se ve con el local cerrado (fuera de 8:00–20:00 o domingo); está cubierto por pruebas unitarias.
- Fase 4 (ajustes pedidos por el usuario tras probar): (1) el catálogo del gerente y del administrador tiene un filtro «Todo / Agotados / De baja» (Agotados incluye también los dados de baja que estén agotados); (2) todas las vistas de catálogo (menú del cliente y catálogo de trabajo) tienen un selector de una o dos columnas, por defecto dos, que se guarda en `localStorage` y se comparte entre ambas vistas; el catálogo de trabajo pasó a tarjetas con el contenido hacia abajo (imagen, nombre, $, Bs, y los botones «Editar» y «Marcar agotado» uno debajo del otro); (3) el panel de trabajo muestra sus secciones en un menú hamburguesa desplegable a la izquierda (con «Inicio» y «Cerrar sesión») y el inicio `/trabajo` solo da la bienvenida. Esto sustituye a las tarjetas apiladas del inicio que describe 10.4. El panel se abre sin animación de deslizamiento, por la regla de movimiento de 10.6.
- Fase 4: verificación de los ajustes en Firefox real (automatizado con Marionette, sin versionar): login como gerente y cliente, menú hamburguesa, filtros (incluido marcar y revertir un producto agotado), cambio de columnas y persistencia de la preferencia.
- Fase 5: todas las operaciones sobre los checkouts de un cliente (agregar, cantidad, quitar, cancelar y la expiración perezosa) corren en una transacción con `pg_advisory_xact_lock` por cliente. Así dos peticiones simultáneas no crean dos checkouts abiertos ni pasan del tope por producto, sin necesitar una migración con índice parcial. Las transacciones usan `maxWait` de 15 s y `timeout` de 20 s porque `DATABASE_URL` lleva `connection_limit=1`.
- Fase 5: `STORE_CLOSED`, `PRODUCT_UNAVAILABLE`, `MAX_QUANTITY_EXCEEDED`, `CHECKOUT_NOT_EDITABLE` y `CHECKOUT_NOT_CANCELLABLE` responden 409 (conflicto de estado); `COUPONS_NOT_AVAILABLE` (si llega `couponId`) responde 400 hasta la Fase 8. El mensaje de `STORE_CLOSED` incluye el horario real de `Settings` («lunes a sábado de 8:00 a. m. a 8:00 p. m.»).
- Fase 5: `GET /checkouts` devuelve también `maxQuantityPerProduct`, y `GET /menu` lo expone en `limits`, para que la web limite los selectores de cantidad. Cada línea incluye `isAvailable` e `isActive`; la web avisa «Agotado» o «Ya no está disponible» (la validación obligatoria llega en la Fase 6 con `prepare-payment`).
- Fase 5: el botón «Pagar» no se muestra todavía (llega en la Fase 6). Quitar la última línea pide confirmación porque cancela el checkout; cancelar un checkout también.
- Fase 5: la tarea `expireStaleCheckouts` corre cada 5 minutos y no libera cupones todavía (la liberación se añade en la Fase 8). Los `dev:*` se niegan a correr con `NODE_ENV=production`.
- Fase 5: `dev:expire-checkouts` solo adelanta `expiresAt`; el checkout pasa a «Expirado» en la siguiente lectura del cliente (cada 10 s en la web) o en la próxima ejecución de la tarea.
- Fase 5: con la VPN activa cada consulta a Supabase tarda ~0,7 s en esta máquina, así que las acciones del checkout pueden tardar varios segundos en desarrollo. En Render (servidor y base en la misma región) no ocurre. Las pruebas de concurrencia se hicieron con 3 peticiones simultáneas y `pool_timeout` ampliado solo en la instancia de prueba.
- Fase 5: verificación en Firefox real (automatizada, sin versionar): agregar desde el menú con aviso, checkout con total en $ y Bs y plazo de 24 h, cambio de cantidad, detalle de producto con selector de cantidad (se suma a la línea existente), cancelar con confirmación y estado vacío.

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
| input (`#8F7E6D`) / card (borde de campos, mínimo 3:1) | 3,85:1 |
| input / background | 3,53:1 |
| input / muted | 3,21:1 |

**Resuelto en la Fase 3 (ver Decisiones menores):** `--border` / `--input` (`#E4DACB`) sobre el fondo da 1,25:1, por debajo del 3:1 que 10.6 exige a los bordes de controles. La paleta fijada y la regla se contradicen; se resuelve antes de construir formularios (Fase 3).

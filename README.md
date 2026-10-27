# Vibecoffe

Aplicación web de pedidos anticipados (solo retiro en el mostrador) para una cafetería: el cliente arma su pedido, paga con Pago Móvil, un cajero verifica el pago y el pedido se retira con un QR. Incluye puntos, recompensas y cupones, y paneles de trabajo para cajero, barista, gerente y administrador.

La especificación completa está en [`CLAUDE.md`](CLAUDE.md) y el avance, con todas las decisiones tomadas, en [`PROGRESO.md`](PROGRESO.md).

## Estado y sitio publicado

Las 10 fases del proyecto están terminadas, unidas a `main` y desplegadas en Render:

- Página: https://vibecoffe.onrender.com
- Servidor: https://cafeteria-api-1ej1.onrender.com (`/api/health` y `/api/health/db`)

El servidor gratuito se suspende tras un rato sin tráfico; un monitor de UptimeRobot lo mantiene despierto (ver «Despliegue en Render»). Los cambios nuevos se hacen en ramas `fix/…` o `feat/…` y se unen a `main`, lo que redespliega los dos servicios.

## Estructura

```
api/   servidor Node.js 22 + Express 5 + Prisma 6 (PostgreSQL en Supabase)
web/   página React + Vite + Tailwind CSS + shadcn/ui
```

Toda la lógica de negocio vive en `api/`; `web/` solo muestra datos y envía acciones. La web usa Supabase únicamente para iniciar y cerrar sesión.

## Requisitos

- Node.js 22 LTS (se recomienda [`fnm`](https://github.com/Schniz/fnm); cada carpeta tiene su `.node-version`).
- Git y, para subir cambios, el GitHub CLI (`gh`).
- Un proyecto de Supabase con:
  - Email habilitado, **Confirm email** desactivado y **Allow new users to sign up** desactivado.
  - Un bucket público llamado `product-images`.

## Instalación

```bash
cd api && npm install
cd ../web && npm install
```

## Variables de entorno

```bash
cp api/.env.example api/.env
cp web/.env.example web/.env
```

Rellena los valores:

| Variable | Archivo | Dónde se obtiene |
|---|---|---|
| `SUPABASE_URL` | `api/.env` | Supabase → Project Settings → API → Project URL (solo el dominio, sin rutas) |
| `SUPABASE_SERVICE_ROLE_KEY` | `api/.env` | Project Settings → API Keys → `service_role` o `secret` (privada: nunca en `web/`) |
| `DATABASE_URL` | `api/.env` | Connect → Transaction pooler (puerto 6543), con `?pgbouncer=true&connection_limit=1` al final (ver «Rendimiento y latencia») |
| `DIRECT_URL` | `api/.env` | Connect → Session pooler (puerto 5432) |
| `WEB_ORIGIN` | `api/.env` | URL de la página: `http://localhost:5173` en desarrollo |
| `BCV_API_URL` | `api/.env` | Servicio que publica la tasa del BCV (viene en `.env.example`) |
| `VITE_API_URL` | `web/.env` | `/api` en desarrollo; en Render, la URL del servidor + `/api` |
| `VITE_SUPABASE_URL` | `web/.env` | El mismo valor que `SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | `web/.env` | Project Settings → API Keys → `anon` o `publishable` |
| `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_DEMO_PASSWORD` | `api/.env` | Los eliges tú (contraseñas de mínimo 8 caracteres). Solo las usa el seed |

La contraseña de la base de datos debe llevar solo letras y números; si tiene símbolos hay que codificarlos en la URL (por ejemplo, `#` se escribe `%23`).

Comprobaciones (no muestran valores):

```bash
cd api && npm run env:check && npm run supabase:check
cd ../web && npm run env:check
```

## Base de datos y datos de demostración

```bash
cd api
npx prisma migrate deploy   # aplica las migraciones (usa DIRECT_URL, puerto 5432)
npm run db:seed             # ajustes, bancos, productos, recompensas y cuentas de demostración
```

El seed es idempotente: se puede repetir y no pisa lo que se haya editado desde los paneles.

| Cuenta | Qué es | Contraseña |
|---|---|---|
| `SEED_ADMIN_EMAIL` | Administrador | `SEED_ADMIN_PASSWORD` |
| `cajero@demo.com` | Cajero | `SEED_DEMO_PASSWORD` |
| `barista@demo.com` | Barista | `SEED_DEMO_PASSWORD` |
| `gerente@demo.com` | Gerente | `SEED_DEMO_PASSWORD` |
| `cliente@demo.com` | Cliente (1.500 puntos al crearse) | `SEED_DEMO_PASSWORD` |

- `npm run db:seed:sales` genera pedidos históricos ya entregados (últimas 4 semanas) para que los reportes muestren datos. Es idempotente y no forma parte del seed principal.
- `npm run db:reset-demo` deja la base solo con los datos de demostración. **Es destructivo** (borra pedidos, cuentas, imágenes y movimientos). Sin `-- --confirm` solo muestra lo que borraría; con `-- --confirm` lo hace de verdad (y `-- --with-sales` añade las ventas históricas).

## Correr en desarrollo

```bash
cd api && npm run dev        # terminal 1: http://localhost:3000
cd web && npm run dev        # terminal 2: http://localhost:5173
```

En desarrollo la web llama a `/api`, que Vite reenvía a `http://localhost:3000`. Cada petición de la API imprime su duración (`MÉTODO ruta estado ms`).

### Scripts de desarrollo (en `api/`)

Cambian datos a propósito y se niegan a correr con `NODE_ENV=production`:

| Script | Qué hace |
|---|---|
| `npm run dev:store-open` | Abre el local todos los días de 00:00 a 23:59, para probar a cualquier hora |
| `npm run dev:store-default` | Restaura el horario de lunes a sábado de 8:00 a 20:00 |
| `npm run dev:expire-checkouts` | Pone en el pasado el plazo de todos los checkouts sin pagar |
| `npm run dev:expire-coupons` | Pone en el pasado la fecha de los cupones disponibles de `cliente@demo.com` |

El servidor tarda hasta 10 s en notar un cambio de horario hecho con estos scripts (guarda los ajustes en memoria).

## Todos los scripts

| Carpeta | Scripts |
|---|---|
| `api/` | `dev`, `build`, `start`, `typecheck`, `lint`, `format`, `test`, `env:check`, `supabase:check`, `db:migrate`, `db:deploy`, `db:seed`, `db:seed:sales`, `db:reset-demo`, `db:studio`, `dev:store-open`, `dev:store-default`, `dev:expire-checkouts`, `dev:expire-coupons` |
| `web/` | `dev`, `dev:https`, `build`, `preview`, `typecheck`, `lint`, `format`, `test`, `env:check` |

## Pruebas

```bash
cd api && npm test    # funciones puras del dominio, permisos y una prueba de concurrencia
cd web && npm test    # formateadores y textos
```

La prueba de concurrencia de `api/` (`verification.concurrency.test.ts`) usa la base de datos real: se omite si no existe `api/.env` y tarda unos segundos por cada viaje a la base (con VPN, ~35 s). Deja una entrada en el registro de verificaciones, que es de solo inserción.

Antes de cerrar una fase se ejecutan `typecheck`, `lint`, `build` y `test` en ambas carpetas.

## Probar desde el teléfono en la red local

La cámara (escáner del cajero) exige HTTPS. `npm run dev:https` en `web/` levanta Vite con un certificado local y acceso por la red local; el teléfono solo necesita llegar a la web, porque la API pasa por el proxy de Vite. (En el sitio publicado en Render ya hay HTTPS y esto no hace falta.)

1. Conecta el teléfono a la **misma red Wi-Fi** que el computador (algunas redes de invitados aíslan los dispositivos).
2. Abre el puerto de Vite en Fedora. Sin `--permanent` se revierte al reiniciar:
   ```bash
   sudo firewall-cmd --add-port=5173/tcp
   ```
3. Arranca `cd api && npm run dev` y `cd web && npm run dev:https`.
4. En el teléfono abre la dirección **Network** que muestra Vite (`https://192.168.x.x:5173`) y acepta la advertencia del certificado local.
5. Cuando la web pida la cámara, toca «Permitir».
6. Al terminar, cierra el puerto:
   ```bash
   sudo firewall-cmd --remove-port=5173/tcp
   ```

## Despliegue en Render

Render despliega desde `main`: cada unión a `main` redespliega el servidor y la página. Región **Virginia (US East)**, la misma que Supabase.

**Servidor** (*Web Service*, plan Free)

| Campo | Valor |
|---|---|
| Name | `cafeteria-api` |
| Branch | `main` |
| Root Directory | `api` |
| Build Command | `npm ci --include=dev && npx prisma generate && npm run build` |
| Start Command | `npx prisma migrate deploy && node dist/index.js` |
| Health Check Path | `/api/health` |

Variables de entorno: las de `api/.env` **menos** `SEED_*` y `PORT` (Render asigna el puerto), con `NODE_ENV=production` y `WEB_ORIGIN` igual a la URL de la página, sin `/` al final.

**Página** (*Static Site*)

| Campo | Valor |
|---|---|
| Name | `cafeteria-web` |
| Branch | `main` |
| Root Directory | `web` |
| Build Command | `npm ci --include=dev && npm run build` |
| Publish Directory | `dist` |

Variables: `VITE_API_URL` (URL del servidor + `/api`), `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. En «Redirects/Rewrites» añade `/*` → `/index.html` con acción **Rewrite**. Si cambia una variable `VITE_*` hay que redesplegar la página, porque Vite las incrusta al compilar.

El seed no corre en Render: se ejecuta desde tu computador sobre la misma base de datos (hay un solo proyecto de Supabase, compartido por el desarrollo y la versión desplegada). Las migraciones sí se aplican al arrancar (`prisma migrate deploy`).

**UptimeRobot.** El plan gratuito de Render suspende el servidor tras un rato sin tráfico y la primera visita tarda en responder. Un monitor HTTP(s) a `https://<servidor>.onrender.com/api/health/db` cada 5 minutos lo evita y, como esa ruta consulta la base de datos, también mantiene activo el proyecto gratuito de Supabase (que se pausa si pasa días sin uso).

## Rendimiento y latencia hacia la base de datos

Cada consulta a Supabase es un viaje de red. Si tu conexión es lenta (por ejemplo con VPN), cada viaje puede costar más de medio segundo y las acciones se notan lentas; en Render, con el servidor y la base en la misma región, cuesta milisegundos. Para mejorarlo en desarrollo:

- Prueba con la VPN apagada (las migraciones ya lo requieren por el puerto 5432).
- Opcional: sube `connection_limit` en `DATABASE_URL` de `api/.env` (por ejemplo `connection_limit=5`) para que las consultas en paralelo corran en paralelo. Con `connection_limit=1` se hacen una tras otra.

## Solución de problemas

- **`P1001: Can't reach database server` en el puerto 5432** (migraciones, `prisma db execute`, `db:reset-demo`): algunas VPN bloquean ese puerto. Desactiva la VPN o excluye `*.pooler.supabase.com` de su túnel. `DATABASE_URL` (6543) sí funciona con VPN.
- **El sitio publicado tarda mucho en cargar la primera vez**: el servidor gratuito de Render se está despertando; espera cerca de un minuto. El monitor de UptimeRobot lo evita.
- **«Failed to resolve import» o la página en blanco en desarrollo**: puede haber un Vite viejo ocupando el puerto 5173. Ciérralo o usa otro puerto con `npm run dev -- --port 5180`.
- **El horario del local no cambia al instante**: el servidor guarda los ajustes 10 s en memoria cuando se cambian desde los scripts `dev:store-*` (desde el panel del administrador el cambio es inmediato).
- **No se ve la cámara en el escáner del cajero**: necesita HTTPS (el sitio publicado lo tiene) y que el navegador tenga permiso de cámara. Mientras tanto se puede escribir el código corto del pedido.

# Cafetería

Aplicación web de pedidos anticipados (solo retiro en el mostrador) para una cafetería, con pago por Pago Móvil y sistema de puntos. La especificación completa está en [`CLAUDE.md`](CLAUDE.md) y el avance en [`PROGRESO.md`](PROGRESO.md).

- `api/`: servidor Node.js 22 + Express 5 + Prisma 6 (PostgreSQL en Supabase).
- `web/`: página React + Vite + Tailwind CSS + shadcn/ui.

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
| `DATABASE_URL` | `api/.env` | Connect → Transaction pooler (puerto 6543), con `?pgbouncer=true&connection_limit=1` al final (ver nota de rendimiento abajo) |
| `DIRECT_URL` | `api/.env` | Connect → Session pooler (puerto 5432) |
| `VITE_SUPABASE_URL` | `web/.env` | El mismo valor que `SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | `web/.env` | Project Settings → API Keys → `anon` o `publishable` |
| `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_DEMO_PASSWORD` | `api/.env` | Los eliges tú (contraseñas de mínimo 8 caracteres). Solo las usa el seed |

La contraseña de la base de datos debe llevar solo letras y números; si tiene símbolos hay que codificarlos en la URL (por ejemplo, `#` se escribe `%23`).

Comprobaciones (no muestran valores):

```bash
cd api && npm run env:check && npm run supabase:check
cd ../web && npm run env:check
```

> Algunas VPN bloquean el puerto 5432 de Supabase (`DIRECT_URL`), que Prisma usa para las migraciones. Si `npx prisma db execute` da `P1001`, desactiva la VPN o excluye `*.pooler.supabase.com` de su túnel.

## Correr en desarrollo

```bash
cd api && npm run dev        # terminal 1: http://localhost:3000
cd web && npm run dev        # terminal 2: http://localhost:5173
```

En desarrollo la web llama a `/api`, que Vite reenvía a `http://localhost:3000`.

Scripts disponibles en ambas carpetas: `dev`, `build`, `typecheck`, `lint`, `format`, `test` y `env:check`. `api/` añade `start` y `supabase:check`; `web/` añade `dev:https` y `preview`. Los scripts de base de datos se crean en las fases siguientes.

## Probar desde el teléfono

La cámara (escáner del cajero) exige HTTPS. `npm run dev:https` en `web/` levanta Vite con un certificado local y acceso por la red local; el teléfono solo necesita llegar a la web, porque la API pasa por el proxy de Vite.

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

## Despliegue

El despliegue en Render (servidor como *Web Service* y página como *Static Site*) se documenta en la Fase 10.

## Rendimiento y latencia hacia la base de datos

Cada consulta a Supabase es un viaje de red. Si tu conexión es lenta (por ejemplo con VPN), cada viaje puede costar más de medio segundo y las acciones se notan lentas; en Render, con el servidor y la base en la misma región, cuesta milisegundos. Para mejorarlo en desarrollo:

- Prueba con la VPN apagada (las migraciones ya lo requieren por el puerto 5432).
- Opcional: sube `connection_limit` en `DATABASE_URL` de `api/.env` (por ejemplo `connection_limit=5`) para que las consultas en paralelo corran en paralelo. Con `connection_limit=1` se hacen una tras otra.
- Con `npm run dev` en `api/`, cada petición imprime su duración (`MÉTODO ruta estado ms`).


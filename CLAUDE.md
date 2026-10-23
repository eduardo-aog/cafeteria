# Proyecto Cafetería — Especificación completa para el agente

Este documento es la **fuente de verdad** del proyecto. Describe qué se construye, con qué tecnología, en qué orden y con qué reglas de negocio. Léelo completo antes de escribir código y vuelve a consultarlo antes de empezar cada fase.

---

## 0. Cómo trabajar con este documento

### 0.1 Reglas para el agente

1. **Al empezar cada sesión**, antes de cualquier otra cosa:
   - Lee este documento completo y `PROGRESO.md` (si existe).
   - Ejecuta `git status`, `git branch --show-current` y `git log --oneline -5`.
   - Dile al usuario, en una o dos frases, en qué fase y en qué paso está el proyecto y qué vas a hacer a continuación.
   - Si `PROGRESO.md` indica una PARADA pendiente, **vuelve a mostrarla completa** (protocolo 0.3) en lugar de avanzar.
2. **Trabaja por fases** (sección 14), en orden y paso a paso. No empieces una fase sin haber cerrado la anterior, incluida su PARADA de cierre.
3. **Cumple el protocolo de PARADA (0.3)**, tanto en cada punto marcado con ⛔ como en las situaciones imprevistas que lista. **Nunca simules, omitas ni reemplaces por un *mock*** un servicio externo (Supabase, Render, GitHub, la API del BCV) para poder avanzar.
4. **Git**:
   - Al empezar una fase: `git checkout main && git pull`, y luego crea la rama que indica la fase.
   - Durante la fase, haz commits pequeños con mensajes tipo Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
   - Tú haces los commits. **El push y la unión a `main` los hace el usuario** en la PARADA de cierre, con los comandos que le das.
   - Nunca uses `git push --force` ni `git reset --hard`, ni reescribas el historial de `main`.
5. **Al terminar el trabajo técnico de cada fase**:
   - Ejecuta `npm run typecheck`, `npm run lint`, `npm run build` y `npm test` en `api/` y en `web/`. Todo debe pasar.
   - Comprueba tú mismo los criterios de aceptación que se puedan comprobar desde la terminal.
   - Actualiza `PROGRESO.md` y haz commit.
   - Abre la PARADA de cierre (0.4).
6. **No inventes funcionalidades.** Si algo no está aquí, no se construye. La sección 17 lista lo que está FUERA de alcance.
7. **Si una regla es ambigua o contradictoria, pregunta** antes de implementar (parada no prevista, 0.3). No elijas en silencio.
8. **Si una decisión técnica menor no está especificada** (por ejemplo, el nombre de un archivo interno), elige lo más simple y regístrala en `PROGRESO.md` y en el cierre de la fase.
9. **Toda la lógica de negocio vive en el servidor** (`api/`). La página web (`web/`) solo muestra datos y envía acciones. Nunca calcules en el cliente un monto, unos puntos o la validez de un cupón sin que el servidor lo confirme.
10. **Secretos**:
    - Nunca escribas, muestres ni registres en consola el contenido real de un `.env`. Mantén actualizados los `.env.example`.
    - **Nunca pidas al usuario que pegue en el chat claves, contraseñas o cadenas de conexión.** Dile en qué archivo y en qué variable debe ponerlas.
    - Para saber si un `.env` está completo, usa `npm run env:check`: informa qué variables faltan sin mostrar sus valores.
    - Las URLs públicas (por ejemplo, la de un servicio de Render) no son secretas. El usuario puede pasártelas por el chat.
11. **Instalaciones**:
    - Puedes instalar dependencias con `npm` dentro del proyecto.
    - Todo lo que necesite `sudo`, instalar programas en el sistema o cambiar su configuración es una PARADA no prevista.
12. Antes de usar una librería, comprueba en su documentación la API de la versión instalada. No asumas APIs de memoria.

### 0.2 Idioma y estilo

- **Código** (variables, funciones, tablas, rutas de la API): en inglés.
- **Textos de la interfaz** (botones, mensajes, errores mostrados al usuario): solo en español.
- **Comentarios del código**: en español, solo donde aporten (reglas de negocio no obvias).
- Los mensajes de error de la API llevan un `code` en inglés (para el código) y un `message` en español (para mostrarlo).
- **Mensajes del agente al usuario**: en español.

### 0.3 Protocolo de PARADA

Una **PARADA** es un punto en el que el trabajo depende de algo que solo puede hacer el usuario: crear una cuenta, configurar un servicio externo, poner credenciales, preparar un teléfono, probar o unir una rama.

- Las paradas previstas están marcadas con **⛔ PARADA** en la sección 14.
- Los pasos de referencia de cada una están en la sección 4. Al redactar la parada, cópialos completos y adáptalos, sin omitir ninguno.

**Al llegar a una PARADA:**

1. Lleva el trabajo en curso a un punto estable y haz commit.
2. Actualiza `PROGRESO.md` con el paso `esperando ⛔ PARADA X.Y — <título>` y haz commit.
3. Escribe al usuario un mensaje con **exactamente** esta estructura:

   ```
   ⛔ PARADA X.Y — <título>

   Por qué me detengo: <una frase>

   Para continuar, haz lo siguiente:
   1. <una sola acción concreta: dónde entrar, qué opción tocar, qué escribir>
   2. …

   Dónde va cada dato:
   - <VARIABLE> → archivo <ruta>. Lo encuentras en <lugar exacto>.
   (No me pegues aquí claves, contraseñas ni cadenas de conexión: ponlas directamente en el archivo.)

   Cómo saber que quedó bien: <algo que el usuario pueda ver con sus ojos>

   Cuando termines, responde «listo». Si algo de lo que ves en pantalla no coincide con estos pasos, dime qué ves y te guío.
   ```

   Reglas de redacción:
   - Cada paso es **una sola acción**, en orden, sin suponer conocimientos previos.
   - Los comandos van completos y listos para copiar, en bloques de código, indicando en qué carpeta se ejecutan.
   - Si la parada no involucra datos, omite la sección «Dónde va cada dato».
   - Además de la ruta de menús, di **qué se quiere lograr** (por ejemplo, «que nadie pueda registrarse directamente en Supabase»). Así el usuario puede encontrarlo aunque la pantalla del servicio haya cambiado de nombre.
4. **No sigas** hasta que el usuario responda «listo» o algo equivalente e inequívoco. Si mientras tanto pide otra cosa, atiéndela y al final recuérdale que la PARADA sigue pendiente.
5. Tras el «listo», **verifica tú** todo lo que se pueda verificar desde la terminal: `env:check`, `supabase:check`, conexión a la base de datos, `curl` a las URLs, `git fetch`.
   - Si todo está bien, dilo en una frase, marca la parada como confirmada en `PROGRESO.md` y continúa.
   - Si algo falla, explica qué falló (sin mostrar secretos) y vuelve a abrir la misma parada **solo con los pasos pendientes**, con el mismo formato.

**Paradas no previstas.** Detente de inmediato con el mismo formato, numerándolas `X.E1`, `X.E2`, etc., si ocurre cualquiera de estas situaciones:

- Falta una credencial o una variable de entorno.
- Un servicio externo no responde o rechaza la conexión (Supabase, Render, GitHub, la API del BCV).
- Hace falta instalar algo con `sudo` o cambiar la configuración del sistema.
- Hace falta una acción **destructiva o irreversible**: borrar datos, `prisma migrate reset`, borrar archivos del usuario o reescribir el historial de Git. En este caso:
  - Explica exactamente qué se perderá.
  - Pide que el usuario responda **«confirmo»** (no «listo»).
  - Si responde otra cosa, no lo hagas.
- Una regla de este documento es ambigua o contradictoria y hace falta una decisión del usuario. En este caso, en lugar de pasos, plantea la pregunta con las opciones y tu recomendación.
- Llevas dos intentos fallidos de resolver un mismo error y la causa parece estar fuera del código (configuración, permisos, red o cuotas de un servicio).

### 0.4 PARADA de cierre de fase

Toda fase termina con una PARADA de cierre (`X.Z`) con esta estructura:

```
⛔ PARADA X.Z — Cierre de la Fase X: <nombre>

Qué quedó hecho:
- …

Decisiones menores que tomé:
- … (o «Ninguna»)

Comprobaciones que ya hice yo:
- typecheck, lint, build y tests en api/ y web/: OK
- …

Antes de probar, levanta el proyecto (o dime si prefieres que lo deje corriendo yo):
    cd api && npm run dev       (terminal 1)
    cd web && npm run dev       (terminal 2)

Pruebas que debes hacer tú, en este orden:
1. <acción> → Deberías ver: <resultado esperado>
2. …

Si todo funciona, sube la rama y únela a main:
    git push -u origin feat/fase-XX-nombre
Después, en GitHub: abre el repositorio → «Compare & pull request» → «Create pull request» → «Merge pull request» → «Confirm merge».

Cuando la rama esté unida a main, responde «listo». Si una prueba falla, dime cuál y qué viste en su lugar.
```

Reglas del cierre:

- Las pruebas parten de las que indica la fase en la sección 14, más las que hayas añadido.
- Indica las URLs y las cuentas a usar. Para las contraseñas, di de dónde salen («la que pusiste en `SEED_DEMO_PASSWORD`»), nunca su valor.
- Tras el «listo», comprueba con `git fetch origin && git log origin/main --oneline -5` que la rama quedó unida.
  - Si quedó unida, marca la fase como cerrada en `PROGRESO.md`.
  - Si no, dilo y espera.
- Si el usuario informa que una prueba falla, corrígelo en la misma rama y vuelve a abrir el cierre.

### 0.5 Archivo `PROGRESO.md`

Lo mantiene el agente en la raíz del repositorio y lo incluye en los commits de cada fase. Sirve para que cualquier sesión nueva sepa dónde quedó el proyecto. Formato:

```markdown
# Progreso del proyecto

## Estado actual
- Fase: 3 — Autenticación y permisos
- Rama: feat/fase-03-auth
- Paso: esperando ⛔ PARADA 3.Z — Cierre de la Fase 3

## Paradas confirmadas
- 0.A Requisitos previos — 2026-10-24
- 1.A Supabase y archivos .env — 2026-10-24

## Fases cerradas
- Fase 1 — Base del repositorio (unida a main el 2026-10-24)

## Decisiones menores tomadas
- Fase 1: …
```

---

## 1. Contexto del producto

Es una **aplicación web de pedidos anticipados para UNA sola cafetería** (referencia de dinámica: Starbucks). El objetivo es **reducir el tiempo de ordenar y pagar** de los clientes que lo deseen, más un **sistema de puntos y fidelidad**. No reemplaza la atención humana, la complementa.

- Modalidad: **solo pickup** (retiro en el mostrador del local). No hay consumo en mesa ni delivery.
- Contexto operativo: preparación de 10 a 20 minutos y 3 a 5 personas atendiendo indistintamente.

### 1.1 Flujo resumido

1. El cliente arma su pedido en el **checkout** desde el menú.
2. Toca **Pagar**, ve los datos de **Pago Móvil** del local, paga con su banca y escribe la **referencia** en la app.
3. Un **cajero** verifica la referencia en su cola y marca el pedido como **pagado**. En ese momento se acreditan los puntos.
4. El pedido pagado queda en el **inventario** del cliente con un **QR** y un **código corto**.
5. En el mostrador, el cajero **escanea** el QR (o escribe el código). El pedido pasa a la **cola del barista**. Ahí termina el flujo para el cliente.
6. El barista prepara el pedido, lo entrega en el mostrador y lo **elimina** de su cola.

---

## 2. Stack tecnológico (decidido, no cambiar)

| Capa | Tecnología |
|---|---|
| Lenguaje | **TypeScript** en todo el proyecto (modo `strict`) |
| Página web | **React + Vite**, página web simple (**sin PWA**) |
| UI | **Tailwind CSS + shadcn/ui**, con el tema propio de 10.6; iconos `lucide-react`; notificaciones en pantalla con `sonner` (componente de shadcn) |
| Tipografías | Lora (títulos) e Inter (interfaz), instaladas con `@fontsource/lora` y `@fontsource-variable/inter` |
| Enrutado web | React Router |
| Datos en la web | TanStack Query (con refresco automático por intervalo) |
| Formularios | react-hook-form + zod |
| Servidor | **Node.js 22 LTS + Express 5** |
| Validación en servidor | zod |
| Base de datos | **PostgreSQL en Supabase** |
| ORM | **Prisma 6.x** (fijar la versión mayor 6) |
| Autenticación | **Supabase Auth** (correo + contraseña). Los permisos se validan en el servidor |
| Archivos | Supabase Storage (imágenes de productos) |
| Fechas y zonas horarias | Luxon (en `api` y `web`) |
| Tareas programadas | node-cron (en `api`) |
| QR (generar) | `qrcode.react` |
| QR (escanear) | `@yudiel/react-qr-scanner` (alternativa: `html5-qrcode` si falla en Safari iOS) |
| Pruebas unitarias | Vitest (solo funciones puras críticas, ver 14) |
| Calidad | ESLint + Prettier |
| Alojamiento | **Render**: página como *Static Site* y servidor como *Web Service* (plan gratuito) |
| Mantener despierto | UptimeRobot llamando a `GET /api/health` cada 5 minutos |

Gestor de paquetes: **npm**. Cada carpeta (`web/` y `api/`) tiene su propio `package.json`.

---

## 3. Estructura del repositorio

Es un solo repositorio con dos carpetas y ramas por funcionalidad.

```
/
├── CLAUDE.md                  ← este documento
├── PROGRESO.md                ← estado del avance (lo mantiene el agente, ver 0.5)
├── README.md                  ← cómo instalar, correr y desplegar
├── .gitignore
├── api/                       ← servidor Express
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── src/
│       ├── index.ts           ← arranque del servidor y de las tareas programadas
│       ├── app.ts             ← instancia de Express (middlewares y rutas)
│       ├── config/env.ts      ← lectura y validación de variables de entorno con zod
│       ├── lib/               ← prisma client, supabase admin client, logger
│       ├── middleware/        ← auth, permisos, manejo de errores, validación
│       ├── domain/            ← funciones PURAS: dinero, puntos, cupones, horario, códigos
│       ├── services/          ← lógica de negocio con acceso a BD (transacciones)
│       ├── routes/            ← routers por área: auth, menu, checkout, cashier, barista, manager, admin
│       └── jobs/              ← tareas programadas (BCV, expiraciones)
└── web/                       ← página React
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── .env.example
    ├── public/images/         ← imágenes genéricas por categoría
    └── src/
        ├── main.tsx
        ├── App.tsx            ← rutas
        ├── lib/               ← cliente supabase, cliente api (fetch con token), formato de montos y fechas
        ├── hooks/             ← useMe, usePermissions, consultas TanStack
        ├── components/        ← componentes compartidos y ui/ de shadcn
        ├── layouts/           ← layout cliente (barra inferior) y layout de trabajo
        └── pages/
            ├── auth/          ← login, registro
            ├── customer/      ← menú, producto, checkout, pago, pedidos, historial, puntos, recompensas, cupones
            └── staff/         ← cajero, barista, gerente, administrador
```

Scripts mínimos en cada `package.json`: `dev`, `build`, `start` (solo api), `typecheck`, `lint`, `format`, `test` y `env:check`.

- En `web/`, además: `dev:https` y `preview`.
- En `api/`, además:
  - Base de datos: `db:migrate`, `db:deploy`, `db:seed`, `db:seed:sales`, `db:studio` y `db:reset-demo`.
  - Comprobación: `supabase:check`.
  - Desarrollo: `dev:store-open`, `dev:store-default`, `dev:expire-checkouts` y `dev:expire-coupons`.
- El momento en que se crea cada script está en la sección 14.

Cada carpeta tiene un archivo `.node-version` con `22`. Render lo usa para elegir la versión de Node.

Para `api/`: desarrollo con `tsx watch src/index.ts`, compilación con `tsup` (formato ESM, dependencias externas) y salida en `dist/`.

---

## 4. Pasos manuales del usuario (referencia para las PARADAS)

Esta sección es la base de cada PARADA. El agente la copia en el mensaje adaptándola (protocolo 0.3), sin omitir pasos.

### 4.1 Requisitos previos (antes de la primera sesión · PARADA 0.A si falta algo)

Lo ideal es hacerlos antes de abrir Claude Code. Si en la Fase 0 el agente detecta que falta alguno, abre la PARADA 0.A **solo con lo que falte**.

1. **Node.js 22 LTS** con `fnm`:
   ```bash
   curl -fsSL https://fnm.vercel.app/install | bash
   ```
   Cierra y vuelve a abrir la terminal, y luego:
   ```bash
   fnm install 22
   fnm default 22
   node -v    # debe empezar por v22
   ```
   Si el instalador pide `unzip`, instálalo con `sudo dnf install unzip` y repite el primer comando.
2. **Git configurado**:
   ```bash
   git --version || sudo dnf install git
   git config --global user.name "Tu nombre"
   git config --global user.email "tu-correo@ejemplo.com"
   ```
3. **GitHub CLI**, para que Git pueda subir cambios a GitHub:
   ```bash
   sudo dnf install gh
   gh auth login
   ```
   Elige: GitHub.com → HTTPS → «Login with a web browser» y sigue las instrucciones.
4. **Repositorio vacío en GitHub**:
   1. En github.com, toca «New repository».
   2. Nombre: por ejemplo, `cafeteria`.
   3. Visibilidad: **Private**.
   4. **No** marques README, `.gitignore` ni licencia.
   5. Toca «Create repository».
5. **Clonarlo y subir este documento**:
   ```bash
   gh repo clone <tu-usuario>/cafeteria
   cd cafeteria
   # copia aquí el archivo CLAUDE.md
   git add CLAUDE.md
   git commit -m "docs: especificación del proyecto"
   git branch -M main
   git push -u origin main
   ```
6. **Abrir Claude Code** dentro de la carpeta del repositorio con el comando `claude`.

### 4.2 Supabase y archivos `.env` (PARADA 1.A)

**Proyecto**

1. Entra en supabase.com con tu cuenta (puede ser con GitHub).
2. Toca «New project» y elige tu organización personal.
3. Nombre del proyecto: `cafeteria`.
4. **Database Password**: genera una y guárdala en un lugar seguro.
   - Usa **solo letras y números**. Los símbolos (`@ # / : ?`) rompen las cadenas de conexión si no se codifican.
5. **Region**: **East US (North Virginia)**. Es la misma región que se usará en Render (sección 16), para que el servidor y la base de datos estén cerca.
6. Toca «Create new project» y espera a que termine de prepararse.

**Autenticación.** Objetivo: iniciar sesión con correo, sin confirmación por correo, y que nadie pueda registrarse directamente en Supabase.

7. Ve a Authentication → Sign In / Providers → **Email**. Debe estar **habilitado**.
8. En esa misma pantalla, desactiva **Confirm email** y guarda.
9. En la misma zona (sección de registros de usuarios), desactiva **Allow new users to sign up** y guarda.

**Storage**

10. Ve a Storage → «New bucket».
11. Nombre: `product-images`. Activa **Public bucket** y crea el bucket.

**Archivos `.env`**

12. En la terminal, en la raíz del repositorio:
    ```bash
    cp api/.env.example api/.env
    cp web/.env.example web/.env
    ```
13. Abre los dos archivos en tu editor y rellena:

    | Variable | Archivo | Dónde la encuentras |
    |---|---|---|
    | `SUPABASE_URL` | `api/.env` | Project Settings → Data API (o API) → **Project URL** |
    | `VITE_SUPABASE_URL` | `web/.env` | El mismo valor que `SUPABASE_URL` |
    | `VITE_SUPABASE_ANON_KEY` | `web/.env` | Project Settings → API Keys → clave **anon** o **publishable** |
    | `SUPABASE_SERVICE_ROLE_KEY` | `api/.env` | Project Settings → API Keys → clave **service_role** o **secret**. Es privada: **nunca** va en `web/.env` |
    | `DATABASE_URL` | `api/.env` | Botón **Connect** (arriba en el proyecto) → **Transaction pooler** (puerto 6543). Sustituye `[YOUR-PASSWORD]` por la contraseña y añade al final `?pgbouncer=true&connection_limit=1` |
    | `DIRECT_URL` | `api/.env` | Botón **Connect** → **Session pooler** (puerto 5432). Sustituye `[YOUR-PASSWORD]` |
    | `SEED_ADMIN_NAME` | `api/.env` | Nombre que quieras para el administrador |
    | `SEED_ADMIN_EMAIL` | `api/.env` | Correo del administrador. No tiene que existir de verdad, porque no hay verificación de correo |
    | `SEED_ADMIN_PASSWORD` | `api/.env` | Contraseña del administrador, de mínimo 8 caracteres |
    | `SEED_DEMO_PASSWORD` | `api/.env` | Contraseña de las cuentas de demostración, de mínimo 8 caracteres |

14. Deja como están `NODE_ENV`, `PORT`, `WEB_ORIGIN`, `BCV_API_URL`, `SUPABASE_STORAGE_BUCKET` y `VITE_API_URL`.
15. Guarda los dos archivos.

**Comprobación** (la hace el agente tras el «listo»): `npm run env:check` en `api/` y `web/`, `npm run supabase:check` en `api/` y la conexión a la base de datos por las dos URLs.

### 4.3 Probar desde el teléfono (PARADAS 6.A y 7.A)

El agente levanta el servidor con `npm run dev` en `api/` y la web con `npm run dev:https` en `web/` (HTTPS de desarrollo con acceso por la red local). El teléfono solo necesita llegar a la web: las llamadas a la API pasan por el proxy de Vite.

1. Conecta el teléfono a la **misma red Wi-Fi** que el computador.
2. Abre temporalmente el puerto de Vite en el cortafuegos de Fedora. Sin `--permanent`, el cambio se revierte solo al reiniciar:
   ```bash
   sudo firewall-cmd --add-port=5173/tcp
   ```
3. En el teléfono, abre la dirección **Network** que muestra Vite en la terminal: `https://192.168.x.x:5173`. El agente te la indicará.
4. Acepta la advertencia del certificado local:
   - **Chrome (Android)**: «Configuración avanzada» → «Acceder a … (sitio no seguro)».
   - **Safari (iPhone)**: «Mostrar detalles» → «visitar este sitio web» → confirmar.
5. Cuando la web pida la cámara (escáner del cajero, Fase 7), toca «Permitir».
6. Dispositivos para el flujo completo:
   - Uno como **cliente**, otro como **cajero** y una ventana más como **barista**.
   - Pueden ser el teléfono y el computador. Para tener dos sesiones distintas en el computador, usa una ventana normal y otra de incógnito.
7. Cuando ya no vayas a probar, cierra el puerto:
   ```bash
   sudo firewall-cmd --remove-port=5173/tcp
   ```

**Si el teléfono no carga la página**:

- Comprueba que ambos estén en la misma red Wi-Fi. Algunas redes de invitados aíslan los dispositivos entre sí.
- Comprueba que el paso 2 se ejecutó sin error.

### 4.4 Render (PARADAS 10.A, 10.B y 10.C)

Usa tu **cuenta principal** de Render, **no** la del script del BCV. Los valores exactos de cada campo están en la sección 16.

**10.A — Servidor**

1. Entra en render.com (puedes registrarte con GitHub).
2. Toca «New» → «Web Service».
3. Conecta GitHub y da acceso al repositorio del proyecto. Puedes limitar el acceso solo a ese repositorio.
4. Rellena los campos con la tabla «Servidor» de la sección 16 (región **Virginia**, plan **Free**).
5. En «Environment Variables», añade una a una las variables de `api/.env`, copiando los valores del archivo, con tres cambios:
   - `NODE_ENV` = `production`.
   - `WEB_ORIGIN` = `https://pendiente.onrender.com` (valor provisional, se corrige en 10.C).
   - **No** añadas las variables `SEED_*`.
6. Toca «Create Web Service» y espera a que el estado sea **Live**. El primer despliegue tarda unos minutos.
7. Copia la URL del servicio (`https://….onrender.com`) y **pégala en el chat**. No es secreta.

**10.B — Página**

8. Toca «New» → «Static Site» y elige el mismo repositorio.
9. Rellena los campos con la tabla «Página» de la sección 16.
10. Variables de entorno:
    - `VITE_API_URL` = URL del servidor + `/api`.
    - `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`, copiadas de `web/.env`.
11. Toca «Create Static Site» y espera a **Live**.
12. En el sitio, ve a «Redirects/Rewrites» y añade una regla: Source `/*`, Destination `/index.html`, Action **Rewrite**. Guarda.
13. Copia la URL del sitio y **pégala en el chat**.

**10.C — Cruzar las URLs**

14. En el **servidor**, ve a «Environment» y cambia `WEB_ORIGIN` por la URL del sitio, **sin** `/` al final.
15. Guarda eligiendo la opción que también redespliega (por ejemplo, «Save, rebuild, and deploy»). Si solo guarda, usa «Manual Deploy» → «Deploy latest commit».
16. Espera a **Live**.

A partir de aquí:

- Cada unión a `main` redespliega los dos servicios automáticamente.
- Si cambia una variable `VITE_*`, hay que redesplegar el sitio, porque Vite las incrusta al compilar.

### 4.5 UptimeRobot (PARADA 10.D)

1. Entra en uptimerobot.com y crea una cuenta gratuita.
2. Toca «New monitor».
   - Tipo: **HTTP(s)**.
   - Nombre: `Cafetería API`.
   - URL: `https://<servidor>.onrender.com/api/health/db`.
   - Intervalo: **5 minutos**.
3. Créalo, espera unos minutos y comprueba que aparece como **Up**.

Esto evita que Render suspenda el servidor por inactividad. Como esa ruta consulta la base de datos, también mantiene activo el proyecto gratuito de Supabase, que se pausa si pasa días sin uso.

### 4.6 Prueba final y entrega (PARADAS 10.E y 10.F)

1. En **Chrome de Android** y en **Safari de iPhone**, abre la URL del sitio y recorre la lista de pruebas de la PARADA 10.E.
2. Revisa la lista de bancos (8.6.1) contra la lista oficial vigente y dile al agente si hay cambios.
3. En tu otra cuenta de Render, comprueba que el script del BCV sigue activo. El agente ya habrá probado que responde.
4. Decide si se limpia la base de datos antes de la demostración (PARADA 10.F, opcional y destructiva).

---

## 5. Variables de entorno

### 5.1 `api/.env.example`

```
# Base de datos (Supabase)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Supabase (clave privada: SOLO en el servidor)
SUPABASE_URL="https://[ref].supabase.co"
SUPABASE_SERVICE_ROLE_KEY=""
SUPABASE_STORAGE_BUCKET="product-images"

# Servidor
NODE_ENV="development"
PORT=3000
WEB_ORIGIN="http://localhost:5173"

# API del BCV
BCV_API_URL="https://bcv-script.onrender.com/rates"

# Datos de demostración (solo para el seed)
SEED_ADMIN_NAME="Administrador"
SEED_ADMIN_EMAIL=""
SEED_ADMIN_PASSWORD=""
SEED_DEMO_PASSWORD=""
```

### 5.2 `web/.env.example`

```
# En desarrollo: "/api" (pasa por el proxy de Vite hacia http://localhost:3000).
# En Render: URL completa del servidor + /api.
VITE_API_URL="/api"
VITE_SUPABASE_URL="https://[ref].supabase.co"
VITE_SUPABASE_ANON_KEY=""
```

`api/src/config/env.ts` valida con zod todas las variables al arrancar. Si falta alguna, el servidor no arranca y muestra cuál.

---

## 6. Convenciones transversales (obligatorias)

### 6.1 Dinero

- Los precios están referenciados en **dólares** y se guardan como **centavos enteros** (`Int`). `$4,00` se guarda como `400`. **Nunca uses `float` para dinero.**
- La **tasa BCV** se guarda como entero en centésimas de bolívar por dólar: `886,23` se guarda como `88623`.
- Conversión a bolívares (en céntimos): `bsCents = Math.round(usdCents * rateHundredths / 100)`.
  - Ejemplo: `400 * 88623 / 100 = 354492`, que se muestra como `Bs 3.544,92`.
- Los descuentos se **redondean al centavo más cercano**: `Math.round(unitPriceCents * percent / 100)`.
- **Formato venezolano**: punto para miles y coma para decimales.
  - Dólares: `$4,00` y `$1.250,50` (símbolo pegado, sin espacio).
  - Bolívares: `Bs 3.544,92` (con espacio).
  - Implementa un formateador propio (`formatUsd`, `formatBs`). No dependas de `Intl` con `es-VE`, porque varía entre navegadores.
- En el menú y en el checkout se muestran **siempre ambos montos** ($ y Bs).

### 6.2 Tiempo

- Los servidores trabajan en **UTC** y la base de datos guarda `timestamptz` en UTC.
- **Toda comparación de horario del local, vencimiento de cupones, "hoy", "esta semana", "este mes" y agrupación de reportes se hace en la zona `America/Caracas`** (UTC-4, sin horario de verano). Usa siempre Luxon con la zona explícita. Nunca dependas de la zona del sistema.
- "Esta semana" va de **lunes a domingo** en hora de Caracas.
- Formatos de fecha en pantalla: `23/10/2026` y hora `3:45 p. m.`

### 6.3 Errores de la API

Todas las respuestas de error tienen esta forma:

```json
{ "error": { "code": "STORE_CLOSED", "message": "El local está cerrado. Horario: lunes a sábado de 8:00 a. m. a 8:00 p. m." } }
```

| Situación | Código HTTP |
|---|---|
| Validación fallida | 400 (incluye `details` con los campos) |
| Sin sesión | 401 |
| Sin permiso | 403 |
| No encontrado | 404 |
| Conflicto de estado | 409 (ya verificado, ya escaneado, estado inválido) |
| Límite superado | 429 |

Un middleware central convierte errores de zod, errores de dominio (clase `AppError(code, message, status)`) y errores inesperados. Los errores inesperados devuelven 500 con un mensaje genérico y se registran en consola.

### 6.4 Concurrencia

Toda transición de estado (pedido, envío de pago, cupón, saldo de puntos) se hace con **actualización condicional dentro de una transacción**: `updateMany` con `where: { id, status: <estado esperado> }`.

- Si el conteo es 0, otra acción llegó primero y se responde 409.
- Esto evita, por ejemplo, que dos cajeros acrediten puntos dos veces.

---

## 7. Modelo de datos

### 7.1 `api/prisma/schema.prisma`

Implementa este esquema. Puedes ajustar detalles menores (índices, nombres de relaciones) si Prisma lo exige, pero no cambies el significado.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum Category {
  CAFE
  BEBIDAS
  POSTRES
}

enum OrderStatus {
  CREATED          // en el checkout; solo lo ve el cliente
  IN_VERIFICATION  // referencia enviada; espera al cajero
  PAID             // verificado; en el inventario del cliente con su QR
  IN_QUEUE         // escaneado en mostrador; en la cola del barista
  DELIVERED        // el barista lo eliminó de la cola al entregarlo
  EXPIRED          // checkout sin referencia en el plazo
  CANCELLED        // checkout cancelado por el cliente
}

enum SubmissionStatus {
  PENDING
  APPROVED
  REJECTED
}

enum RejectReason {
  REFERENCE_NOT_FOUND
  WRONG_AMOUNT
  OTHER
}

enum VerificationAction {
  APPROVED
  REJECTED
}

enum RewardType {
  PERCENT_DISCOUNT
  FREE_PRODUCT
}

enum CouponStatus {
  AVAILABLE
  RESERVED  // aplicado en un checkout no pagado
  USED
  EXPIRED
}

enum PointsMovementType {
  EARN
  REDEEM
}

model User {
  id            String   @id @db.Uuid // = id de auth.users en Supabase
  name          String
  email         String   @unique
  isAdmin       Boolean  @default(false)
  canCashier    Boolean  @default(false)
  canBarista    Boolean  @default(false)
  canManager    Boolean  @default(false)
  pointsBalance Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  orders              Order[]             @relation("OrderCustomer")
  scannedOrders       Order[]             @relation("OrderScannedBy")
  deliveredOrders     Order[]             @relation("OrderDeliveredBy")
  restoredOrders      Order[]             @relation("OrderRestoredBy")
  submissions         PaymentSubmission[] @relation("SubmissionCustomer")
  reviewedSubmissions PaymentSubmission[] @relation("SubmissionReviewedBy")
  verificationLogs    VerificationLog[]
  coupons             Coupon[]
  pointsMovements     PointsMovement[]
}

model Bank {
  code        String              @id // "0102"
  name        String              // "Banco de Venezuela"
  submissions PaymentSubmission[]
}

model Product {
  id          String   @id @default(uuid()) @db.Uuid
  name        String
  description String
  priceCents  Int
  imageUrl    String?
  category    Category
  isAvailable Boolean  @default(true) // false = AGOTADO
  isActive    Boolean  @default(true) // false = dado de baja (nunca se borra)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  orderItems OrderItem[]
  rewards    Reward[]
  coupons    Coupon[]

  @@index([category, isActive])
}

model Order {
  id                String      @id @default(uuid()) @db.Uuid
  customerId        String      @db.Uuid
  customer          User        @relation("OrderCustomer", fields: [customerId], references: [id])
  status            OrderStatus @default(CREATED)

  everSubmitted     Boolean     @default(false) // true desde el primer envío de referencia
  expiresAt         DateTime?   // solo tiene sentido en CREATED
  rejectionStreak   Int         @default(0)
  blockedUntil      DateTime?

  // Instantánea tomada al enviar la referencia (precio congelado)
  totalCents        Int?
  amountBsCents     Int?
  bcvRateHundredths Int?

  paidAt            DateTime?
  pointsEarned      Int?
  pickupCode        String?     @unique // código corto alfanumérico (6)
  qrToken           String?     @unique @db.Uuid // contenido del QR

  scannedAt         DateTime?
  scannedById       String?     @db.Uuid
  scannedBy         User?       @relation("OrderScannedBy", fields: [scannedById], references: [id])
  deliveredAt       DateTime?
  deliveredById     String?     @db.Uuid
  deliveredBy       User?       @relation("OrderDeliveredBy", fields: [deliveredById], references: [id])
  restoredAt        DateTime?
  restoredById      String?     @db.Uuid
  restoredBy        User?       @relation("OrderRestoredBy", fields: [restoredById], references: [id])

  cancelledAt       DateTime?
  expiredAt         DateTime?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  items            OrderItem[]
  submissions      PaymentSubmission[]
  verificationLogs VerificationLog[]
  pointsMovements  PointsMovement[]

  @@index([customerId, status])
  @@index([status, scannedAt])
  @@index([status, expiresAt])
  @@index([paidAt])
}

model OrderItem {
  id             String   @id @default(uuid()) @db.Uuid
  orderId        String   @db.Uuid
  order          Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId      String   @db.Uuid
  product        Product  @relation(fields: [productId], references: [id])
  quantity       Int      // 1 si la línea lleva cupón
  couponId       String?  @db.Uuid
  coupon         Coupon?  @relation(fields: [couponId], references: [id])

  // Se rellenan al enviar la referencia (congelados); null mientras está en CREATED
  unitPriceCents Int?
  discountCents  Int?
  lineTotalCents Int?

  createdAt      DateTime @default(now())

  @@index([orderId])
}

model PaymentSubmission {
  id            String           @id @default(uuid()) @db.Uuid
  orderId       String           @db.Uuid
  order         Order            @relation(fields: [orderId], references: [id])
  customerId    String           @db.Uuid
  customer      User             @relation("SubmissionCustomer", fields: [customerId], references: [id])
  reference     String           // solo dígitos, 6 a 22
  bankCode      String
  bank          Bank             @relation(fields: [bankCode], references: [code])
  amountBsCents Int
  totalCents    Int
  status        SubmissionStatus @default(PENDING)
  rejectReason  RejectReason?
  rejectNote    String?
  reviewedById  String?          @db.Uuid
  reviewedBy    User?            @relation("SubmissionReviewedBy", fields: [reviewedById], references: [id])
  reviewedAt    DateTime?
  submittedAt   DateTime         @default(now())

  logs VerificationLog[]

  @@index([status, submittedAt])
  @@index([customerId, submittedAt])
}

// Registro INMUTABLE de cada verificación (solo INSERT)
model VerificationLog {
  id            String             @id @default(uuid()) @db.Uuid
  submissionId  String             @db.Uuid
  submission    PaymentSubmission  @relation(fields: [submissionId], references: [id])
  orderId       String             @db.Uuid
  order         Order              @relation(fields: [orderId], references: [id])
  cashierId     String             @db.Uuid
  cashier       User               @relation(fields: [cashierId], references: [id])
  action        VerificationAction
  reference     String
  bankCode      String
  amountBsCents Int
  rejectReason  RejectReason?
  rejectNote    String?
  createdAt     DateTime           @default(now())

  @@index([orderId])
}

model Reward {
  id         String     @id @default(uuid()) @db.Uuid
  name       String     // "Latte gratis", "50% en un producto"
  type       RewardType
  percent    Int?       // 1..100, solo PERCENT_DISCOUNT
  productId  String?    @db.Uuid // solo FREE_PRODUCT
  product    Product?   @relation(fields: [productId], references: [id])
  costPoints Int
  isActive   Boolean    @default(true)
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  coupons Coupon[]
}

model Coupon {
  id         String       @id @default(uuid()) @db.Uuid
  userId     String       @db.Uuid
  user       User         @relation(fields: [userId], references: [id])
  rewardId   String       @db.Uuid
  reward     Reward       @relation(fields: [rewardId], references: [id])
  // Copia de la recompensa al momento del canje
  title      String
  type       RewardType
  percent    Int?
  productId  String?      @db.Uuid
  product    Product?     @relation(fields: [productId], references: [id])
  pointsCost Int
  status     CouponStatus @default(AVAILABLE)
  expiresAt  DateTime     // fin de mes en America/Caracas, guardado en UTC
  redeemedAt DateTime     @default(now())
  usedAt     DateTime?

  orderItems      OrderItem[]
  pointsMovements PointsMovement[]

  @@index([userId, status])
  @@index([status, expiresAt])
}

model PointsMovement {
  id        String             @id @default(uuid()) @db.Uuid
  userId    String             @db.Uuid
  user      User               @relation(fields: [userId], references: [id])
  type      PointsMovementType
  points    Int                // positivo en EARN, negativo en REDEEM
  orderId   String?            @db.Uuid
  order     Order?             @relation(fields: [orderId], references: [id])
  couponId  String?            @db.Uuid
  coupon    Coupon?            @relation(fields: [couponId], references: [id])
  createdAt DateTime           @default(now())

  @@index([userId, createdAt])
}

model ExchangeRate {
  id             String   @id @default(uuid()) @db.Uuid
  rateHundredths Int      // 88623 = Bs 886,23 por dólar
  bcvDate        DateTime @db.Date // fecha que informa la API
  fetchedAt      DateTime @default(now())

  @@index([fetchedAt])
}

// Fila única (id = 1) con TODOS los parámetros editables por el administrador
model Settings {
  id                            Int      @id @default(1)
  pointsPerDollar               Int      @default(100)
  checkoutExpirationHours       Int      @default(24)
  maxPaidUnscannedOrders        Int      @default(10)
  rejectionsBeforeBlock         Int      @default(3)
  blockMinutes                  Int      @default(15)
  referenceSubmissionsPerMinute Int      @default(5)
  maxQuantityPerProduct         Int      @default(10)
  // Datos de cobro de Pago Móvil
  paymentDocType                String   @default("J") // V, E, J, G
  paymentDocNumber              String   @default("")
  paymentBankCode               String   @default("0134")
  paymentPhone                  String   @default("") // 04XXXXXXXXX
  // Horario (igual para todos los días abiertos)
  openDays                      Int[]    @default([1, 2, 3, 4, 5, 6]) // 1 = lunes … 7 = domingo (ISO, como Luxon)
  openTime                      String   @default("08:00")
  closeTime                     String   @default("20:00")
  updatedAt                     DateTime @updatedAt
}
```

### 7.2 SQL adicional (migraciones personalizadas)

Crea las migraciones con `prisma migrate dev --create-only`, añade este SQL al final y luego aplícalas.

**a) RLS activado en todas las tablas, sin políticas.** Solo el servidor accede. Prisma se conecta como dueño de las tablas, así que no le afecta. **No uses `FORCE ROW LEVEL SECURITY`.** Incluye este bloque al final de **toda** migración que cree tablas:

```sql
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;
```

**b) Unicidad de banco + referencia**, ignorando los envíos rechazados. Así un cliente puede reenviar la misma referencia si el cajero la rechazó por error.

```sql
CREATE UNIQUE INDEX "PaymentSubmission_bank_reference_active_key"
  ON "PaymentSubmission" ("bankCode", "reference")
  WHERE "status" <> 'REJECTED';
```

**c) Inmutabilidad del registro de verificaciones:**

```sql
CREATE OR REPLACE FUNCTION forbid_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Tabla de solo inserción: % no permitido en %', TG_OP, TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "VerificationLog_immutable"
  BEFORE UPDATE OR DELETE ON "VerificationLog"
  FOR EACH ROW EXECUTE FUNCTION forbid_mutation();
```

**d) Restricciones de rango** (CHECK):

- `Product.priceCents > 0`
- `OrderItem.quantity BETWEEN 1 AND 100`. El tope real lo pone `Settings`.
- `Reward.costPoints > 0`
- `Reward.percent BETWEEN 1 AND 100` cuando no es nulo
- `User.pointsBalance >= 0`

---

## 8. Reglas de negocio

### 8.1 Cuentas, roles y permisos

**Registro del cliente**

- Pide **nombre, correo, contraseña y confirmación de contraseña**.
- La contraseña tiene **mínimo 8 caracteres**. La confirmación se valida en el formulario y el servidor recibe solo la contraseña.
- El registro lo hace el **servidor**: `POST /api/auth/register` crea el usuario con `supabase.auth.admin.createUser({ email, password, email_confirm: true })` y luego la fila `User`.
  - Si falla la creación de la fila, borra el usuario de Auth para no dejar huérfanos.
  - Luego la web inicia sesión con `signInWithPassword`.
- **Sin** verificación de correo, **sin** recuperación de contraseña y **sin** edición de perfil (ni nombre, ni correo, ni contraseña).
- El cliente **sí** puede **cerrar sesión**.
- Se permite la **misma cuenta abierta en dos teléfonos** a la vez (comportamiento por defecto de Supabase).

**Inicio de sesión**

- La web usa Supabase **solo** para iniciar y cerrar sesión y para obtener el token.
- Cada llamada a la API envía `Authorization: Bearer <access_token>`.
- El servidor valida el token con `supabase.auth.getUser(token)` usando el cliente con clave privada y carga la fila `User`.
- Si el token es válido pero no hay fila `User`, responde 403 `PROFILE_NOT_FOUND`.

**Tipos de cuenta**

- **Cliente**: cuenta sin ningún permiso (`isAdmin`, `canCashier`, `canBarista` y `canManager` en `false`).
- **Cuenta de trabajo**: cualquier cuenta con al menos un permiso o con `isAdmin`. **No puede comprar, canjear ni acumular puntos.** Los endpoints de cliente le responden 403 `STAFF_CANNOT_BUY` y la web le muestra el panel de trabajo en lugar del menú.

**Permisos** (un solo rol "empleado" con permisos combinables):

| Permiso | Qué puede hacer |
|---|---|
| **Cajero** (`canCashier`) | Ver la **cola de verificación**, aprobar o rechazar pagos, escanear QR o ingresar código |
| **Barista** (`canBarista`) | Ver la cola de preparación y **eliminar** pedidos al entregarlos |
| **Gerente** (`canManager`) | Crear y editar productos, marcar agotado, **ver** la cola del barista (solo lectura), ver el **resumen de ventas del día** (solo lectura), **restaurar** a la cola un pedido eliminado el **mismo día** |
| **Administrador** (`isAdmin`) | Todo lo del gerente (implícito), además de dar de baja productos, recompensas, parámetros del sistema, datos de cobro, horario, asignación de permisos y reportes |

- La **cola de verificación la ven SOLO quienes tienen permiso de cajero**. El gerente y el administrador no la ven, salvo que tengan ese permiso.
- **Asignar permisos es exclusivo del administrador.**
  - El administrador busca por correo una cuenta ya registrada y activa o desactiva cajero, barista y gerente.
  - También puede darse a sí mismo cajero o barista.
- Hay **un solo administrador**, creado por el script de demostración. El permiso de administrador **no se puede asignar** desde el panel.
- Si a un empleado se le quitan todos los permisos, vuelve a ser cliente.

### 8.2 Horario del local

- El horario está en `Settings`: días abiertos de **lunes a sábado**, de **8:00 a. m. a 8:00 p. m.**, en hora de Caracas. El administrador puede editarlo.
- El local está abierto si el día ISO actual está en `openDays` y `openTime <= hora actual < closeTime`.
- **Fuera del horario no se pueden agregar productos al checkout**: error `STORE_CLOSED`.
- El **menú se puede ver siempre**, incluso fuera de horario y el domingo. Fuera de horario, el menú muestra un aviso "Cerrado · Abrimos …" y los botones de agregar se ven deshabilitados.
- **No hay** corte de recepción antes del cierre, ni botón de pausa, ni manejo especial de checkouts abiertos al cierre.

### 8.3 Catálogo y menú

- **Categorías fijas**: Café, Bebidas y Postres. Son el enum `Category`. No se crean desde el panel.
- **Datos de un producto**: nombre, descripción, precio en dólares, imagen opcional, categoría y disponibilidad.
- El **gerente** (y el administrador) crea y edita productos y activa o desactiva **agotado**.
- Solo el **administrador** da de baja un producto (`isActive = false`) y lo puede reactivar. **Nunca se borra** un producto.
- **Imagen**
  - Se sube **a través del servidor**: `multipart/form-data` con `multer` en memoria, máximo 2 MB, tipos jpeg, png o webp.
  - El servidor la guarda en Supabase Storage (bucket público `product-images`) con la clave privada y guarda la URL pública en `imageUrl`.
  - Si no hay imagen, la web muestra la **imagen genérica de su categoría** (`/images/categoria-cafe.svg`, `categoria-bebidas.svg` y `categoria-postres.svg`). Créalas como ilustraciones SVG originales con el estilo indicado en 10.6.
- **Agotado**: el producto se muestra **bloqueado** (visible, con etiqueta "Agotado" y sin poder agregarse). No se oculta.
- **Productos dados de baja**: no aparecen en el menú.
- **Orden del menú**: por categoría (Café, Bebidas, Postres) y, dentro de cada una, alfabético por nombre.
- **Sin personalización**: sin tamaños, sin variantes y sin notas por ítem.
- El menú muestra de forma **discreta** la tasa usada y su fecha. Ejemplo: `Tasa BCV del 23/10: Bs 886,23`.

### 8.4 Tasa BCV

- **Fuente**: `GET {BCV_API_URL}`. Devuelve una lista de monedas, cada una con `symbol`, `iso4217`, `name`, `price`, `date` y `day`.
  - Se toma el elemento con `iso4217 === "USD"`, se redondea `price` a 2 decimales y se guarda como centésimas enteras.
  - El `date` informado se guarda en `bcvDate`.
  - Valida la respuesta con zod. Si no cumple el formato, se trata como fallo.
- **Frecuencia**: **una vez al día a las 8:00 a. m. hora de Caracas** (node-cron con `timezone: 'America/Caracas'`).
  - Al arrancar el servidor, si la última tasa guardada es anterior a las 8:00 a. m. de hoy (Caracas), se consulta también.
- **Reintentos**: esa API está en un plan gratuito de Render y puede tardar en despertar. Usa timeout de 60 s y hasta 3 reintentos espaciados un minuto.
- **Si falla**, se sigue usando el **último valor guardado**.
- Si nunca se ha guardado ninguna tasa, el menú muestra los montos en dólares y el pago queda bloqueado con el error `RATE_UNAVAILABLE`.
- La tasa **no se fija durante el checkout**: el monto en Bs se calcula siempre con la tasa vigente, porque solo cambia con el local cerrado. Al enviar la referencia, el monto en Bs y la tasa quedan **congelados** en el pedido.

### 8.5 Checkout

**Concepto.** Un checkout es un `Order` en estado `CREATED`. Contiene líneas (`OrderItem`). El apartado **Checkout** de la web muestra **todos** los checkouts del cliente en `CREATED` y `IN_VERIFICATION`.

**Checkout abierto**

- Cada cliente tiene como máximo **un checkout abierto**: un `CREATED` con `everSubmitted = false`.
- Al agregar un producto se usa ese checkout. Si no existe, se crea.
- Un checkout que volvió a `CREATED` por un rechazo de pago **no recibe ítems nuevos**: sigue en el apartado para corregir y reenviar la referencia, quitar ítems o cancelarlo.

**Agregar un producto** (`POST /api/checkout/items`)

- Requisitos:
  - El local está abierto.
  - El producto está activo y no agotado.
  - La cuenta es de cliente.
- **Cantidad máxima por producto**: `maxQuantityPerProduct` (10). Es la suma de unidades de ese producto en todas las líneas del mismo checkout, con o sin cupón.
- **Sin cupón**: si ya existe una línea sin cupón de ese producto, se suma la cantidad. Si no, se crea la línea.
- **Con cupón**: se crea **siempre una línea nueva con cantidad 1** y el cupón pasa a `RESERVED`. Ver 8.9.
- Al agregar un ítem, **se reinicia el plazo**: `expiresAt = now + checkoutExpirationHours`.

**Modificar y quitar**

- Cambiar la cantidad de una línea sin cupón, entre 1 y el tope, solo en `CREATED`.
- **Quitar una línea suelta** siempre está disponible en `CREATED`. Si la línea tenía cupón, el cupón vuelve a `AVAILABLE`, o a `EXPIRED` si ya pasó su fecha.
- Si se quita la última línea, el checkout pasa a `CANCELLED`.

**Precios**

- Mientras está en `CREATED`, el checkout muestra **el precio vigente del catálogo**. El servidor calcula cada línea y el total (en $ y Bs) en cada consulta.
- El total se muestra **antes de pagar**.

**Cancelar**

- Solo en `CREATED`. Vacía todo el checkout: pasa a `CANCELLED` y sus cupones vuelven a `AVAILABLE` (o `EXPIRED` si ya vencieron).
- `IN_VERIFICATION` y estados posteriores **no se pueden cancelar**.

**Expiración**

- Un checkout `CREATED` cuyo `expiresAt` pasó, pasa a **`EXPIRED`**. No se borra.
- Sus cupones reservados vuelven a `AVAILABLE`, o a `EXPIRED` si ya pasó su fecha. **El cupón no se pierde si el pedido no se pagó.**
- El **reloj se detiene** al enviar la referencia (`IN_VERIFICATION` no expira).
- Los pedidos `PAID` **nunca expiran**.
- Se aplica de dos formas: con una tarea cada 5 minutos y de forma *perezosa* al leer los checkouts de un cliente, para que nunca vea un estado viejo.
- El apartado Checkout muestra como **"Expirado"** (solo lectura) los checkouts que expiraron en las últimas 24 horas. Después dejan de mostrarse.

**Tope de pedidos pagados sin retirar**

- Máximo `maxPaidUnscannedOrders` (10) pedidos en `PAID` a la vez por cliente. No es un tope de por vida: al escanear un pedido se libera un cupo. Solo cuentan los `PAID`.
- Se comprueba **al tocar "Pagar"**. Si ya tiene 10, se le avisa con `PAID_LIMIT_REACHED` y no puede continuar.
- Si varios checkouts en verificación lo hacen pasar de 10 al aprobarse, **se acepta el exceso**.

### 8.6 Pago y verificación

**Método**: **solo Pago Móvil**, todo dentro de la app.

- No hay pasarela de pago, ni WhatsApp, ni subida de comprobante: la evidencia es **solo la referencia escrita**.

**Paso 1: tocar "Pagar"** (`POST /api/checkouts/:id/prepare-payment`). Valida en este orden:

1. El checkout es del cliente y está en `CREATED`.
2. No está bloqueado: si `blockedUntil > now`, responde `CHECKOUT_BLOCKED` con la hora de desbloqueo.
3. **Productos agotados o dados de baja**: si alguna línea tiene un producto con `isAvailable = false` o `isActive = false`, responde `ITEMS_UNAVAILABLE` con la lista de líneas afectadas. La web pide **quitarlas antes de continuar**; no se rechaza todo el checkout.
4. **Cupones**: cada cupón de una línea debe seguir en `RESERVED` para ese usuario.
5. **Tope de pedidos pagados** (8.5).
6. Hay una tasa disponible.

Si todo pasa, devuelve:

- Los datos de cobro de `Settings`.
- El total en $ y en Bs.
- El texto listo para **COPIAR TODO**.
- La tasa usada.

**Paso 2: pestaña de pago** (pantalla en la web)

- Muestra **documento** (`J-12345678-9` o `V-12345678`), **banco** (código y nombre), **teléfono** y **monto en Bs** (y en $ como referencia).
- Un único botón **"COPIAR TODO"**, sin botones de copiar por dato. Copia un texto como este:
  ```
  Pago Móvil
  Banco: 0134 - Banesco
  Documento: J-12345678-9
  Teléfono: 0414-1234567
  Monto: Bs 3.544,92
  ```
  Usa `navigator.clipboard.writeText`. Como respaldo, un `textarea` oculto con `document.execCommand('copy')`. Muestra un aviso "Datos copiados".
- **Aviso visible**: "Un pedido pagado no se cancela ni se reembolsa."
- Debajo, el **formulario de referencia**:
  - **Referencia completa**: solo dígitos, mínimo 6 y máximo 22. Tiene un botón **PEGAR** que usa `navigator.clipboard.readText()`. Si el navegador no lo permite, el campo sigue editable a mano y se muestra un aviso breve. Al pegar, se conservan solo los dígitos.
  - **Banco emisor**: menú desplegable con la **lista fija de bancos** (8.6.1).
  - **Monto**: se rellena automáticamente con el monto en Bs y es de solo lectura.

**Paso 3: enviar la referencia** (`POST /api/checkouts/:id/payment` con `{ reference, bankCode }`)

1. Repite las validaciones 1 a 4 y 6 del paso 1. El tope de pagados no se repite.
2. **Límite de envíos**: como máximo `referenceSubmissionsPerMinute` (5) por usuario en los últimos 60 s, contados en la tabla `PaymentSubmission`. Si se supera, responde 429 `TOO_MANY_SUBMISSIONS`.
3. **Unicidad**: no puede existir otro envío no rechazado con el mismo banco y referencia. Si existe, responde 409 `DUPLICATE_REFERENCE` con el mensaje "Esa referencia ya fue registrada".
4. En una transacción:
   - **Congela los precios**: para cada línea, `unitPriceCents` toma el precio actual y se calculan `discountCents` y `lineTotalCents`.
   - Guarda en el pedido `totalCents`, `bcvRateHundredths` y `amountBsCents`.
   - Crea el `PaymentSubmission` en `PENDING`.
   - Cambia el pedido a `IN_VERIFICATION`, con `everSubmitted = true` y `expiresAt = null`.

**Caso especial: total $0,00** (todas las líneas cubiertas por cupones de producto gratis)

- No hay nada que transferir. La pestaña de pago muestra un botón **"Confirmar pedido"** en lugar de los datos y el formulario.
- El servidor (`POST /api/checkouts/:id/confirm-free`) congela los precios y pasa el pedido directo a `PAID`:
  - Cupones a `USED`.
  - 0 puntos.
  - Genera el QR y el código.
  - No crea `PaymentSubmission`.

**Paso 4: cola de verificación** (solo cajeros)

- Lista los envíos `PENDING`, el más antiguo primero. Cada uno muestra:
  - Nombre del cliente.
  - Ítems del pedido con cantidades y cupones aplicados.
  - Total en $ y **monto en Bs**.
  - Referencia, banco emisor y hora de envío.
- Se refresca automáticamente cada 5 segundos.
- **No hay** alertas por tiempo de espera.

**Aprobar** (`POST /api/cashier/submissions/:id/approve`), en una transacción:

1. Actualización condicional del envío: `PENDING` → `APPROVED` (`reviewedById` y `reviewedAt`).
   - Si el conteo es 0, responde 409 `ALREADY_REVIEWED` con el mensaje "Ya verificado por [nombre]" (nombre de `reviewedBy`).
2. Actualización condicional del pedido: `IN_VERIFICATION` → `PAID`, con `paidAt = now` y `rejectionStreak = 0`.
3. Genera `pickupCode` y `qrToken` (8.7).
4. Cupones de las líneas: `RESERVED` → `USED` (`usedAt`).
5. **Acredita puntos** (8.8): crea un `PointsMovement EARN`, incrementa `pointsBalance` y guarda `pointsEarned`.
6. Inserta en `VerificationLog` con la acción `APPROVED`.

**Rechazar** (`POST /api/cashier/submissions/:id/reject` con `{ reason, note? }`)

- Motivos posibles: "Referencia no encontrada", "Monto incorrecto" u "Otro". Si el motivo es "Otro", la nota es obligatoria (máximo 200 caracteres).
- Un **monto distinto del esperado se rechaza**: no se aceptan pagos incompletos. Un excedente no se reembolsa; eso lo informa el cajero, el sistema no hace nada.
- En una transacción:
  1. Actualización condicional del envío: `PENDING` → `REJECTED` (409 `ALREADY_REVIEWED` si llegó otro primero).
  2. El pedido vuelve a `CREATED`:
     - `expiresAt = now + checkoutExpirationHours` (**reloj reiniciado**).
     - Las líneas descongelan sus precios (`unitPriceCents`, `discountCents` y `lineTotalCents` a `null`).
     - Se limpian `totalCents`, `amountBsCents` y `bcvRateHundredths`.
     - Los cupones siguen `RESERVED`.
  3. `rejectionStreak += 1`. Si llega a `rejectionsBeforeBlock` (3): `blockedUntil = now + blockMinutes` (15) y `rejectionStreak = 0`.
  4. Inserta en `VerificationLog` con la acción `REJECTED` y el motivo.
- El cliente ve en su checkout el **motivo del último rechazo** para corregir y reenviar.
- **Bloqueo**: solo impide **enviar una nueva referencia en ese checkout**. El cliente puede seguir viendo el menú, quitar ítems o cancelar ese checkout. La web muestra "Podrás reenviar la referencia a las 4:32 p. m."

**Notificaciones**: **ninguna** (ni push ni correo). El cliente ve los cambios de estado porque la app se refresca sola: cada 10 s en checkout y pedidos.

#### 8.6.1 Lista fija de bancos (tabla `Bank`, cargada por el seed)

Úsala en el formulario del cliente (banco emisor) y en los datos de cobro del administrador.

| Código | Banco |
|---|---|
| 0102 | Banco de Venezuela |
| 0104 | Venezolano de Crédito |
| 0105 | Mercantil |
| 0108 | BBVA Provincial |
| 0114 | Bancaribe |
| 0115 | Banco Exterior |
| 0128 | Banco Caroní |
| 0134 | Banesco |
| 0137 | Sofitasa |
| 0138 | Banco Plaza |
| 0146 | Bangente |
| 0151 | BFC Banco Fondo Común |
| 0156 | 100% Banco |
| 0157 | DelSur |
| 0163 | Banco del Tesoro |
| 0166 | Banco Agrícola de Venezuela |
| 0168 | Bancrecer |
| 0169 | R4 Banco Microfinanciero |
| 0171 | Banco Activo |
| 0172 | Bancamiga |
| 0173 | Banco Internacional de Desarrollo |
| 0174 | Banplus |
| 0175 | Banco Digital de los Trabajadores |
| 0177 | BANFANB |
| 0178 | N58 Banco Digital |
| 0191 | BNC Banco Nacional de Crédito |

> Nota para el usuario: confirmar esta lista contra la vigente antes de la entrega.

**Validaciones de los datos de cobro**

- Documento: tipo `V`, `E`, `J` o `G` más el número. Cédula de 6 a 9 dígitos; RIF de 9 dígitos, mostrado como `J-12345678-9`.
- Teléfono: `^04\d{9}$`, mostrado como `0414-1234567`.

### 8.7 Retiro: QR, código y cola del barista

**Al pasar a `PAID`** se generan dos identificadores:

- `qrToken`: un UUID aleatorio. Es el **contenido del QR**: un identificador de todo el pedido, no los ítems.
- `pickupCode`: código corto de **6 caracteres** con el alfabeto `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (sin I, L, O, 0 ni 1). Ejemplo: `K7F2M9`. Es único en toda la tabla; si choca, se reintenta.
- **Un solo QR por pedido.** El código corto sirve de **respaldo** del QR.

**Inventario del cliente**

- Lista sus pedidos `PAID`. Al abrir uno ve el **QR grande**, el **código corto**, los ítems y el total pagado.
- **Precio congelado**: siempre muestra los valores guardados al pagar.

**Escaneo** (cajero, `POST /api/cashier/scan` con `{ code }`)

- La pantalla del cajero tiene la cámara del teléfono para escanear y un campo para escribir el código (sin distinguir mayúsculas).
- El servidor busca por `qrToken` (si el texto es un UUID) o por `pickupCode`.
- Respuestas posibles:
  - No existe: 404 `ORDER_NOT_FOUND`.
  - Estado distinto de `PAID`: 409 con un mensaje según el estado (por ejemplo, "Este pedido ya fue enviado a barra" o "Este pedido aún no está pagado").
- Si es válido, **pasa directo a la cola del barista, sin paso de confirmación**: actualización condicional `PAID` → `IN_QUEUE` con `scannedAt` y `scannedById`.
- El **QR es de un solo uso**: el pedido sale del inventario del cliente.
- La pantalla del cajero muestra un **aviso informativo** sin botón que tocar: `Pedido K7F2M9 de María enviado a barra`, con sus ítems y cantidades. El aviso desaparece solo o al escanear el siguiente.
- La cámara necesita HTTPS. En desarrollo con el teléfono se usa `npm run dev:https` en `web/`: `vite --host` con `@vitejs/plugin-basic-ssl`. La API llega por el proxy de Vite, así que no hay contenido mixto HTTP/HTTPS. Los pasos manuales están en 4.3.

**Cola del barista** (barista, y también gerente y administrador en solo lectura)

- Muestra los pedidos `IN_QUEUE` por **orden de llegada** (`scannedAt` ascendente). Se refresca cada 5 s.
- Cada pedido muestra **nombre del cliente**, **ítems con cantidades**, **hora del escaneo** y **código corto**.
- El barista **elimina** el pedido al entregarlo, con un botón "Entregado" y confirmación breve: `IN_QUEUE` → `DELIVERED` con `deliveredAt` y `deliveredById`. **El registro se conserva** en la base de datos.
- **Sin** estados intermedios ("en proceso" o "listo"). El cliente **no ve** nada de la preparación.

**Restaurar** (gerente y administrador)

- Pantalla "Restaurar pedidos" con los pedidos `DELIVERED` cuyo `deliveredAt` es **de hoy** (Caracas).
- "Restaurar" los devuelve a `IN_QUEUE` y guarda `restoredAt` y `restoredById`. Conservan su `scannedAt` original, así que vuelven a su posición por orden de llegada.
- Solo pedidos del mismo día: si no, responde 409 `RESTORE_WINDOW_PASSED`.

**Historial del cliente**

- Solo pedidos `IN_QUEUE` o `DELIVERED`, del más reciente al más antiguo, paginado de 20 en 20.
- Muestra la fecha, los ítems y el total pagado.
- **No** muestra QR ni código: es solo historial.
- Los expirados y cancelados **no aparecen**.

**Seguimiento visible para el cliente**: solo estos estados.

| Estado interno | Etiqueta en pantalla |
|---|---|
| `CREATED` | "Creado" |
| `IN_VERIFICATION` | "En verificación" |
| `PAID` | "Pagado · Listo para retirar" |
| `EXPIRED` | "Expirado" |

Después del escaneo, el pedido pasa al historial.

**Políticas**

- Un pedido pagado no se cancela ni se reembolsa.
- Ante pérdida o retiro tardío: sin reembolso, el local no se hace responsable y los puntos se conservan.
- Un pedido pagado con un producto que se agotó después **se honra**: se resuelve en el mostrador; el sistema no gestiona sustituciones.

### 8.8 Puntos

- **Acumulación**: `pointsPerDollar` (100) por cada dólar pagado, como en Steam. Con 100 puntos por dólar, puntos = centavos pagados.
- **Base del cálculo**: lo que se paga en dólares en el checkout **después de los cupones**. La parte cubierta por un cupón no puntúa.
- **Fórmula**: `points = Math.floor(totalCents * pointsPerDollar / 100)`, con **redondeo hacia abajo**.
- Se acreditan **en el momento en que el cajero aprueba el pago**.
- **No vencen nunca.**
- **Sin** rangos de fidelidad y **sin** ajustes manuales por parte del administrador.
- **Saldo**: `User.pointsBalance`, siempre actualizado en la misma transacción que crea el `PointsMovement`. El historial de movimientos es la tabla `PointsMovement`.

### 8.9 Recompensas y cupones

**Recompensas** (las crea y edita el **administrador**):

- **Descuento porcentual**: X % (1 a 100) sobre **un producto a elección** del cliente. Es global: sirve para cualquier producto.
- **Producto gratis**: un producto específico (por ejemplo, "Latte gratis").
- Cada recompensa tiene un **costo en puntos**. No hay equivalencia punto-dinero.
- El administrador puede **desactivar** una recompensa: deja de poder canjearse, pero los cupones ya canjeados siguen válidos hasta su vencimiento.

**Canje** (`POST /api/rewards/:id/redeem`)

- Requisitos: recompensa activa y saldo suficiente.
- En una transacción:
  1. Descuenta los puntos con una actualización condicional `pointsBalance >= costPoints`. Si no alcanza, responde 409 `INSUFFICIENT_POINTS`.
  2. Crea un `PointsMovement REDEEM` (negativo).
  3. Crea el `Coupon` copiando título, tipo, porcentaje, producto y costo de la recompensa.
- `expiresAt` es el **último instante del mes actual en Caracas** (`endOf('month')` en Luxon), guardado en UTC.
- **El canje es definitivo** y no se puede deshacer.
- **Aviso antes de confirmar**: la web muestra la fecha de vencimiento y los días que quedan. Si quedan **menos de 5 días**, el aviso es más fuerte (color de advertencia y texto destacado). No se bloquea el canje.

**Estados del cupón**

| Estado | Cuándo |
|---|---|
| `AVAILABLE` | Recién canjeado |
| `RESERVED` | Aplicado a una línea de un checkout no pagado |
| `USED` | El pedido pasó a `PAID` |
| `EXPIRED` | Llegó su `expiresAt` sin usarse |

Reglas de transición:

- Si el checkout expira o se cancela, o se quita la línea, el cupón vuelve a `AVAILABLE`. Si para entonces ya pasó su `expiresAt`, pasa a `EXPIRED`.
- **Un cupón en `RESERVED` sigue siendo válido aunque pase fin de mes**, si era válido cuando se aplicó. La tarea de vencimiento **solo** vence cupones en `AVAILABLE`.
- **El cupón no se devuelve una vez pagado el pedido**, aunque el pedido nunca se retire.

**Aplicación** (flujo invertido: primero el producto, después el cupón)

- En la pantalla de un producto, el cliente ve los **cupones aplicables** (`GET /api/products/:id/coupons`). Son los suyos en `AVAILABLE`, no vencidos, que cumplan una de estas condiciones:
  - Descuento porcentual, que aplica a cualquier producto.
  - Producto gratis cuyo `productId` coincide con este producto.
- El cliente toca "Agregar con cupón" sobre uno de ellos. Se crea **una línea separada con cantidad 1** y ese cupón.
  - Ejemplo: dos lattes, uno con 50 % y otro sin cupón, son dos líneas con precio distinto.
- **Un cupón por línea.** Para descontar varios productos hay que aplicar varios cupones, uno a uno.
- **Descuento por línea**:
  - Porcentual: `Math.round(unitPriceCents * percent / 100)`.
  - Producto gratis: `unitPriceCents`.
  - `lineTotalCents = unitPriceCents - discountCents`, nunca menor que 0.
- **Cupón de producto gratis cuyo producto se dio de baja**: queda **no utilizable** hasta su vencimiento. Se ve en "Mis cupones" como "No disponible".

**Pantallas de puntos del cliente**

- **Saldo**.
- **Historial de movimientos**: fecha, tipo y puntos (+ o -).
- **Catálogo de recompensas activas** con su costo y botón "Canjear", deshabilitado si no alcanza el saldo.
- **Mis cupones**, en tres pestañas (disponibles, usados y vencidos) con su fecha de vencimiento. Los reservados aparecen en "disponibles" con la etiqueta "En tu checkout".

### 8.10 Reportes

**Administrador** (`GET /api/admin/reports`)

- **Períodos**: hoy, esta semana, este mes y rango de fechas personalizado (todo en Caracas).
- **Una venta** es un pedido con `paidAt` dentro del período, en estado `PAID`, `IN_QUEUE` o `DELIVERED`. Se usan los montos **congelados** del pedido y sus líneas.
- **Contenido**:
  1. **Ventas del período** en $ y en Bs: total, número de pedidos y **desglose por producto y por categoría** (unidades e importe).
  2. **Productos más vendidos** (top 10 por unidades).
  3. **Demanda por hora** (0 a 23) y **por día de la semana** (lunes a domingo): número de pedidos según `paidAt` en Caracas.
- Para agrupar por zona horaria, usa `$queryRaw` con `("paidAt" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Caracas'` o el equivalente correcto según el tipo de columna. Verifica el resultado con datos conocidos.
- **Solo en pantalla**: no se exporta. Para las gráficas, usa los *charts* de shadcn (Recharts).
- **Excluidos**: reportes de tiempos, de puntos y cupones, y de checkouts expirados.

**Gerente** (`GET /api/manager/sales-today`)

- **Resumen de ventas del día**, solo lectura: total en $ y Bs, número de pedidos y unidades por producto.

### 8.11 Parámetros del sistema

Todos están en `Settings` y los edita **el administrador** desde la pantalla de configuración. Cada uno se valida con zod (enteros positivos y rangos razonables).

| Parámetro | Valor por defecto |
|---|---|
| Puntos por dólar | 100 |
| Plazo de expiración del checkout (horas) | 24 |
| Tope de pedidos pagados sin retirar | 10 |
| Rechazos antes del bloqueo | 3 |
| Duración del bloqueo (minutos) | 15 |
| Envíos de referencia por minuto | 5 |
| Cantidad máxima por producto en un checkout | 10 |

También se editan ahí:

- **Datos de cobro**: tipo y número de documento, banco (lista fija) y teléfono.
- **Horario**: días abiertos, hora de apertura y hora de cierre.

Los cambios aplican desde ese momento. No se recalculan pedidos existentes.

---

## 9. API (prefijo `/api`)

Todas las rutas, salvo las marcadas como públicas, requieren `Authorization: Bearer`. Los cuerpos y los parámetros se validan con zod.

**Middlewares**

- `requireAuth`: valida la sesión.
- `requireCustomer`: la cuenta no tiene permisos.
- `requirePerm('cashier' | 'barista' | 'manager' | 'admin')`. El permiso `manager` se cumple con `canManager || isAdmin`.
- Para la cola del barista en solo lectura: `requireAnyPerm('barista', 'manager', 'admin')`.

### 9.1 Públicas

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | `{ ok: true }` sin tocar la base de datos. Lo usa el *health check* de Render |
| GET | `/health/db` | Ejecuta `SELECT 1` y devuelve `{ ok: true }`. Lo usa UptimeRobot, y así mantiene activos el servidor y el proyecto de Supabase |
| POST | `/auth/register` | `{ name, email, password }`. Crea la cuenta (8.1) |
| GET | `/menu` | Productos activos ordenados (8.3) con precio en $ y Bs, `isAvailable`, tasa y fecha, y `store: { isOpen, openDays, openTime, closeTime }` |
| GET | `/banks` | Lista fija de bancos |

### 9.2 Sesión

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/me` | Perfil, permisos, `isStaff` y saldo de puntos |

### 9.3 Cliente (`requireCustomer`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/products/:id` | Detalle del producto |
| GET | `/products/:id/coupons` | Cupones aplicables a ese producto |
| GET | `/checkouts` | Checkouts `CREATED` e `IN_VERIFICATION`, más los `EXPIRED` de las últimas 24 h. Para cada uno: líneas con precios vigentes (o congelados en verificación), totales, `expiresAt`, `blockedUntil`, último motivo de rechazo y `isOpen` |
| POST | `/checkout/items` | `{ productId, quantity, couponId? }`. Agrega al checkout abierto (8.5) |
| PATCH | `/checkout/items/:itemId` | `{ quantity }` |
| DELETE | `/checkout/items/:itemId` | Quita la línea |
| POST | `/checkouts/:id/cancel` | Cancela el checkout |
| POST | `/checkouts/:id/prepare-payment` | Validaciones y datos de pago (8.6, paso 1) |
| POST | `/checkouts/:id/payment` | `{ reference, bankCode }` (8.6, paso 3) |
| POST | `/checkouts/:id/confirm-free` | Solo si el total es $0 |
| GET | `/orders/inventory` | Pedidos `PAID` con `qrToken`, `pickupCode`, líneas y totales congelados |
| GET | `/orders/history?cursor=` | Pedidos `IN_QUEUE` y `DELIVERED` |
| GET | `/points` | Saldo y movimientos (paginado) |
| GET | `/rewards` | Recompensas activas |
| POST | `/rewards/:id/redeem` | Canje (8.9) |
| GET | `/coupons?status=available\|used\|expired` | Cupones del cliente |

### 9.4 Cajero (`requirePerm('cashier')`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/cashier/verification-queue` | Envíos `PENDING` con datos completos |
| POST | `/cashier/submissions/:id/approve` | Aprueba el pago |
| POST | `/cashier/submissions/:id/reject` | `{ reason, note? }` |
| POST | `/cashier/scan` | `{ code }`. Devuelve `{ pickupCode, customerName, items }` |

### 9.5 Barista

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/barista/queue` | barista, gerente o administrador | Pedidos `IN_QUEUE` |
| POST | `/barista/orders/:id/deliver` | barista | Elimina el pedido de la cola |

### 9.6 Gerente (`requirePerm('manager')`, que incluye al administrador)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/manager/products` | Todos los productos, incluidos los dados de baja (marcados) |
| POST | `/manager/products` | Crear (sin imagen) |
| PATCH | `/manager/products/:id` | Editar nombre, descripción, precio y categoría |
| POST | `/manager/products/:id/image` | `multipart` con el campo `image` |
| DELETE | `/manager/products/:id/image` | Quitar la imagen |
| PATCH | `/manager/products/:id/availability` | `{ isAvailable }` |
| GET | `/manager/sales-today` | Resumen del día |
| GET | `/manager/delivered-today` | Pedidos `DELIVERED` hoy |
| POST | `/manager/orders/:id/restore` | Restaurar a la cola |

### 9.7 Administrador (`requirePerm('admin')`)

| Método | Ruta | Descripción |
|---|---|---|
| PATCH | `/admin/products/:id/active` | `{ isActive }`. Baja o reactivación |
| GET / POST / PATCH | `/admin/rewards`, `/admin/rewards/:id` | Crear, editar y activar o desactivar recompensas. No se borran |
| GET / PATCH | `/admin/settings` | Parámetros, datos de cobro y horario |
| GET | `/admin/users?email=` | Buscar una cuenta por correo (coincidencia exacta, sin distinguir mayúsculas) |
| PATCH | `/admin/users/:id/permissions` | `{ canCashier, canBarista, canManager }`. No se permite tocar `isAdmin` |
| GET | `/admin/reports?period=today\|week\|month\|custom&from=&to=` | Reportes (8.10) |

---

## 10. Página web

### 10.1 Principios

- **Diseñada desde el teléfono** para todos los usuarios: cliente, cajero, barista, gerente y administrador.
  - Debe verse aceptable en computador. No tiene que ser 100 % *responsive*: un contenedor centrado de ancho máximo (~480 px para cliente y cajero, más ancho para reportes) es suficiente.
- **Navegadores soportados**: Chrome en Android, Safari en iPhone (versiones recientes) y Chrome en computador.
- **Interfaz solo en español.**
- Estados de **carga**, **vacío** y **error** en todas las listas. Los errores de la API se muestran con un toast usando su `message`.
- Botones grandes y tocables (mínimo 44 px de alto). Las acciones irreversibles piden confirmación.

### 10.2 Enrutado según la cuenta

- Sin sesión: `/login` y `/registro`.
- Al iniciar sesión, se llama a `GET /me`:
  - Si es **cliente**, va a `/menu`.
  - Si es **cuenta de trabajo**, va a `/trabajo`, que muestra solo las secciones de sus permisos.
- Un cliente no puede entrar a rutas de trabajo ni al revés. La web redirige, y el servidor igual lo impide.

### 10.3 Pantallas del cliente

Layout con barra inferior con cinco secciones: **Menú · Checkout · Pedidos · Puntos · Cuenta**.

| Ruta | Contenido |
|---|---|
| `/menu` | Secciones Café, Bebidas y Postres. Tarjetas con imagen, nombre, $ y Bs, y etiqueta "Agotado". Aviso de local cerrado. Tasa BCV discreta al pie |
| `/producto/:id` | Detalle, selector de cantidad, "Agregar al checkout" y la lista de **cupones aplicables** con "Agregar con cupón" |
| `/checkout` | Tarjeta por cada checkout: estado, líneas (con cupón indicado), quitar o cambiar cantidad, total en $ y Bs, tiempo restante antes de expirar, motivo del último rechazo, bloqueo y botones "Pagar" y "Cancelar checkout" |
| `/pagar/:id` | Pestaña de pago (8.6): datos, COPIAR TODO, aviso de no reembolso y formulario de referencia con PEGAR |
| `/pedidos` | Inventario: pedidos pagados listos para retirar |
| `/pedidos/:id` | QR grande, código corto, ítems y total. Al detectar que fue escaneado, muestra "Pedido enviado a barra" y redirige al historial |
| `/historial` | Pedidos anteriores |
| `/puntos` | Saldo e historial de movimientos |
| `/recompensas` | Catálogo con costo y canje con aviso de vencimiento |
| `/cupones` | Mis cupones en pestañas |
| `/cuenta` | Nombre, correo (solo lectura) y "Cerrar sesión" |

### 10.4 Pantallas de trabajo (`/trabajo`)

Inicio con accesos según los permisos, más "Cerrar sesión".

| Ruta | Permiso | Contenido |
|---|---|---|
| `/trabajo/verificacion` | cajero | Cola de verificación con botones "Aprobar" y "Rechazar" (diálogo con motivo y nota) |
| `/trabajo/escanear` | cajero | Cámara, campo de código manual y aviso del último pedido enviado a barra |
| `/trabajo/barra` | barista, gerente, administrador | Cola de preparación. El botón "Entregado" solo aparece con permiso de barista |
| `/trabajo/catalogo` | gerente | Lista de productos, crear, editar, imagen y agotado. Con administrador también baja y reactivación |
| `/trabajo/ventas-hoy` | gerente | Resumen del día |
| `/trabajo/restaurar` | gerente | Pedidos entregados hoy con botón "Restaurar" |
| `/trabajo/recompensas` | administrador | Gestión de recompensas |
| `/trabajo/permisos` | administrador | Buscar por correo y activar o desactivar permisos |
| `/trabajo/configuracion` | administrador | Parámetros, datos de cobro y horario |
| `/trabajo/reportes` | administrador | Selector de período y reportes con gráficas |

### 10.5 Datos y refresco

| Uso | Intervalo |
|---|---|
| Colas de verificación y de barra | 5 s |
| Checkout, inventario y detalle del pedido | 10 s |
| Menú | 60 s |

- Todo con TanStack Query y `refetchInterval`. Los intervalos se pausan con la pestaña oculta (comportamiento por defecto).
- Tras cada acción, se invalidan las consultas afectadas.
- `lib/api.ts`: un `fetch` que añade el token de la sesión de Supabase, convierte las respuestas de error en `ApiError(code, message)` y, ante un 401, cierra la sesión y lleva a `/login`.

### 10.6 Identidad visual

**Dirección**: **minimalista, de cafetería clásica**. Tonos café y verde oscuro sobre un fondo crema, mucho espacio en blanco y una tipografía con serifa para los títulos. Debe sentirse sobrio y cálido: una carta de cafetería bien impresa, no una app llamativa.

**Reglas generales**

- Una sola columna en el teléfono, con márgenes laterales de 16 px y separación generosa entre bloques (24 px entre secciones).
- **Bordes finos en lugar de sombras.** Las tarjetas llevan un borde de 1 px y, como mucho, una sombra mínima.
- **Prohibido**: degradados, efectos de vidrio, colores neón, fondos con textura o fotos de fondo, emojis como iconos, animaciones llamativas.
- **Radio de esquinas**: 10 px en tarjetas, botones y campos; píldora (`9999px`) en etiquetas de estado.
- **Iconos**: `lucide-react` (incluido con shadcn), trazo 1,5 y tamaño 20 px. Siempre acompañados de texto en la navegación.
- **Movimiento**: transiciones de 150 ms solo en color, opacidad y foco. Desactivadas con `prefers-reduced-motion`.
- **Solo modo claro.** No se implementa modo oscuro: no añadas la clase `dark` ni sus variables.

#### Paleta

Todos los colores se definen **una sola vez** como variables de tema de shadcn en `web/src/index.css`. Ningún componente usa colores sueltos (`#…` o clases como `bg-green-900`): todo sale de estas variables.

| Token (shadcn) | Uso | Color |
|---|---|---|
| `--background` | Fondo de la página (crema) | `#F7F3EC` |
| `--foreground` | Texto principal (café espresso) | `#2B1E16` |
| `--card` / `--popover` | Tarjetas, diálogos, menús | `#FFFDF9` |
| `--card-foreground` / `--popover-foreground` | Texto sobre tarjetas | `#2B1E16` |
| `--primary` | Botones principales, elemento activo de la navegación, enlaces (verde oscuro) | `#1F3D2B` |
| `--primary-foreground` | Texto sobre el verde | `#FFFDF9` |
| `--secondary` | Botones secundarios, chips (café claro) | `#EFE4D6` |
| `--secondary-foreground` | Texto sobre el café claro | `#3B2A1F` |
| `--muted` | Fondos discretos (filas alternas, campos deshabilitados) | `#EFE8DD` |
| `--muted-foreground` | Texto secundario (descripciones, tasa BCV, horas) | `#6B5A4C` |
| `--accent` | Fondo al pasar el dedo o el ratón | `#E9DFD0` |
| `--accent-foreground` | Texto sobre el acento | `#2B1E16` |
| `--destructive` | Errores, rechazar, cancelar | `#9B2C2C` |
| `--border` / `--input` | Bordes de tarjetas y campos | `#E4DACB` |
| `--ring` | Anillo de foco (2 px) | `#2F6B45` |
| `--radius` | Radio base | `0.625rem` |

Colores adicionales, también como variables (`--caramel`, `--success`, `--warning`), registrados en el `@theme` de Tailwind para poder usarlos como clases:

| Variable | Uso | Color |
|---|---|---|
| `--caramel` | Detalles de marca: precio en dólares, separadores, ilustraciones | `#8B5A3C` |
| `--success` | Estado «Pagado», confirmaciones | `#2F6B45` |
| `--warning` | «En verificación», aviso de cupón por vencer, bloqueo temporal | `#8A5A12` |

**Contraste mínimo AA**: 4,5:1 para texto normal y 3:1 para texto grande y bordes de controles. Si al ajustar un color se rompe el contraste, se corrige el color, no la regla. Comprueba el contraste de cada pareja texto/fondo al definir el tema y anótalo en `PROGRESO.md`.

#### Tipografía

- **Títulos** (nombre del local, títulos de página y de sección, nombre del producto en su detalle): **Lora**, con serifa clásica, pesos 500 y 600.
- **Interfaz y texto** (todo lo demás, incluidos botones, formularios y tablas): **Inter**, pesos 400, 500 y 600.
- Las fuentes se instalan **con el proyecto** mediante `@fontsource/lora` y `@fontsource-variable/inter`, sin cargarlas de servicios externos.
- **Números**: siempre con `font-variant-numeric: tabular-nums` (montos, horas, puntos, códigos), para que las cifras se alineen.
- Tamaños base en el teléfono: texto 16 px, secundario 14 px, título de página 24 px (Lora), título de sección 18 px (Lora), precio 16 px semibold.

#### Componentes clave

- **Barra inferior del cliente**: fondo `--card`, borde superior `--border`, cinco elementos con icono y texto. El activo va en `--primary` y los demás en `--muted-foreground`.
- **Encabezado**: nombre del local en Lora, a la izquierda, sobre el fondo crema y sin barra de color. El nombre sale de una constante `APP_NAME` en `web/src/config.ts`, con el valor provisional `"Cafetería"`. No inventes logotipos.
- **Tarjeta de producto**: imagen arriba (proporción 4:3, esquinas redondeadas), nombre en Inter semibold, descripción breve en `--muted-foreground` (máximo dos líneas). Debajo, el precio en dólares en `--caramel` semibold y el monto en Bs en `--muted-foreground`, más pequeño.
  - **Agotado**: imagen con opacidad reducida, etiqueta «Agotado» en `--secondary` y botón deshabilitado.
- **Botones**: principal en `--primary` sólido; secundario en `--secondary`; destructivo en `--destructive`. Alto mínimo 44 px. Un solo botón principal por pantalla.
- **Etiquetas de estado** (píldoras con texto, nunca solo color):

  | Estado | Fondo y texto |
  |---|---|
  | Creado | `--secondary` / `--secondary-foreground` |
  | En verificación | `--warning` al 12 % / `--warning` |
  | Pagado · Listo para retirar | `--success` al 12 % / `--success` |
  | Expirado | `--muted` / `--muted-foreground` |
  | Rechazado (motivo) | `--destructive` al 10 % / `--destructive` |

- **QR**: **siempre negro sobre blanco puro** (`#000` sobre `#FFF`), con margen blanco alrededor y dentro de una tarjeta blanca. No se tiñe con la paleta: los escáneres necesitan el máximo contraste. Al mostrarlo, se sugiere subir el brillo de la pantalla con un texto breve.
- **Código corto** (`K7F2M9`): Inter semibold de 28 px en la pantalla del cliente y de 20 px en las colas, con espaciado entre letras amplio y cifras tabulares.
- **Colas del cajero y del barista**: más densas que las pantallas del cliente, pero con la misma paleta. Tarjetas con el código corto destacado arriba, nombre del cliente y hora a la derecha, e ítems en lista. El botón de acción («Aprobar», «Entregado») ocupa todo el ancho.
- **Aviso de pago** («Un pedido pagado no se cancela ni se reembolsa») en un recuadro con fondo `--warning` al 10 % y texto `--warning`.
- **Toasts** (`sonner`): fondo `--card`, borde `--border`; icono en `--success` o `--destructive` según el caso.
- **Gráficas de reportes**: verde `--primary` como serie principal, `--caramel` como segunda y tonos de `--muted-foreground` para el resto. Sin colores fuera de la paleta.

#### Imágenes genéricas por categoría

Tres ilustraciones SVG originales (`categoria-cafe.svg`, `categoria-bebidas.svg` y `categoria-postres.svg`): una taza, un vaso y una porción de torta.

- Estilo de **dibujo de línea**, trazo uniforme en `--caramel`, sobre fondo `--secondary`.
- Proporción 4:3 y sin texto.
- Las tres con el mismo grosor de trazo y el mismo encuadre, para que se vean como una serie.

---

## 11. Tareas programadas (`api/src/jobs`)

| Tarea | Frecuencia | Qué hace |
|---|---|---|
| `fetchBcvRate` | Diaria a las 08:00 (`America/Caracas`) y al arrancar si corresponde | 8.4 |
| `expireCheckouts` | Cada 5 min | `CREATED` con `expiresAt < now`: pasan a `EXPIRED` y liberan cupones (8.5) |
| `expireCoupons` | Cada 5 min | `AVAILABLE` con `expiresAt < now`: pasan a `EXPIRED` |

- Cada tarea es idempotente y usa actualizaciones condicionales.
- Además de la tarea, la expiración se aplica también de forma perezosa en las lecturas del cliente.

---

## 12. Seguridad

- Toda la lógica y el acceso a datos pasan por Express.
  - La web **solo** usa Supabase para iniciar y cerrar sesión.
  - La clave privada de Supabase y las cadenas de conexión **nunca** llegan a la web.
- RLS activado en todas las tablas sin políticas (7.2).
- `helmet`, `cors` (solo `WEB_ORIGIN`) y `express.json({ limit: '100kb' })`.
- Validación zod en **todas** las entradas. Los IDs se validan como UUID.
- Las comprobaciones de pertenencia se hacen siempre en el servidor: un cliente solo ve y toca sus checkouts, pedidos y cupones.
- Sin datos sensibles en la URL.
- Los `console.error` de errores inesperados no imprimen tokens ni contraseñas.

---

## 13. Funciones puras y pruebas unitarias

En `api/src/domain/`, sin acceso a la base de datos y con pruebas Vitest:

- `money.ts`: `usdToBsCents`, `formatUsd`, `formatBs`, `percentDiscount`, `lineTotal`. La web usa sus propias copias de los formateadores en `web/src/lib/format.ts`, también con pruebas.
- `points.ts`: `pointsFor(totalCents, pointsPerDollar)`.
- `schedule.ts`: `isStoreOpen(now, settings)` y `nextOpening(now, settings)`.
- `coupons.ts`: `endOfMonthCaracas(now)`, `daysUntil(expiresAt, now)` e `isCouponApplicable(coupon, product)`.
- `codes.ts`: `generatePickupCode()` y validación del formato de la referencia.

Casos mínimos:

- `400 × 88623 → 354492`.
- `formatBs(354492) → "Bs 3.544,92"`.
- `formatUsd(125050) → "$1.250,50"`.
- 50 % de 375 → 188.
- `pointsFor(399, 100) → 399`.
- `pointsFor(399, 1) → 3`.
- Horario: domingo cerrado, sábado 19:59 abierto, sábado 20:00 cerrado.
- Fin de mes en Caracas expresado en UTC.

---

## 14. Fases de construcción

Cada fase indica su rama, sus pasos, sus PARADAS (⛔) y las pruebas de cierre.

- Al empezar cada fase: `git checkout main && git pull` y crear la rama indicada.
- Al terminar: la regla 5 de 0.1 y la PARADA de cierre (0.4).

> Hay **un solo proyecto de Supabase**, compartido por el desarrollo y por la versión desplegada. Los datos de prueba se quedan en él hasta la PARADA 10.F.

### Fase 0 — Verificación de requisitos (primera sesión)

1. Comprueba, sin pedir nada todavía:
   - `node -v` empieza por `v22`.
   - `npm -v` responde.
   - `git --version` responde.
   - `git config user.name` y `git config user.email` no están vacíos.
   - `git remote -v` muestra un `origin` en GitHub y `git ls-remote origin` funciona sin error.
   - La rama actual es `main`, `CLAUDE.md` tiene commit y `git status` está limpio.
2. Si todo está bien, dilo en una frase y pasa a la Fase 1.
3. **⛔ PARADA 0.A — Requisitos previos**: solo si falta algo. Incluye únicamente los pasos de 4.1 que correspondan a lo que falta.

### Fase 1 — Base del repositorio

Rama: `feat/fase-01-base`

1. Crea `PROGRESO.md` (0.5).
2. **`web/`**:
   - Vite + React + TS, Tailwind CSS, shadcn/ui (según su guía actual para Vite), React Router y TanStack Query.
   - Proxy de Vite en desarrollo: `/api` → `http://localhost:3000`.
   - Script `dev:https`: `vite --host` con `@vitejs/plugin-basic-ssl`, activado solo con ese script.
   - **Tema visual de 10.6**: variables de la paleta en `src/index.css`, fuentes Lora e Inter, `--radius` y la constante `APP_NAME`.
   - Una página de prueba que muestre el tema: encabezado con `APP_NAME`, un título en Lora, un texto en Inter, botones principal, secundario y destructivo, una tarjeta y las cinco etiquetas de estado.
3. **`api/`**:
   - Express 5 + TS, tsx, tsup, zod, helmet y cors.
   - `src/config/env.ts`: las variables `SEED_*` solo son obligatorias para el seed.
   - `GET /api/health` (sin base de datos) y `GET /api/health/db` (ejecuta `SELECT 1`).
4. **Archivos comunes**:
   - `.gitignore` (incluye `.env`, `node_modules` y `dist`).
   - `.node-version` con `22` en `api/` y en `web/`.
   - ESLint, Prettier, `tsconfig` estricto y los `.env.example` de ambos (sección 5).
5. **Scripts de comprobación**:
   - `npm run env:check` en `api/` y en `web/`: lista las variables que faltan o están vacías, **sin mostrar valores**.
   - `npm run supabase:check` en `api/`. Comprueba, con la clave privada:
     - Que la API de administrador de Auth responde.
     - Que el bucket `product-images` existe y es público.
     - Que el registro público está desactivado: intenta un `signUp` con la clave pública y un correo aleatorio. Debe fallar. Si funciona, borra ese usuario con la API de administrador y lo informa como error.
6. `npm install` en ambos. typecheck, lint y build deben pasar. Commit.
7. **⛔ PARADA 1.A — Supabase y archivos `.env`**: todos los pasos de 4.2.
8. Tras el «listo»:
   - `env:check` en ambos y `supabase:check`.
   - Inicializa Prisma (todavía sin modelos) y comprueba la conexión por `DATABASE_URL` y por `DIRECT_URL`.
   - Levanta el servidor y comprueba `/api/health/db`.
   - Si algo falla, reabre la 1.A solo con lo pendiente.
9. Escribe `README.md`: requisitos, instalación, variables, cómo correr ambos y cómo probar en el teléfono (resumen de 4.3).
10. **⛔ PARADA 1.Z — Cierre.** Pruebas para el usuario:
    - `http://localhost:5173` → se ve la página de prueba con fondo crema, títulos con serifa, botón principal verde oscuro, tarjeta con borde fino y las etiquetas de estado en sus colores.
    - `http://localhost:5173/api/health/db` → `{"ok":true}`. La petición pasa por el proxy y llega a la base de datos.

### Fase 2 — Esquema de datos

Rama: `feat/fase-02-esquema`

1. `schema.prisma` completo (7.1).
2. Migración inicial con `--create-only`. Añade el SQL de 7.2 y aplícala.
3. Seed básico e idempotente: `Settings`, bancos (8.6.1) y administrador.
4. Si `env:check` indica que faltan variables `SEED_*`: **⛔ PARADA 2.A — Variables del seed** (las filas `SEED_*` de la tabla de 4.2).
5. Ejecuta la migración y el seed. Después comprueba con SQL:
   - Todas las tablas de `public` tienen `rowsecurity = true`.
   - Un `UPDATE` sobre `VerificationLog` falla.
6. **⛔ PARADA 2.Z — Cierre.** Pruebas:
    - Supabase → Table Editor: aparecen las tablas del esquema y ninguna tiene aviso de RLS desactivado.
    - Supabase → Authentication → Users: aparece el correo de `SEED_ADMIN_EMAIL`.
    - `npm run db:studio` en `api/` → `Settings` tiene una fila y `Bank` tiene la lista de bancos.

### Fase 3 — Autenticación y permisos

Rama: `feat/fase-03-auth`

1. API: `POST /auth/register`, `requireAuth`, `GET /me`, `requireCustomer`, `requirePerm`, `requireAnyPerm` y el manejo central de errores (6.3).
2. Amplía el seed con las **cuentas de demostración** de la sección 15 (cliente, cajero, barista y gerente). Hacen falta para probar las fases siguientes.
3. Web:
   - `/login` y `/registro`, cierre de sesión y guardas de rutas.
   - Layout del cliente con barra inferior.
   - Layout de trabajo con inicio según permisos (secciones vacías por ahora).
4. Pruebas de integración: una cuenta de cliente recibe 403 en una ruta protegida por permiso.
5. **⛔ PARADA 3.Z — Cierre.** Pruebas:
    - Registra una cuenta nueva en `/registro` → entra a `/menu`.
    - Contraseña de menos de 8 caracteres o confirmación distinta → error en el formulario.
    - Cierra sesión y vuelve a entrar.
    - Entra con `SEED_ADMIN_EMAIL` → `/trabajo` muestra todas las secciones de administrador.
    - Entra con `cajero@demo.com` (contraseña `SEED_DEMO_PASSWORD`) → `/trabajo` solo muestra las secciones de cajero.
    - Con la cuenta de cliente, escribe `/trabajo` en la barra de direcciones → redirige a `/menu`.

### Fase 4 — Dominio, tasa BCV, catálogo y menú

Rama: `feat/fase-04-catalogo`

1. Funciones puras de la sección 13, con sus pruebas.
2. Servicio y tarea de la tasa BCV (8.4).
   - Antes de nada, comprueba con `curl` que `BCV_API_URL` responde.
   - Si no responde tras los reintentos: **parada no prevista** (0.3) para que el usuario revise el script en su otra cuenta de Render.
3. CRUD de productos (gerente y administrador), con imagen, agotado y baja. `GET /menu`.
4. Amplía el seed con el **catálogo** de la sección 15.
5. Web: menú, detalle de producto (sin cupones) y catálogo del gerente. Imágenes genéricas por categoría.
6. **⛔ PARADA 4.Z — Cierre.** Pruebas:
    - Como cliente: el menú muestra Café, Bebidas y Postres en orden alfabético, con $ y Bs en formato venezolano y la línea «Tasa BCV del …».
    - Como gerente: crea un producto, súbele una imagen, edita su precio y márcalo agotado.
    - Como cliente: ese producto aparece bloqueado con «Agotado».
    - Como administrador: dalo de baja → desaparece del menú del cliente.

### Fase 5 — Checkout

Rama: `feat/fase-05-checkout`

1. Endpoints de checkout de 9.3. Por ahora sin cupones: `couponId` se rechaza.
2. Reglas: horario, tope por producto, reinicio del plazo, expiración (tarea y perezosa) y expirados visibles 24 h.
3. Scripts de desarrollo en `api/`. Se niegan a correr si `NODE_ENV=production`:
   - `npm run dev:store-open`: abre el local todos los días de 00:00 a 23:59, para poder probar a cualquier hora.
   - `npm run dev:store-default`: restaura el horario de lunes a sábado de 8:00 a 20:00.
   - `npm run dev:expire-checkouts`: pone en el pasado el `expiresAt` de todos los checkouts `CREATED`.
4. Web: botones de agregar en el menú y en el producto, y la pantalla `/checkout`.
5. **⛔ PARADA 5.Z — Cierre.** Pruebas (si estás fuera del horario, ejecuta antes `npm run dev:store-open` en `api/`):
    - Agrega productos, cambia cantidades, quita una línea y cancela el checkout.
    - Intenta pasar de 10 unidades de un mismo producto → error.
    - Como gerente, cambia el precio de un producto que está en el checkout → al refrescarse, el checkout del cliente muestra el precio nuevo.
    - `npm run dev:expire-checkouts` → el checkout aparece como «Expirado».
    - `npm run dev:store-default`. Si es domingo o estás fuera de 8:00–20:00, comprueba que no se puede agregar.

### Fase 6 — Pago y verificación

Rama: `feat/fase-06-pago`

1. `prepare-payment`, `payment`, `confirm-free`, la cola del cajero y la aprobación y el rechazo, con todas las reglas de 8.6: unicidad, límite por minuto, bloqueo, congelación de precios, puntos y `VerificationLog`.
2. Generación de `pickupCode` y `qrToken`.
3. Web: pestaña de pago (COPIAR TODO, PEGAR y lista de bancos), estados del checkout y cola de verificación.
4. Prueba automatizada de concurrencia: dos aprobaciones simultáneas del mismo envío → solo una tiene efecto.
5. **⛔ PARADA 6.A — Preparar el teléfono**: pasos de 4.3. El agente deja corriendo `api` con `npm run dev` y `web` con `npm run dev:https`, y le da al usuario la URL **Network**.
6. **⛔ PARADA 6.Z — Cierre.** Pruebas. No hace falta pagar de verdad: sirve cualquier referencia de 6 a 22 dígitos.
    - En el teléfono, como cliente: arma un checkout → «Pagar» → «COPIAR TODO» y pégalo en una app de notas para ver el texto.
    - Copia unos dígitos y prueba «PEGAR» en el campo de la referencia.
    - Envía la referencia → el checkout pasa a «En verificación».
    - En el computador, como cajero: el pedido aparece en la cola con nombre, ítems, montos y referencia → «Aprobar».
    - En el teléfono: el pedido pasa a «Pagado» y el saldo de puntos aumenta.
    - Abre la cola de verificación en dos ventanas del computador con la cuenta de cajero (una normal y otra de incógnito). Aprueba el mismo pedido en ambas → la segunda muestra «Ya verificado por …».
    - Rechaza 3 veces seguidas el mismo checkout → el cliente ve el motivo y luego el bloqueo con la hora de desbloqueo.
    - Envía de nuevo el banco y la referencia de un pedido aprobado → error de referencia ya registrada.
    - Si no seguirás probando, cierra el puerto (paso 7 de 4.3).

### Fase 7 — Retiro y barra

Rama: `feat/fase-07-retiro`

1. Inventario, detalle con QR y código, escaneo (cámara y manual), cola del barista, «Entregado», restaurar e historial.
2. **⛔ PARADA 7.A — Teléfono como escáner**:
   - Si el puerto se cerró, repite los pasos 2 a 5 de 4.3.
   - En esta fase conviene el **cajero en el teléfono** (usa la cámara) y el **cliente en el computador** (muestra el QR en pantalla).
3. **⛔ PARADA 7.Z — Cierre.** Pruebas:
    - Cliente: «Pedidos» muestra el pedido pagado con su QR y su código.
    - Cajero (teléfono): escanea el QR de la pantalla del computador → aviso «Pedido … de … enviado a barra». El pedido desaparece del inventario del cliente y aparece en su historial.
    - Escanea otra vez el mismo QR → error.
    - Escribe a mano el código de otro pedido pagado → funciona igual.
    - Barista (ventana de incógnito): el pedido aparece con nombre, ítems, hora y código → «Entregado».
    - Gerente: «Restaurar pedidos» lo muestra → «Restaurar» → vuelve a la cola del barista.
    - Si no seguirás probando, cierra el puerto (paso 7 de 4.3).

### Fase 8 — Puntos y cupones

Rama: `feat/fase-08-puntos`

1. Recompensas del administrador.
2. Para el cliente: recompensas, canje, puntos y movimientos, y «Mis cupones».
3. Cupones aplicables en el producto, «Agregar con cupón», líneas separadas, liberación de cupones y tarea de vencimiento. Habilita `couponId`.
4. Amplía el seed con las **recompensas** de la sección 15.
5. Script `npm run dev:expire-coupons`: pone en el pasado el `expiresAt` de los cupones `AVAILABLE` del cliente de demostración. Se niega a correr en producción.
6. **⛔ PARADA 8.Z — Cierre.** Pruebas, como `cliente@demo.com` (1.500 puntos):
    - Canjea «50 % en un producto» → aparece el aviso con la fecha de vencimiento y los días restantes. El saldo baja 400.
    - Abre un producto → aparece el cupón → «Agregar con cupón» → el checkout tiene una línea aparte con el 50 % aplicado.
    - Paga y aprueba → los puntos ganados no incluyen la parte descontada.
    - Canjea «Latte gratis» y agrégalo solo en un checkout → el total es $0,00 y aparece «Confirmar pedido».
    - Agrega un cupón a un checkout y ejecuta `npm run dev:expire-checkouts` → el cupón vuelve a «disponibles».
    - Ejecuta `npm run dev:expire-coupons` → los cupones disponibles pasan a «vencidos».
    - El aviso fuerte de menos de 5 días solo se ve cerca de fin de mes. Está cubierto por pruebas unitarias.

### Fase 9 — Administración y reportes

Rama: `feat/fase-09-admin`

1. Configuración (parámetros, datos de cobro y horario), permisos por correo, reportes con gráficas y resumen del gerente.
2. Script `npm run db:seed:sales` (sección 15), para tener datos en los reportes.
3. **⛔ PARADA 9.Z — Cierre.** Pruebas:
    - Ejecuta `npm run db:seed:sales` en `api/`.
    - Configuración: cambia el tope por producto a 5 → como cliente no se pueden agregar más de 5. Vuelve a ponerlo en 10.
    - Configuración: cambia los datos de cobro → la pestaña de pago del cliente muestra los nuevos.
    - Permisos: busca el correo de la cuenta que registraste en la Fase 3 y dale permiso de cajero → tras recargar, esa cuenta ve el panel de trabajo.
    - Reportes: prueba hoy, semana, mes y un rango → aparecen las ventas, los más vendidos y la demanda por hora y por día.
    - Gerente → Ventas de hoy: cuadra con el reporte de «hoy».

### Fase 10 — Datos de demostración y despliegue

Rama: `feat/fase-10-despliegue`

1. Completa el seed (sección 15), repasa textos, estados vacíos y el aspecto en el teléfono, y termina el `README.md`.
2. Comprueba localmente el modo producción:
   - En `api/`: `npm run build` y `npm start` con `NODE_ENV=production`.
   - En `web/`: `npm run build` y `npm run preview`.
3. **⛔ PARADA 10.0 — Unir la rama antes de desplegar**. Render despliega desde `main`, así que esta rama debe estar unida primero. Usa el mismo formato que un cierre: pruebas locales, push y unión.
4. **⛔ PARADA 10.A — Servidor en Render**: pasos 1 a 7 de 4.4.
   - Tras el «listo» y la URL: comprueba con `curl` `<url>/api/health` y `<url>/api/health/db`.
   - Si el despliegue falló, pide al usuario que copie en el chat las últimas líneas del registro («Logs») de Render. Revísalas antes de pegarlas: no deben incluir secretos.
5. **⛔ PARADA 10.B — Página en Render**: pasos 8 a 13 de 4.4.
   - Tras el «listo» y la URL: comprueba con `curl` que la raíz y una ruta interna (`<url>/menu`) devuelven el HTML de la página. Esto confirma la regla de reescritura.
6. **⛔ PARADA 10.C — Cruzar las URLs**: pasos 14 a 16 de 4.4.
   - Tras el «listo»: haz una petición con la cabecera `Origin: <url del sitio>` y comprueba que la respuesta trae `Access-Control-Allow-Origin` con ese valor.
7. **⛔ PARADA 10.D — UptimeRobot**: pasos de 4.5.
8. **⛔ PARADA 10.E — Prueba final en dispositivos reales**: en Chrome de Android y en Safari de iPhone, con la URL publicada:
    - Registrar una cuenta, armar un checkout y pagar con una referencia de prueba.
    - Aprobar como cajero, escanear el QR con el teléfono y entregar como barista.
    - Canjear una recompensa y usar el cupón.
    - Revisar los reportes como administrador.
    - Revisar la lista de bancos y el script del BCV (pasos 2 y 3 de 4.6).
    - Si algo falla, corrígelo en una rama `fix/…`, con su propia PARADA de cierre.
9. **⛔ PARADA 10.F — Limpieza de datos (opcional y destructiva)**:
   - Pregunta si quiere dejar la base de datos solo con los datos de demostración.
   - Si dice que sí, explica que se borran **todos** los pedidos, cuentas (incluidas las de Supabase Auth), movimientos e imágenes creados en las pruebas, y pide que responda **«confirmo»**.
   - Con la confirmación, ejecuta `npm run db:reset-demo` y, si lo quiere, `npm run db:seed:sales`.
   - Si dice que no, no hagas nada.
10. **⛔ PARADA 10.Z — Cierre del proyecto**: resumen final con:
    - Las URLs.
    - Las cuentas de demostración (de dónde sale cada contraseña).
    - Cómo se redespliega (unión a `main`).
    - Qué hacer si el sitio tarda en cargar (el servidor gratuito despertando).

---

## 15. Datos de demostración (`api/prisma/seed.ts`)

El seed se construye por partes:

| Fase | Qué añade |
|---|---|
| 2 | Settings, bancos y administrador |
| 3 | Cuentas de demostración |
| 4 | Catálogo |
| 8 | Recompensas |
| 9 | Ventas históricas (script aparte) |
| 10 | Revisión final |

El seed es idempotente (`upsert`).

**`db:reset-demo`** (solo se usa en la PARADA 10.F, con confirmación del usuario):

1. Ejecuta `prisma migrate reset --force`.
2. Borra **todas** las cuentas de Supabase Auth con la API de administrador.
3. Vacía el bucket `product-images`.
4. Vuelve a correr el seed.

En conjunto, el seed crea:

- **Settings** con valores por defecto y datos de cobro de ejemplo (`J-12345678-9`, banco 0134, teléfono `04141234567`).
- **Bancos** de 8.6.1.
- **Cuentas**: todas con la contraseña `SEED_DEMO_PASSWORD`, salvo el administrador.
  - Administrador: `SEED_ADMIN_*`.
  - `cajero@demo.com` con permiso de cajero.
  - `barista@demo.com` con permiso de barista.
  - `gerente@demo.com` con permiso de gerente.
  - `cliente@demo.com` como cliente, con 1.500 puntos.
- **Catálogo** (sin imágenes; se usan las genéricas):

  | Categoría | Productos |
  |---|---|
  | Café | Espresso $2,00 · Americano $2,50 · Capuchino $3,50 · Latte $4,00 · Moca $4,50 · Macchiato $3,75 |
  | Bebidas | Chocolate caliente $3,50 · Té chai $3,25 · Frappé de vainilla $4,75 · Limonada $2,75 |
  | Postres | Brownie $3,00 · Cheesecake $4,25 · Croissant $2,50 · Galleta de avena $1,75 |

- **Recompensas**:
  - "Latte gratis": 800 puntos.
  - "Moca gratis": 900 puntos.
  - "Chocolate gratis": 700 puntos.
  - "50 % en un producto": 400 puntos.
- **Una tasa BCV inicial** de respaldo (Bs 886,23) **solo si no existe ninguna**.
- **Opcional, con el script aparte `db:seed:sales`**: pedidos históricos de las últimas semanas en estado `DELIVERED`, para que los reportes muestren datos. No lo incluyas en el seed principal.

---

## 16. Despliegue en Render

Los pasos manuales están en 4.4 y 4.5. Estos son los valores exactos de cada campo.

**Servidor** (*Web Service*)

| Campo | Valor |
|---|---|
| Name | `cafeteria-api` |
| Region | **Virginia (US East)**, la misma zona que Supabase |
| Branch | `main` |
| Root Directory | `api` |
| Runtime | Node (la versión sale de `api/.node-version`) |
| Build Command | `npm ci --include=dev && npx prisma generate && npm run build` |
| Start Command | `npx prisma migrate deploy && node dist/index.js` |
| Instance Type | Free |
| Health Check Path | `/api/health` |
| Variables | Las de `api/.env` salvo `SEED_*`, con `NODE_ENV=production` y `WEB_ORIGIN` = URL del sitio |

`--include=dev` es necesario porque, con `NODE_ENV=production`, `npm ci` omitiría las dependencias de desarrollo (TypeScript, tsup y el CLI de Prisma), y la compilación y las migraciones fallarían.

**Página** (*Static Site*)

| Campo | Valor |
|---|---|
| Name | `cafeteria-web` |
| Branch | `main` |
| Root Directory | `web` |
| Build Command | `npm ci --include=dev && npm run build` |
| Publish Directory | `dist` |
| Variables | `VITE_API_URL` = URL del servidor + `/api`; `VITE_SUPABASE_URL`; `VITE_SUPABASE_ANON_KEY` |
| Redirects/Rewrites | Source `/*` → Destination `/index.html`, Action **Rewrite** |

**UptimeRobot**: monitor HTTP(s) a `https://<servidor>.onrender.com/api/health/db` cada 5 minutos.

**Notas**

- El plan gratuito de Render suspende el servidor tras un rato sin tráfico. UptimeRobot lo evita. Si aun así se suspende, la primera visita tarda en responder.
- Las horas gratuitas de Render son por cuenta. Por eso la API del BCV vive en **otra cuenta**: no la incluyas en este repositorio.
- Las migraciones se aplican solas al arrancar (`prisma migrate deploy`) sobre el mismo proyecto de Supabase que se usa en desarrollo.
- El seed **no** se ejecuta en Render: ya se ejecutó desde el computador sobre esa misma base de datos.
- Cada unión a `main` redespliega ambos servicios.

---

## 17. FUERA DE ALCANCE (no construir)

- "Voy en camino" o cualquier aviso de llegada, ventana de 60 s o pedido invisible para baristas.
- WhatsApp en cualquier forma: enlaces `wa.me`, comprobantes o bot.
- Notificaciones push, por correo o por SMS.
- PWA, *service workers* o instalación como app. React Native o Expo.
- Varios establecimientos.
- Consumo en mesa o delivery.
- Pasarela de pago, métodos distintos de Pago Móvil o subida de capturas o comprobantes.
- Cancelación o reembolso de pedidos pagados o en verificación.
- Estados de preparación visibles para el cliente ("en proceso", "listo" o "entregado").
- Panel de cocina separado del de mostrador.
- Variantes, tamaños, extras o notas por ítem.
- Productos de temporada o por tiempo limitado, rotación de menú y sustituciones gestionadas por el sistema.
- Agotado por ingrediente.
- Rangos de fidelidad (bronce, plata u oro).
- Vencimiento de puntos.
- Ajustes manuales de puntos.
- Cupones aplicados a la orden completa.
- Recuperación de contraseña, verificación de correo o edición de perfil.
- Más de un administrador o asignar el permiso de administrador desde el panel.
- Corte de recepción antes del cierre, botón de pausa o alertas por tiempo de espera en colas.
- Reportes de tiempos, de puntos y cupones, o de checkouts expirados. Exportar reportes.
- Interfaz en otro idioma.

---

## 18. Decisiones tomadas por defecto (confirmar con el usuario si hay dudas)

Estas decisiones cubren casos que el planteamiento no definía. Impleméntalas así salvo que el usuario diga otra cosa.

1. **Un solo checkout abierto por cliente.** Un checkout rechazado que vuelve a "creado" no recibe ítems nuevos.
2. **Total de $0,00** (solo cupones de producto gratis): se confirma sin Pago Móvil y pasa directo a pagado, con 0 puntos.
3. Los precios y el monto en Bs se **congelan al enviar la referencia** y se **descongelan si el pago se rechaza**.
4. La unicidad banco + referencia **ignora los envíos rechazados**.
5. Tras el bloqueo por rechazos, el contador de rechazos **vuelve a cero**.
6. Los checkouts expirados se muestran como "Expirado" **durante 24 h** en el apartado de checkout.
7. Un pedido restaurado **vuelve a su posición original** en la cola (por hora de escaneo).
8. El administrador puede tener además permiso de cajero o de barista.
9. "Esta semana" va de lunes a domingo.
10. El tope de 10 unidades es **por producto** en un checkout, sumando líneas con y sin cupón.
11. Quitar la última línea de un checkout lo cancela.
12. La interfaz es **solo en modo claro**, sin modo oscuro.
13. El nombre del local es provisional (`APP_NAME = "Cafetería"`) y no hay logotipo: solo el nombre escrito en Lora.

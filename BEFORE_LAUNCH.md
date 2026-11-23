# Guía Pre-Lanzamiento (Before Launch) 🚀

Esta guía detalla los pasos exactos para conectar tu monorepositorio a GitHub, blindar el repositorio para que **nadie más que tú pueda modificar el código**, compilar las aplicaciones nativas (APKs) y desplegar el portal web.

Actualmente, el proyecto **no está conectado a GitHub** (es un proyecto puramente local en tu disco duro).

---

## 1. Conectar a GitHub

Abre tu terminal en la carpeta raíz del proyecto (`d:\APP_development\Apps_4all`) y ejecuta:

```bash
# 1. Inicializar Git
git init

# 2. Agregar todos los archivos
git add .

# 3. Crear el primer commit maestro
git commit -m "🚀 Master Release: 4All Ecosystem (15 Apps + Astro Portal)"

# 4. Establecer la rama principal como main
git branch -M main

# 5. Conectar con tu repositorio en GitHub (Crea primero el repo en https://github.com/new)
git remote add origin https://github.com/TU_USUARIO/Apps_4all.git

# 6. Subir todo el monorepositorio
git push -u origin main
```

---

## 2. Blindaje Total del Repositorio en GitHub (Cero Commits ni PRs de Terceros)

Para que tu repositorio sirva como un portafolio público o privado de alto nivel, pero asegurando que **nadie pueda enviar Pull Requests, hacer commits o alterar tu código**, aplica esta configuración en la web de GitHub:

### A. Restringir la Rama Principal (`main`)

1. Ve a tu repositorio en GitHub $\rightarrow$ haz clic en la pestaña **Settings**.
2. En el menú lateral izquierdo, haz clic en **Branches**.
3. Haz clic en el botón **Add branch protection rule** (o **Add rule**).
4. En **Branch name pattern**, escribe: `main`.
5. Activa:
   - ✅ **Require a pull request before merging:** (Obliga a que cualquier cambio requiera revisión).
   - ✅ **Restrict who can push to matching branches:** En el buscador que aparece abajo, escribe **tu propio nombre de usuario de GitHub** y selecciónalo.
   - ❌ Asegúrate de que las opciones **"Allow force pushes"** y **"Allow deletions"** queden **DESMARCADAS**.
6. Haz clic en **Create** (o **Save changes**).

> _Efecto:_ A partir de este momento, GitHub rechazará automáticamente cualquier intento de `git push` directo o indirecto que provenga de otra cuenta que no sea la tuya.

### B. Desactivar Issues y Foros

1. Ve a **Settings** $\rightarrow$ **General**.
2. Desplázate hasta la sección **Features**:
   - ❌ Desmarca **Issues** (evita reportes o spam de usuarios externos).
   - ❌ Desmarca **Discussions**.
3. En la sección **Pull Requests**:
   - Asegúrate de tener publicado el archivo `CONTRIBUTING.md` (ya creado en la raíz) donde se advierte que no se aceptan contribuciones de terceros.

### C. Bloquear Interacciones Externas (Opcional)

1. En **Settings** $\rightarrow$ Menú lateral **Moderation** (o **Interaction limits**).
2. Activa **Limit to existing collaborators** si deseas bloquear que cuentas nuevas o externas puedan comentar o interactuar.

---

## 3. Compilar las Aplicaciones (APKs de Android con Expo EAS)

Cada aplicación en `apps/` es un proyecto independiente de React Native Expo. Para compilar cualquiera de ellas (ejemplo: `zip-4all`):

```bash
cd apps/zip-4all

# 1. Iniciar sesión en tu cuenta gratuita de Expo (crear en expo.dev si no tienes)
eas login

# 2. Configurar la compilación en la nube de EAS
eas build:configure

# 3. Compilar el archivo APK instalable de Android
eas build -p android --profile preview
```

> **Diferencia entre perfiles de EAS:**
>
> - `--profile preview`: Genera un archivo `.apk` directo, ideal para probar en cualquier celular o subirlo como descarga directa en GitHub Releases.
> - `--profile production`: Genera un archivo `.aab` (Android App Bundle), que es el paquete exigido por la Google Play Store cuando decidas publicar oficialmente.

---

## 4. Alojar los APKs en GitHub Releases

Una vez que EAS termine la compilación y descargues el archivo `.apk`:

1. Entra a tu repositorio en GitHub.
2. En la columna derecha, haz clic en **Releases** $\rightarrow$ **Draft a new release**.
3. En **Choose a tag**, escribe la versión (ej. `v1.0.0`).
4. En **Release title**, escribe el nombre del lanzamiento (ej. `4All Ecosystem v1.0.0`).
5. **Arrastra y suelta el archivo .apk** en la caja de archivos adjuntos (_Attach binaries_).
6. Haz clic en **Publish release**.

---

## 5. Desplegar el Portal Web (`apps/web`) en Vercel o Cloudflare Pages

El portal web de 4All está desarrollado en **Astro**, generando HTML estático puro, ultra-rápido, responsivo y sin costos de servidor.

### Pasos en Vercel (Recomendado):

1. Entra a [Vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **Add New...** $\rightarrow$ **Project**.
3. Selecciona tu repositorio `Apps_4all`.
4. En la pantalla de configuración:
   - **Framework Preset:** Astro.
   - **Root Directory:** Haz clic en _Edit_ y selecciona `apps/web`.
   - **Build Command:** `pnpm turbo run build --filter apps-web`
   - **Output Directory:** `dist`
5. Haz clic en **Deploy**.

En menos de 2 minutos, tu sitio web multilingüe (con términos legales, licencias y catálogo de las 15 aplicaciones) estará activo en internet con certificado SSL gratuito.

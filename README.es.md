<p align="right">
  <a href="./README.md">🇬🇧 Read this README in English</a>
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/6da96cb3-3e3e-4e26-800f-146f67f174df" alt="NeuroLAN logo" width="220" />
</p>

# NeuroLAN

NeuroLAN es una aplicación de chat multiplataforma (Ionic + Angular) pensada para interactuar con modelos de lenguaje ejecutados localmente en LM Studio dentro de la red doméstica.
La aplicación permite conectarse al servidor de LM Studio en la LAN, seleccionar el modelo activo y mantener conversaciones con una IA privada sin depender de servicios en la nube.

En fases posteriores, NeuroLAN incorporará gestión de historiales de conversación, selección rápida de modelos y opciones básicas de configuración, manteniendo siempre un enfoque *local‑first* y orientado a la privacidad.

## Estructura del proyecto

```text
src/
 ├── app/
 │    ├── app.component.*
 │    ├── app.routes.ts
 │    ├── core/
 │    │    ├── models/
 │    │    │    ├── conversation.model.ts      # Interfaces para conversaciones (más adelante)
 │    │    │    ├── lmstudio.model.ts         # Interfaces para modelos y chat
 │    │    ├── services/
 │    │         ├── conversation.service.ts   # Servicio para manejar conversaciones (más adelante)
 │    │         ├── lm-studio.service.ts      # Conexión a LM Studio
 │    ├── pages/
 │         ├── conversations/
 │         │    ├── conversations.component.* # Lista de conversaciones
 │         ├── chat/
 │         │    ├── chat.component.*          # Vista principal de chat
 │         ├── settings/
 │              ├── settings.component.*      # Pantalla de configuración (más adelante)
 │              ├── settings.routes.ts        # Rutas de configuración (más adelante)
 ├── assets/
 ├── environments/
 ├── theme/
```

## Tecnologías

- **Ionic**: Framework multiplataforma para crear aplicaciones móviles y de escritorio con tecnologías web.
- **Angular**: Framework basado en componentes para construir aplicaciones web modernas.
- **TypeScript**: Superconjunto tipado de JavaScript que mejora la seguridad y mantenibilidad del código.

## Desarrollo y Compilación

### Desarrollo Web
Para ejecutar la aplicación localmente en el navegador:
```bash
npm install
npm start
```

### Desarrollo Android
Se utiliza Capacitor para portar la aplicación a Android. El soporte nativo ya ha sido inicializado en el directorio `android/`.

#### Requisitos
1. **Android Studio** instalado en tu sistema.
2. SDK de Android configurado.

#### Sincronización de Cambios
Cada vez que realices cambios en el código de Angular, necesitas reconstruir la aplicación web y sincronizarla con Capacitor:
```bash
# 1. Compilar el proyecto Angular (genera la carpeta www/)
npm run build

# 2. Sincronizar los archivos compilados y plugins con el proyecto nativo de Android
npx cap sync
```

#### Compilación y Ejecución en Android
Para abrir el proyecto nativo en Android Studio, desde donde podrás ejecutarlo en un emulador/dispositivo o compilar el APK:
```bash
npx cap open android
```
Dentro de Android Studio:
- Conecta un dispositivo Android físico o inicia un emulador y haz clic en el botón verde **Run** (Ejecutar).
- Para generar el archivo APK ejecutable: ve a **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**. El APK compilado se guardará en la ruta `android/app/build/outputs/apk/debug/app-debug.apk`.

## Releases

Este proyecto está configurado con un workflow de GitHub Actions para generar releases de forma automática.

### Cómo generar una release

**Opción 1: Usando Tags (Recomendado)**
1. Haz commit de tus cambios y actualiza la versión en el `package.json` si es necesario.
2. Crea un tag en git que empiece por `v` (ej. `v1.0.0`):
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. El workflow de GitHub Actions se disparará automáticamente y creará la release.

**Opción 2: Activación Manual**
1. Ve a la pestaña **Actions** en tu repositorio de GitHub.
2. Selecciona el workflow **Generate Release** en la barra lateral izquierda.
3. Haz clic en el botón desplegable **Run workflow** a la derecha.
4. Introduce el nombre del tag (ej. `v1.0.0`) y haz clic en **Run workflow**.

### Contenido de la Release
Una vez que el workflow termine, la release incluirá:
- **Código Fuente** (`.zip` y `.tar.gz`).
- **Build Web** (`web-build.zip`): La aplicación Angular compilada y lista para su despliegue web.
- **APK de Android (Debug)** (`app-debug.apk`): Build de depuración sin firmar, ideal para pruebas fáciles en dispositivos Android.
- **APK de Android (Release)** (`app-release-unsigned.apk`): Build de producción sin firmar.

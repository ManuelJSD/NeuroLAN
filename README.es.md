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

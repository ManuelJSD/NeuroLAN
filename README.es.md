<p align="right">
  <a href="./README.md">🇬🇧 Read this README in English</a>
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/6da96cb3-3e3e-4e26-800f-146f67f174df" alt="NeuroLAN logo" width="200" />
</p>

# NeuroLAN

NeuroLAN es una aplicación de chat multiplataforma (Ionic + Angular) para conversar con modelos de IA locales a través de tu red doméstica. Se conecta a cualquier servidor con API compatible con OpenAI — incluyendo **LM Studio**, **Ollama** y similares — sin enviar ningún dato a la nube.

> Sin suscripciones. Sin nube. Tu hardware, tus modelos, tus datos.

## Capturas de pantalla

**Web**

<p align="center">
  <img src="docs/screenshots/web.png" alt="Captura web" width="700" />
</p>

**Móvil**

<p align="center">
  <img src="docs/screenshots/mobile-menu.png" alt="Móvil - menú lateral" width="250" />
  &nbsp;&nbsp;&nbsp;
  <img src="docs/screenshots/mobile-chat.png" alt="Móvil - vista de chat" width="250" />
</p>

## Características

- **Compatible con OpenAI**: funciona con LM Studio, Ollama y cualquier servidor que exponga `/v1/chat/completions`.
- **Selector de modelos**: elige el modelo cargado sin salir del chat.
- **Historial de conversaciones**: las conversaciones se guardan localmente y persisten entre sesiones.
- **Multiplataforma**: funciona en el navegador y como app Android mediante Capacitor.
- **Interfaz multiidioma**: inglés y español incluidos.
- **Tiempo de respuesta**: muestra cuánto tardó cada respuesta.
- **Privacidad primero**: sin telemetría, sin cuentas, sin peticiones externas.

## Estructura del proyecto

```text
src/
 ├── app/
 │    ├── app.component.*           # Componente raíz y menú lateral
 │    ├── app.routes.ts             # Rutas de la app
 │    ├── core/
 │    │    ├── models/
 │    │    │    ├── openai.model.ts        # Interfaces de la API de OpenAI
 │    │    │    └── conversation.model.ts  # Modelo de datos de conversación
 │    │    └── services/
 │    │         ├── openai.ts             # Cliente de la API compatible con OpenAI
 │    │         ├── conversation.ts       # Almacenamiento y gestión de conversaciones
 │    │         └── settings.ts          # Ajustes de la app (URL base, idioma, etc.)
 │    └── pages/
 │         ├── chat/                # Vista principal de chat
 │         ├── conversations/       # Lista de conversaciones (barra lateral)
 │         └── settings/            # Pantalla de ajustes
 ├── assets/
 │    └── i18n/                     # Ficheros de traducción (en.json, es.json)
 └── theme/
```

## Requisitos

- **Node.js** 18 o superior.
- Un servidor de inferencia local con API compatible con OpenAI:
  - [LM Studio](https://lmstudio.ai) (puerto por defecto: `1234`)
  - [Ollama](https://ollama.com) (puerto por defecto: `11434`)

## Primeros pasos

```bash
# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm start
```

Abre `http://localhost:8100` en el navegador. Antes de poder chatear, ve a **Ajustes** e introduce la URL de tu servidor de inferencia local (por ejemplo `http://192.168.1.10:1234` para LM Studio o `http://192.168.1.10:11434` para Ollama). Una vez guardada, el selector de modelos se cargará y podrás iniciar una conversación.

Consulta [docs/setup.es.md](docs/setup.es.md) para una guía detallada de configuración paso a paso.

## Tecnologías

- **[Ionic](https://ionicframework.com/)** — framework de UI multiplataforma.
- **[Angular](https://angular.dev/)** — framework web basado en componentes.
- **[TypeScript](https://www.typescriptlang.org/)** — JavaScript con tipado estático.
- **[Capacitor](https://capacitorjs.com/)** — puente nativo para Android/iOS.
- **[LocalForage](https://localforage.github.io/localForage/)** — almacenamiento offline.
- **[ngx-markdown](https://github.com/jfcere/ngx-markdown)** — renderizado de Markdown en el chat.

## Compilación para Android

```bash
# 1. Compilar la app Angular
npm run build

# 2. Sincronizar con Capacitor
npx cap sync

# 3. Abrir en Android Studio
npx cap open android
```

## Releases

Las releases se generan automáticamente mediante GitHub Actions al crear un tag:

```bash
git tag v1.1.0
git push origin v1.1.0
```

Cada release incluye el build web (`web-build.zip`), un APK de depuración y un APK de release sin firmar.

## Roadmap

Consulta [docs/TODO.md](docs/TODO.md) para ver el listado completo de funcionalidades planificadas.

## Notas de arquitectura

Consulta [docs/architecture.es.md](docs/architecture.es.md) para un resumen de las decisiones de diseño y la organización del código.

## Créditos

Desarrollado por **Manuel J. Sandalio**.  
Repositorio oficial: [GitHub - ManuelJSD/NeuroLAN](https://github.com/ManuelJSD/NeuroLAN)

## Licencia

[GPL-3.0](LICENSE)

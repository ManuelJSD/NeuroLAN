<p align="right">
  <a href="./README.es.md">🇪🇸 Leer este README en español</a>
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/6da96cb3-3e3e-4e26-800f-146f67f174df" alt="NeuroLAN logo" width="220" />
</p>

# NeuroLAN

NeuroLAN is a cross‑platform chat application (Ionic + Angular) designed to interact with language models running locally in LM Studio within a home network.
The app connects to the LM Studio server over LAN, lets you select the active model, and chat with a private AI without relying on any cloud services.

In future iterations, NeuroLAN will add conversation history management, quick model switching, and basic configuration options, while keeping a *local‑first* and privacy‑oriented approach.

## Project structure

```text
src/
 ├── app/
 │    ├── app.component.*
 │    ├── app.routes.ts
 │    ├── core/
 │    │    ├── models/
 │    │    │    ├── conversation.model.ts      # Interfaces for conversations (later)
 │    │    │    ├── lmstudio.model.ts         # Interfaces for models and chat
 │    │    ├── services/
 │    │         ├── conversation.service.ts   # Conversation management (later)
 │    │         ├── lm-studio.service.ts      # LM Studio connection
 │    ├── pages/
 │         ├── conversations/
 │         │    ├── conversations.component.* # Conversation list
 │         ├── chat/
 │         │    ├── chat.component.*          # Main chat view
 │         ├── settings/
 │              ├── settings.component.*      # Settings screen (later)
 │              ├── settings.routes.ts        # Settings routes (later)
 ├── assets/
 ├── environments/
 ├── theme/
```

## Technologies

- **Ionic**: Cross‑platform framework for building mobile and desktop apps with web technologies.
- **Angular**: Component‑based web framework for building modern applications.
- **TypeScript**: Typed superset of JavaScript that improves code safety and maintainability.

## Development and Builds

### Web Development
To run the application locally in the browser:
```bash
npm install
npm start
```

### Android Development
Capacitor is used to port the application to Android. The native platform has been initialized in the `android/` directory.

#### Requirements
1. **Android Studio** installed on your system.
2. Android SDK configured.

#### Syncing Changes
Every time you make changes to the Angular code, you need to rebuild the web app and sync it with Capacitor:
```bash
# 1. Compile the Angular project (outputs to www/)
npm run build

# 2. Sync compiled files and plugins with the native Android project
npx cap sync
```

#### Compiling and Running on Android
To open the native project in Android Studio to run it on an emulator/device or build the APK:
```bash
npx cap open android
```
Inside Android Studio:
- Select a virtual device (Emulator) or connect a physical Android device and click the **Run** button.
- To generate the APK: go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**. The built APK will be located at `android/app/build/outputs/apk/debug/app-debug.apk`.

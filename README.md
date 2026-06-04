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

- **Ionic**: Cross‑platform framework for building mobile and desktop apps with web technologies.[web:116][web:92]  
- **Angular**: Component‑based web framework for building modern applications.[web:24]  
- **TypeScript**: Typed superset of JavaScript that improves code safety and maintainability.[web:27]

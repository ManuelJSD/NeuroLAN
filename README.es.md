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

- **Ionic**: Framework multiplataforma para crear aplicaciones móviles y de escritorio con tecnologías web.[web:116][web:92]  
- **Angular**: Framework basado en componentes para construir aplicaciones web modernas.[web:24]  
- **TypeScript**: Superconjunto tipado de JavaScript que mejora la seguridad y mantenibilidad del código.[web:27]
Con esto tienes la parte de documentación bastante redonda. ¿Te apetece que el siguiente paso sea diseñar las interfaces de lmstudio.model.ts para empezar ya con la conexión a LM Studio?

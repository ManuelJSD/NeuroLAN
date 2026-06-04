# NeuroLAN

NeuroLan es una aplicación de chat multiplataforma (Ionic + Angular) pensada para interactuar con modelos de lenguaje ejecutados localmente en LM Studio dentro de la red doméstica. La aplicación permite conectarse al servidor de LM Studio en la LAN, seleccionar el modelo activo y mantener conversaciones con una IA privada sin depender de servicios en la nube.

En fases posteriores, NeuroLan incorporará gestión de historiales de conversación, selección rápida de modelos y opciones básicas de configuración, priorizando siempre un enfoque local‑first y orientado a la privacidad.

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
 │         │    ├── conversations.component.* # Componente principal (sin chat)
 │         ├── chat/
 │         │    ├── chat.component.*          # Componente principal con chat
 │         ├── settings/
 │              ├── settings.component.*      # Componente de configuración (más adelante)
 │              ├── settings.routes.ts        # Rutas de configuración (más adelante)
 ├── assets/
 ├── environments/
 ├── theme/
```

## Tecnologías

- **Ionic**: Framework multiplataforma para crear aplicaciones móviles y de escritorio.
- **Angular**: Framework para crear aplicaciones web.
- **TypeScript**: Lenguaje de programación TypeScript.

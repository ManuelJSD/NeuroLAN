# Guía de configuración

Esta guía explica cómo configurar NeuroLAN para conectarlo a un servidor de inferencia local.

## Backends soportados

NeuroLAN se comunica mediante la API REST compatible con OpenAI (`/v1/chat/completions`). Cualquier servidor que implemente esta especificación funcionará.

Las dos opciones más habituales son:

- **LM Studio** — con interfaz gráfica, fácil de usar en Windows, Mac y Linux.
- **Ollama** — por línea de comandos, ligero, ideal para ejecutarse en segundo plano o en un servidor.

---

## Opción A: LM Studio

1. Descarga e instala [LM Studio](https://lmstudio.ai).
2. Abre LM Studio y descarga un modelo desde la pestaña **Discover**.
3. Cambia a la pestaña **Developer** (el icono `</>` en la barra lateral izquierda).
4. Selecciona un modelo en el desplegable de la parte superior y espera a que termine de cargarse.
5. Comprueba que el servidor está activo — deberías ver un indicador verde y un mensaje como `Server running on port 1234`.
6. Abre NeuroLAN, ve a **Ajustes** y configura la URL del servidor:
   ```
   http://<ip-de-tu-máquina>:1234
   ```
   - Si ejecutas NeuroLAN en **la misma máquina**, puedes usar `http://localhost:1234`.
   - Si accedes desde **otro dispositivo de la misma red** (por ejemplo tu móvil), debes usar la IP local de la máquina en lugar de `localhost`.

---

## Opción B: Ollama

1. Descarga e instala [Ollama](https://ollama.com).
2. Descarga un modelo desde la terminal:
   ```bash
   ollama pull llama3
   ```
3. Ollama inicia su servidor de API automáticamente en el puerto `11434`. Puedes verificar que está activo abriendo `http://localhost:11434` en un navegador — deberías ver el mensaje `Ollama is running`.
4. Por defecto, Ollama solo escucha en `localhost`. Para acceder desde otro dispositivo de tu red, define la variable de entorno `OLLAMA_HOST` antes de iniciar el servidor:
   ```bash
   OLLAMA_HOST=0.0.0.0 ollama serve
   ```
5. Abre NeuroLAN, ve a **Ajustes** y configura la URL del servidor:
   ```
   http://<ip-de-tu-máquina>:11434
   ```

---

## Cómo encontrar la IP local de tu máquina

Si accedes al servidor desde otro dispositivo (por ejemplo usas NeuroLAN en el móvil para hablar con un modelo que corre en tu PC):

- **Windows**: abre el Símbolo del sistema y ejecuta `ipconfig`. Busca la `Dirección IPv4` bajo el adaptador de red activo.
- **macOS / Linux**: abre una terminal y ejecuta `ip addr` o `ifconfig`. Busca la dirección `inet` en la interfaz de red principal (normalmente `eth0` o `wlan0`).

La IP suele tener un formato similar a `192.168.1.x` o `10.0.0.x`.

---

## Configurar NeuroLAN

1. Abre la app y pulsa **Ajustes** en la barra lateral.
2. En el campo **URL del servidor**, introduce la dirección completa de tu servidor de inferencia, incluyendo el puerto (por ejemplo `http://192.168.1.10:1234`).
3. Guarda los ajustes. El selector de modelos en el chat cargará automáticamente los modelos disponibles en tu servidor.

Si no aparece ningún modelo, comprueba que:
- El servidor de inferencia está en marcha y hay un modelo cargado.
- La URL y el puerto son correctos.
- El firewall no está bloqueando las conexiones en ese puerto.

---

## Consejos

- En Android, usa siempre la IP local de la máquina servidora — `localhost` hace referencia al propio teléfono, no al PC.
- Si cambias el modelo cargado en LM Studio, pulsa el botón de recargar en el selector de modelos de NeuroLAN para actualizar la lista.
- Ollama puede tener varios modelos descargados. Usa `ollama list` en la terminal para ver cuáles tienes disponibles.

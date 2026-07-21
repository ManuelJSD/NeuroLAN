# Setup Guide

This guide explains how to configure NeuroLAN to connect to a local inference server.

## Supported backends

NeuroLAN communicates using the OpenAI-compatible REST API (`/v1/chat/completions`). Any server that implements this spec will work.

The two most common options are:

- **LM Studio** — GUI-based, easy to use on Windows/Mac/Linux.
- **Ollama** — CLI-based, lightweight, great for running in the background or on a server.

---

## Option A: LM Studio

1. Download and install [LM Studio](https://lmstudio.ai).
2. Open LM Studio and download a model from the **Discover** tab.
3. Switch to the **Developer** tab (the `</>` icon in the left sidebar).
4. Select a model from the dropdown at the top of the page and wait for it to load.
5. Make sure the server is running — you should see a green indicator and a message like `Server running on port 1234`.
6. Open NeuroLAN, go to **Settings**, and set the server URL to:
   ```
   http://<your-machine-ip>:1234
   ```
   - If you're running NeuroLAN on **the same machine**, use `http://localhost:1234`.
   - If you're accessing from **another device on the same network** (e.g. your phone), use the machine's local IP instead of `localhost`.

---

## Option B: Ollama

1. Download and install [Ollama](https://ollama.com).
2. Pull a model from the terminal:
   ```bash
   ollama pull llama3
   ```
3. Ollama starts its API server automatically on port `11434`. You can check it's running by opening `http://localhost:11434` in a browser — you should see `Ollama is running`.
4. By default, Ollama only listens on `localhost`. To access it from another device on your network, set the `OLLAMA_HOST` environment variable before starting it:
   ```bash
   OLLAMA_HOST=0.0.0.0 ollama serve
   ```
5. Open NeuroLAN, go to **Settings**, and set the server URL to:
   ```
   http://<your-machine-ip>:11434
   ```

---

## Finding your machine's local IP

If you're accessing the server from another device (e.g. using NeuroLAN on your phone to talk to a model running on your PC):

- **Windows**: open Command Prompt and run `ipconfig`. Look for the `IPv4 Address` under your active network adapter.
- **macOS / Linux**: open a terminal and run `ip addr` or `ifconfig`. Look for the `inet` address on your main network interface (usually `eth0` or `wlan0`).

The IP will typically look like `192.168.1.x` or `10.0.0.x`.

---

## Configuring NeuroLAN

1. Open the app and tap/click **Settings** in the sidebar.
2. In the **Server URL** field, enter the full address of your inference server, including the port (e.g. `http://192.168.1.10:1234`).
3. Save the settings. The model selector in the chat will load the available models from your server automatically.

If no models appear, double-check that:
- The inference server is running and a model is loaded.
- The URL and port are correct.
- Your firewall is not blocking the connection on that port.

---

## Tips

- On Android, always use the server's local IP address — `localhost` refers to the phone itself, not your PC.
- If you change the loaded model in LM Studio, click the refresh button in NeuroLAN's model selector to update the list.
- Ollama can run multiple models. Use `ollama list` to see what's available on your machine.

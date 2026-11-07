# juntosxsiempre — AI SMS Schedule Agent

Un agente de citas fotográficas por SMS y WhatsApp para el estudio mexicano **juntosxsiempre** (Roma Norte, CDMX), con paleta de color crema-rosa, animaciones parallax y diseñado con **100% prioridad móvil**. Desarrollado con Next.js (App Router) y enrutamiento inteligente multi-proveedor entre **Google Gemini** y **OpenRouter** vía `@llm-multi-provider/core`.

---

## Capacidades Principales

- **Coordinadora de Citas con IA ("Camila")**:
  - Responde dudas sobre paquetes fotográficos mexicanos (Sesión Juntos x Siempre de Parejas & Compromiso, Retrato Ejecutivo, Familia & Maternidad, Quinceañeras & Graduación, Campañas Comerciales), precios en MXN, anticipos y políticas de estudio.
  - Verifica disponibilidad en tiempo real en los horarios de Roma Norte (`Martes a Viernes 9:00 AM–6:00 PM`, `Sábados 10:00 AM–5:00 PM`) con buffers automáticos de `15 minutos` para ajuste de iluminación.
  - Genera cotizaciones detalladas con complementos: Maquillaje y Peinado Profesional (HMUA), Paquete de 5 Fotos Extra con Retoque Fino, Entrega Express 24h, Video Reel Vertical 4K para Instagram/TikTok y Asesoría de Vestuario.
  - Agenda citas emitiendo códigos de reservación únicos (`JXS-xxxx`).
  - Consulta, reprograma, actualiza fotógrafos/fondos y cancela reservaciones con reasignación automática a lista de espera.
- **Paleta de Color Crema-Rosa**:
  - Diseño editorial cálido inspirado en la atmósfera colonial y moderna de la Roma Norte: fondos marfil y crema cálido (`#FBF7F4`, `#FFFDFB`, `#FAF3EC`), acentos en rosa empolvado, blush y rosa magenta suave (`#FCE7EC`, `#E0446E`, `#C52752`), con tipografía legible en espresso ciruela (`#2D1822`).
- **Animaciones Parallax**:
  - Implementación con CSS Scroll-Driven Animations nativas (`view-timeline`) con capas estacionales a diferentes velocidades (fondo bokeh rosa, elementos ópticos Profoto 50mm, tarjeta de estudio en primer plano).
  - Fallback en JavaScript reactivo con `requestAnimationFrame` y listener de scroll para compatibilidad universal.
- **100% Prioridad Móvil**:
  - Experiencia móvil nativa con navegación táctil inferior (Dock de 4 vistas: Chat SMS con Camila, Agenda interactiva, Gestión de Citas, Catálogo de Estudio y Sets).
  - Diálogos estilo bottom-sheet con light-dismiss, drag handles, metas de toque de 48px y soporte para safe-area insets (`env(safe-area-inset-bottom)`).
- **Enrutamiento Multi-LLM con Failover Automático**:
  - `gemini-with-fallback`: **Google Gemini Primario ⇄ OpenRouter Failover Automático**
  - `openrouter-with-fallback`: **OpenRouter Primario ⇄ Google Gemini Failover Automático**
  - `gemini-only`: **Google Gemini Estricto**
  - `openrouter-only`: **OpenRouter Estricto**
  - Coordinador local determinístico inteligente integrado para funcionamiento interactivo de prueba sin necesidad de configurar API keys.
- **Endpoint Webhook para Twilio / SMS**:
  - `POST /api/webhook/sms` acepta `application/x-www-form-urlencoded` (`From`, `Body`) y devuelve XML TwiML o JSON.

---

## Inicio Rápido

### 1. Variables de Entorno (Opcional)

Crea un archivo `.env.local` en la raíz (o copia `.env.example`):

```env
GEMINI_API_KEY=tu_gemini_api_key
OPENROUTER_API_KEY=tu_openrouter_api_key
DEFAULT_LLM_PROVIDER=gemini
```

*(También puedes ingresar tus llaves en vivo durante una demo haciendo clic en el botón de proveedor de IA en la barra superior).*

### 2. Ejecutar Localmente

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador o emulador móvil.

### 3. Build de Producción

```bash
npm run build
```

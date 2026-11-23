# Futuras Aplicaciones - Ecosistema Para Todos (4All)

Este documento maestro recopila ideas conceptuales, análisis de viabilidad técnica, cumplimiento de licencias y estrategias de implementación para futuras expansiones del ecosistema **4All**. 

---

## 1. Ciclo 4All (Seguimiento Menstrual y Salud Femenina)
* **Categoría Sugerida:** 🛠️ Utilidades (Acento Turquesa).
* **El Problema:** Riesgo de venta de datos íntimos en apps gratuitas.
* **Solución y Arquitectura Técnica:** Calendario 100% offline. Implementación basada en `date-fns` para los cálculos predictivos. El almacenamiento del ciclo se realiza mediante `Zustand` con persistencia cifrada usando `expo-secure-store` para garantizar que ni siquiera un volcado del teléfono exponga los datos.
* **Licenciamiento:** Desarrollo 100% propio (JavaScript puro). Cumple perfectamente con PolyForm. Cero dependencias externas complejas.
* **Prompt para Icono (IA):** *"A minimalist, flat vector app icon on a pure dark background (#09090b). The central symbol should represent a subtle, abstract blooming flower inside a minimal calendar grid, drawn with clean lines using only Teal (#2DD4BF) and white. Corporate, modern mobile UI design, no text, no 3D effects, flat design."*

## 2. Hábitos 4All / Diario 4All (Rastreador y Diario)
* **Categoría Sugerida:** 💼 Productividad (Acento Azul).
* **Solución y Arquitectura Técnica:** Gestor visual (heatmap estilo GitHub) y diario íntimo. Uso de `expo-local-authentication` para proteger la entrada al diario (FaceID/Huella). La visualización se construye con `react-native-svg` (sin librerías de gráficos pesadas).
* **Licenciamiento:** Componentes de interfaz gráfica construidos sobre NativeWind. Libre de licencias virales.
* **Prompt para Icono (IA):** *"A minimalist, flat vector app icon on a pure dark background (#09090b). The central symbol should represent a checkmark transitioning into a continuous infinity loop, drawn with clean, thick lines using only Blue (#60A5FA) and white. Corporate, modern mobile UI design, no text, flat design."*

## 3. Archivos 4All (Limpiador de Medios)
* **Categoría Sugerida:** 🛠️ Utilidades (Acento Turquesa).
* **Solución y Arquitectura Técnica:** Limitado a limpieza de galería para evadir el "Scoped Storage" estricto de Android/iOS. Usa intensivamente la API nativa de `expo-media-library` para buscar archivos duplicados por hash o tamaño (videos pesados).
* **Licenciamiento:** Al depender puramente de las APIs nativas de Expo, no se requieren librerías de terceros (riesgo nulo de licencias incompatibles).
* **Prompt para Icono (IA):** *"A minimalist, flat vector app icon on a pure dark background (#09090b). The central symbol should represent a glowing data disk or folder being swept by a minimal broom, drawn with clean lines using only Teal (#2DD4BF) and white. Corporate, modern mobile UI design, no text, flat design."*

## 4. Intervalos 4All (Temporizador HIIT y Rutinas)
* **Categoría Sugerida:** ⏱️ Tiempo y Cálculo (Acento Ámbar).
* **Solución y Arquitectura Técnica:** Uso de `expo-keep-awake` (obligatorio) para que la pantalla no se bloquee. Manejo de audio en segundo plano mediante `expo-av` con la opción `playsInSilentModeIOS` activada para garantizar pitidos incluso si el teléfono está en silencio.
* **Licenciamiento:** Seguro. No requiere motores de audio complejos, solo reproducción de `.wav` o `.mp3` cortos locales.
* **Prompt para Icono (IA):** *"A minimalist, flat vector app icon on a pure dark background (#09090b). The central symbol should represent a stopwatch merged with a subtle flame or interval bars, drawn with clean lines using only Amber (#FBBF24) and white. Corporate, modern mobile UI design, no text, flat design."*

## 5. Finanzas 4All (Presupuesto + Conversor de Divisas)
* **Categoría Sugerida:** 💼 Productividad (Acento Azul).
* **Solución y Arquitectura Técnica:** Un gestor manual (sin API bancarias). El módulo de divisas requiere un único `fetch` a una API gratuita (ej. ExchangeRate-API) cuando hay internet, cacheando el resultado en `AsyncStorage` para funcionamiento offline.
* **Licenciamiento:** Se debe elegir una API de divisas con licencia de uso gratuita y mencionar los créditos en la sección *Legal* de la app, sin afectar la licencia PolyForm del código.
* **Prompt para Icono (IA):** *"A minimalist, flat vector app icon on a pure dark background (#09090b). The central symbol should represent a sleek, minimal wallet or a coin surrounded by orbiting currency symbols, drawn with clean lines using only Blue (#60A5FA) and white. Corporate, modern mobile UI design, no text, flat design."*

## 6. Calculadora 4All (Calculadora Cotidiana)
* **Categoría Sugerida:** ⏱️ Tiempo y Cálculo (Acento Ámbar).
* **Solución y Arquitectura Técnica:** Lógica matemática pura en JavaScript. Para evitar errores de coma flotante de JS (ej. `0.1 + 0.2`), se debe usar una librería ligera como `decimal.js` o `big.js`.
* **Licenciamiento:** `decimal.js` es licencia MIT, 100% compatible con el monorepositorio cerrado.
* **Prompt para Icono (IA):** *"A minimalist, flat vector app icon on a pure dark background (#09090b). The central symbol should represent a classic calculator keypad with large plus and percentage symbols, drawn with clean, thick lines using only Amber (#FBBF24) and white. Corporate, modern mobile UI design, no text, flat design."*

## 7. Escáner 4All (Documentos)
* **Categoría Sugerida:** 💼 Productividad (Acento Azul).
* **Solución y Arquitectura Técnica:** Extraer y potenciar la lógica que usa `PDF 4All`. Depende de un escáner nativo que haga detección de bordes mediante visión por computadora (CoreImage en iOS / OpenCV ligero en Android). Generación de PDF local.
* **Licenciamiento:** Cuidado con `OpenCV` si se usan módulos avanzados, pero las licencias Apache 2.0 / BSD de las librerías estándar de escaneo de Expo son compatibles.
* **Prompt para Icono (IA):** *"A minimalist, flat vector app icon on a pure dark background (#09090b). The central symbol should represent a glowing scanning laser sweeping over a paper document, drawn with clean lines using only Blue (#60A5FA) and white. Corporate, modern mobile UI design, no text, flat design."*

## 8. Recortes 4All (Editor Multimedia)
* **Categoría Sugerida:** 🛠️ Utilidades (Acento Turquesa).
* **Solución y Arquitectura Técnica:** Cortador simple (inicio/fin) de video y audio.
* **Licenciamiento (CRÍTICO):** ⚠️ **ESTRICTAMENTE PROHIBIDO USAR FFmpeg.** FFmpeg tiene licencias virales (GPL) que obligarían a abrir todo el código fuente de 4All y destruiría la licencia PolyForm Noncommercial. La implementación DEBE usar exclusivamente las librerías nativas del sistema (`MediaCodec` en Android, `AVFoundation` en iOS) mediante módulos Expo puenteados bajo licencia MIT (ej. `react-native-video-processing`).
* **Prompt para Icono (IA):** *"A minimalist, flat vector app icon on a pure dark background (#09090b). The central symbol should represent modern scissors intersecting a strip of film or an audio wave, drawn with clean lines using only Teal (#2DD4BF) and white. Corporate, modern mobile UI design, no text, flat design."*

## 9. Sellos 4All (Marcas de Agua y Seguridad)
* **Categoría Sugerida:** 💼 Productividad (Acento Azul).
* **Solución y Arquitectura Técnica:** Herramienta para aplicar textos/imágenes sobre fotos. Requiere manipulación de Canvas 2D. Se puede implementar renderizando una vista React Native (foto + texto con opacidad) y usando `react-native-view-shot` para exportarla como imagen segura hacia la galería.
* **Licenciamiento:** Libre de riesgos. Todas las herramientas de renderizado son MIT.
* **Prompt para Icono (IA):** *"A minimalist, flat vector app icon on a pure dark background (#09090b). The central symbol should represent a traditional rubber stamp merged with a security shield, drawn with clean, thick lines using only Blue (#60A5FA) and white. Corporate, modern mobile UI design, no text, flat design."*

## 10. Compras 4All (Lista Colaborativa)
* **Categoría Sugerida:** 💼 Productividad (Acento Azul).
* **Solución y Arquitectura Técnica:** Lista de supermercado local con base de datos autocompletable. La colaboración se logra usando `@apps4all/supabase-client` con suscripciones en tiempo real (WebSockets). Si no hay cuenta, funciona localmente.
* **Licenciamiento:** Supabase Client (MIT). Todo correcto.
* **Prompt para Icono (IA):** *"A minimalist, flat vector app icon on a pure dark background (#09090b). The central symbol should represent a sleek shopping basket or cart containing a checkmark, drawn with clean lines using only Blue (#60A5FA) and white. Corporate, modern mobile UI design, no text, flat design."*

## 11. Inventario 4All (Códigos de Barras)
* **Categoría Sugerida:** 💼 Productividad (Acento Azul).
* **Solución y Arquitectura Técnica:** Uso de `expo-barcode-scanner` o `expo-camera` para leer códigos EAN/UPC. La base de datos es local. La exportación vital a CSV se logra convirtiendo el JSON a string separado por comas y compartiendo el archivo con `expo-sharing`.
* **Licenciamiento:** Libre de dependencias riesgosas.
* **Prompt para Icono (IA):** *"A minimalist, flat vector app icon on a pure dark background (#09090b). The central symbol should represent a barcode being inspected by a glowing magnifying glass or a scanning box, drawn with clean lines using only Blue (#60A5FA) and white. Corporate, modern mobile UI design, no text, flat design."*

## 12. Reloj Mundial 4All (Comparador de Zonas)
* **Categoría Sugerida:** ⏱️ Tiempo y Cálculo (Acento Ámbar).
* **Solución y Arquitectura Técnica:** Lógica pura de fechas en JS. Se usará la API `Intl.DateTimeFormat` nativa del navegador/V8 para evitar dependencias masivas de zonas horarias pesadas. Deslizador visual (slider) que altere el estado local para comparar horas.
* **Licenciamiento:** Librerías estándar, libre de riesgos.
* **Prompt para Icono (IA):** *"A minimalist, flat vector app icon on a pure dark background (#09090b). The central symbol should represent a wireframe globe with two overlapping clock hands or clock faces, drawn with clean lines using only Amber (#FBBF24) and white. Corporate, modern mobile UI design, no text, flat design."*

## 13. Herramientas 4All (Nivel y Brújula)
* **Categoría Sugerida:** 🛠️ Utilidades (Acento Turquesa).
* **Solución y Arquitectura Técnica:** Uso intensivo de `expo-sensors`. Requiere suavizado (smoothing / low-pass filter) en los datos del acelerómetro/magnetómetro mediante matemáticas en JavaScript, ya que los sensores crudos vibran demasiado y la burbuja del nivel temblaría, dando mala experiencia de usuario.
* **Licenciamiento:** APIs de sistema operativo puras.
* **Prompt para Icono (IA):** *"A minimalist, flat vector app icon on a pure dark background (#09090b). The central symbol should represent a bubble level intersecting with a compass needle, drawn with clean, thick lines using only Teal (#2DD4BF) and white. Corporate, modern mobile UI design, no text, flat design."*

## 14. Traductor 4All (Offline)
* **Categoría Sugerida:** 🛠️ Utilidades (Acento Turquesa).
* **Solución y Arquitectura Técnica:** Diccionario basado en búsquedas rápidas sobre una base de datos `SQLite` local (descargada pre-empaquetada en la app o via OTA en el primer arranque). Limitado a palabras clave y frases, prohibido el uso de motores de Machine Learning en dispositivo.
* **Licenciamiento:** Usar diccionarios Open Source (ej. archivos de datos libres CC-BY o similares), garantizando atribuir créditos en los ajustes sin afectar la licencia de la app.
* **Prompt para Icono (IA):** *"A minimalist, flat vector app icon on a pure dark background (#09090b). The central symbol should represent a globe mixed with two overlapping translation speech bubbles (like an 'A' and an Asian character), drawn with clean lines using only Teal (#2DD4BF) and white. Corporate, modern mobile UI design, no text, flat design."*

---

## Desafíos Técnicos Mayores (Tercera Etapa)

### 15. Afinador 4All (Metrónomo y DSP)
* **Categoría Sugerida:** 🛠️ Utilidades (Acento Turquesa).
* **Solución y Arquitectura Técnica:** 
  - **Metrónomo:** Requiere un puente a código nativo (`AudioTrack` en Android / `AVAudioEngine` en iOS) porque el hilo de JavaScript (JS Thread) sufre de *jitter* y causaría desincronizaciones rítmicas.
  - **Afinador:** Se necesita muestrear el micrófono a 44.1kHz e inyectarlo en un algoritmo DSP de Transformada de Fourier (FFT) en tiempo real para encontrar la frecuencia (Hz).
* **Licenciamiento:** Cualquier librería C++ usada para FFT debe ser MIT (ej. KissFFT). Estrictamente prohibidas librerías GPL.
* **Prompt para Icono (IA):** *"A minimalist, flat vector app icon on a pure dark background (#09090b). The central symbol should represent a classic tuning fork intersecting with a metronome pendulum, drawn with clean lines using only Teal (#2DD4BF) and white. Corporate, modern mobile UI design, no text, flat design."*

### 16. Mejoras Existentes: Widgets de Pantalla de Inicio
* **Solución y Arquitectura Técnica:** Los widgets no corren en React Native. Se debe escribir código Swift nativo para WidgetKit (iOS) y Kotlin para AppWidgets (Android). Luego, crear un *Expo Config Plugin* para inyectar este código al compilar y compartir almacenamiento con la app principal usando *App Groups* (iOS) o *Content Providers* (Android).

---

## Directrices de Cumplimiento (Monorepo)
1. **Zero Third-Party SDKs:** Prohibido Firebase o Google Analytics.
2. **Localization (i18n):** Todo texto mapeado a `@apps4all/i18n`.
3. **Licenciamiento:** Toda integración asume licencia **PolyForm Noncommercial 1.0.0**.
4. **Nomenclatura:** Sufijo obligatorio `4All` en el `app.json`.

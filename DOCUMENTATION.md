# Ecosistema "Para Todos" (4All) - Documentación Maestra Integral 🚀

Bienvenido a la documentación técnica, arquitectónica, legal y operativa del ecosistema **Para Todos (4All)**. Este documento es la **fuente única de verdad** para el mantenimiento del monorepositorio, la publicación de aplicaciones y la protección de los derechos de autor.

> 🛠️ **¿Clonaste este repo en una PC nueva?** Consulta primero [SETUP_DEV_ENVIRONMENT.md](./SETUP_DEV_ENVIRONMENT.md) para instalar Node, pnpm, Java 21, Android SDK 35 + NDK/CMake y configurar tus llaves de firma en minutos.

---

## 1. Filosofía Central y Principios No Negociables

1. **Offline-First (Local First Absoluto):** La funcionalidad central de las 15 aplicaciones funciona al 100% sin internet. Todos los cálculos pesados (criptografía, compresión de imágenes, empaquetado ZIP, renderizado PDF, análisis y procesamiento de audio DSP) se ejecutan directamente en la CPU y almacenamiento local del dispositivo.
2. **Privacidad por Diseño (Privacy by Design):** Cero SDKs de rastreo o analítica invasiva de terceros (sin Firebase Analytics, sin Google Telemetry, sin Meta Pixel).
3. **Notificaciones Locales Únicamente:** No existen servidores de notificaciones push en segundo plano. Si una utilidad requiere alarmas (como el Pomodoro), se gestiona a través del subsistema de notificaciones locales del teléfono.
4. **Arquitectura Monorepo (Turborepo + pnpm):**
   - Paquetes compartidos: `@apps4all/i18n` (26 idiomas oficiales), `@apps4all/ui-components` (componentes base accesibles), `@apps4all/supabase-client` (cliente opcional para sincronización en la nube).
   - Aplicaciones: 15 proyectos Expo/React Native independientes bajo `apps/` y el portal de aterrizaje web en `apps/web` (Astro).
5. **Sistema de Diseño Unificado:**
   - Tailwind CSS vía NativeWind v4 en todas las aplicaciones móviles y Tailwind/Vanilla en el portal web Astro.
   - Modo Oscuro nativo dinámico obligatorio basado en la escala Zinc (`zinc-50` / `zinc-950`).
   - Acentos cromáticos semánticos por categoría (estrictamente regulados, sin colores arbitrarios):
     - 💼 **Productividad (Azul):** Claro `#2563EB` (Blue 600) | Oscuro `#60A5FA` (Blue 400).
     - 🛠️ **Utilidades (Turquesa):** Claro `#0F766E` (Teal 700) | Oscuro `#2DD4BF` (Teal 400).
     - ⏱️ **Tiempo y Cálculo (Ámbar):** Claro `#B45309` (Amber 700) | Oscuro `#FBBF24` (Amber 400).
6. **Regla de Nomenclatura Canónica (Sufijo Obligatorio `4All`):**
   - Todas las aplicaciones del ecosistema deben llevar sin excepción el sufijo `4All` al final de su nombre en toda la interfaz de usuario, títulos de pantallas, menús de navegación, paquetes (`app.json`), tiendas de aplicaciones y en el portal web oficial (ej. *Apuntes 4All*, *Seguridad 4All*, *Festivos Colombia 4All*, *Reproductor 4All*).
7. **Cuentas y Sincronización en la Nube 100% Opcionales:**
   - Cero barreras de entrada ni muros de registro forzoso (*zero login walls*). El 100% de la funcionalidad principal de cada herramienta opera sin crear cuentas. La sincronización en la nube (mediante `@apps4all/supabase-client`) es una característica estrictamente voluntaria y complementaria para usuarios que desean respaldar información entre dispositivos.
8. **Ecosistema Multilingüe Oficial y Hojas de Ruta:**
   - Cero texto quemado (*zero hardcoded strings*). Cada cadena se resuelve mediante `useTranslation` de `react-i18next` apuntando a `packages/i18n/locales/*.json`.
   - **Fase 1 (Actual - 26 Idiomas):** Cobertura global en los mercados principales: Español (`es`), Inglés (`en`), Portugués (`pt`), Italiano (`it`), Turco (`tr`), Polaco (`pl`), Hindi (`hi`), Indonesio (`id`), Ruso (`ru`), Francés (`fr`), Alemán (`de`), Chino Simplificado (`zh-CN`), Chino Tradicional (`zh-TW`), Coreano (`ko`), Japonés (`ja`), Vietnamita (`vi`), Tailandés (`th`). Más los idiomas de la Fase 2 (LTR): Bengalí (`bn`), Filipino/Tagalo (`fil`), Suajili (`sw`), Hausa (`ha`), Malayo (`ms`), Ucraniano (`uk`), Tamil (`ta`), Telugu (`te`), Maratí (`mr`).
   - **Fase 2 (Expansión Estratégica LTR):** Bengalí (`bn`), Filipino/Tagalo (`fil`), Suajili (`sw`), Hausa (`ha`), Malayo (`ms`), Ucraniano (`uk`), y evaluación de idiomas regionales de India (Tamil, Telugu, Maratí). *Impacto masivo en mercados emergentes sin fricción técnica de UI.*
   - **Fase 3 (Soporte RTL):** Árabe (`ar`), Urdu (`ur`), Persa (`fa`). *Postergados intencionalmente para la etapa de madurez del ecosistema debido a la alta complejidad técnica de espejar la interfaz de usuario completa.*
9. **Identidad Visual e Iconografía Oficial:**
   - Los 15 iconos oficiales del ecosistema siguen un formato de squircle oscuro de 512×512 px con arte lineal en estilo origami neón, coordinados cromáticamente con la categoría de la app.
   - Estandarización de `adaptiveIcon` en Android (`app.json`): color de fondo fijado en `#09090b` (Zinc-950) con `foregroundImage` sin plantillas celestes (`#E6F4FE`), garantizando una integración estética impecable y continua en el launcher de cualquier dispositivo Android.

---

## 2. Flujo de Datos, Aprobación de Permisos y Conexión de Cuenta

### A. Creación y Persistencia de Datos Locales

- **Almacenamiento Local Seguro:** Cada aplicación gestiona sus datos a través de `Zustand` persistido en `AsyncStorage` (datos generales y colecciones) o `expo-secure-store` (contraseñas y credenciales críticas cifradas con el Keychain de iOS y KeyStore de Android).
- **Archivos y Medios:** Los archivos generados (audios M4A, PDFs, imágenes comprimidas, backups JSON, ZIPs) se guardan en el directorio permanente del sistema (`FileSystem.documentDirectory`), inmunes al borrado de caché temporal del sistema operativo.

### B. Flujo de Aprobación de Permisos Nativos

Cada aplicación solicita permisos en el momento exacto en que se requiere una función nativa (Just-in-Time Permissions), con mensajes claros y manejando el rechazo sin colapsar la app:

- 📷 **Cámara (`expo-camera`, `DocumentScanner`):** Utilizada en `QR 4All`, `Lupa y Linterna 4All` y `PDF 4All`. Si el usuario no otorga el permiso, se muestra una pantalla explicativa con botón para reintentar o la opción alternativa de cargar archivos desde la galería.
- 🖼️ **Galería y Fotos (`expo-media-library`, `expo-image-picker`):** Utilizada en `QR 4All`, `Fotos Ligeras 4All` y `Lupa y Linterna 4All`. Permite guardar capturas y fotos comprimidas en álbumes dedicados sin duplicar imágenes innecesariamente.
- 🎙️ **Micrófono (`expo-av`):** En `Notas de Voz 4All`. Permite la grabación en segundo plano con la pantalla apagada (`staysActiveInBackground: true`).
- 🔒 **Biometría Local (`expo-local-authentication`):** En `Apuntes 4All` (Carpetas Privadas) y `Seguridad 4All` (Bóveda de Claves). La autenticación con Huella Dactilar o Face ID es 100% física y local; ninguna clave biométrica sale del procesador seguro del dispositivo (Secure Enclave / TEE).
- 📅 **Calendario Nativo (`expo-calendar`):** En `Festivos Colombia 4All`. Permite sincronizar los días festivos de todo el año en Google Calendar o Apple Calendar con un solo toque.

### C. Conexión de Cuenta y Sincronización en la Nube (Opt-in)

- **Arquitectura:** El paquete `@apps4all/supabase-client` proporciona la pasarela para los usuarios que deseen respaldar sus datos entre dispositivos.
- **Comportamiento por Defecto:** Si el usuario no ha iniciado sesión, el interruptor de "Sincronización en la Nube" permanece inactivo y toda la aplicación funciona 100% de manera local y offline sin advertencias ni ventanas emergentes molestas.
- **Sincronización Silenciosa:** Si el usuario activa la sincronización y está conectado a una cuenta, los datos se transmiten de forma cifrada. Si el dispositivo pierde internet, el sistema almacena las operaciones localmente y no bloquea al usuario ni genera errores visuales.

### D. Panel Unificado de Ajustes (`SettingsModal4All` & `useSharedSettingsStore`)

Cada una de las 15 aplicaciones cuenta con un acceso directo en su cabecera (icono de engranaje ⚙️) que despliega el panel de configuración unificado:

- **Cuenta Única del Ecosistema:** Integración con `AccountModal4All`. La sesión iniciada en una aplicación autentica la identidad del usuario y permite sincronizar sus preferencias en las demás apps sin reingresar credenciales.
- **Opciones Dependientes de Cuenta Protegidas:** Los interruptores y botones de sincronización en la nube se muestran visibles en todo momento para que el usuario conozca la funcionalidad, pero permanecen **desactivados y con icono de candado (🔒)** si no ha iniciado sesión. Al tocarlos, se le invita a crear una cuenta o ingresar.
- **Selector de Idioma Dinámico:** Acceso directo a los 26 idiomas oficiales del ecosistema con cambio instantáneo de diccionarios vía `@apps4all/i18n`.
- **Tema y Modo Oscuro Dinámico:** Compatible con `"userInterfaceStyle": "automatic"` en todos los `app.json`. Permite alternar entre Claro, Oscuro y Seguir al Sistema.
- **Telemetría Transparente:** Interruptor para envío anónimo de reportes técnicos de error, **desactivado por defecto** y 100% opt-in.
- **Términos y Privacidad Offline (`LegalModal4All`):** Lectura local de la Política de Privacidad, Términos y Condiciones y Licencia PolyForm Noncommercial 1.0.0 directamente dentro de la app sin necesidad de conexión a internet, con enlace adicional para visualización en el portal web oficial.
- **Secciones Específicas por App (`appSpecificSection`):** Cada aplicación puede inyectar controles particulares en su panel de ajustes (ej. selector multipaís en `Festivos Colombia 4All`).

---

## 3. Catálogo Completo de las 15 Aplicaciones del Ecosistema

### ⏱️ Categoría: Tiempo y Cálculo (Acento Ámbar)

#### 1. Festivos Colombia 4All (`apps/festivos-4all`)

- **Propósito:** Calendario dinámico de días festivos con cálculo de la Ley Emiliani y cómputo astronómico de Pascua.
- **Funcionalidades Implementadas:**
  - **Widget Contador Heroico:** Muestra en la cabecera cuántos días faltan para el próximo día feriado con alertas (_"Faltan 4 días: Día de la Independencia"_, _"¡Hoy es festivo!"_, _"¡Mañana es festivo!"_).
  - **Soporte Multipaís:** Barra de cambio rápido entre Colombia 🇨🇴, México 🇲🇽, Argentina 🇦🇷, España 🇪🇸, Chile 🇨🇱, Perú 🇵🇪 y EE.UU. 🇺🇸.
  - **Sincronización con Calendario Nativo:** Exportación de todos los festivos del año a Google Calendar o Apple Calendar vía `expo-calendar`.

#### 2. Azar 4All (`apps/azar-4all`)

- **Propósito:** Generador de eventos aleatorios para toma de decisiones y entretenimiento sin publicidad.
- **Funcionalidades Implementadas:**
  - **Respuesta Háptica (`expo-haptics`):** Vibraciones físicas calibradas al agitar el teléfono, lanzar dados o girar monedas.
  - **Ruleta de la Suerte Visual:** Gráfico animado que gira 360° con selector de aguja superior, desaceleración física y anuncio del ganador.
  - **Divisor de Equipos Equilibrados:** Ingreso de listas de nombres con balanceo automático en 2, 3 o 4 equipos aleatorios.
  - **Lanzador de Dados, Moneda y Sorteo de Números:** Con rangos configurables y memoria de últimos resultados.

#### 3. Cuentas 4All (`apps/cuentas-4all`)

- **Propósito:** Calculadora de división de cuentas en restaurantes y propinas.
- **Funcionalidades Implementadas:**
  - **División Básica y Proporcional:** Cálculo de propina (0% a 30%) y costo por comensal en tiempo real.
  - **Consumo Individualizado (Quién comió qué):** Modal para asignar platos o bebidas a personas específicas, distribuyendo impuestos y propina equitativamente.
  - **Redondeo Inteligente de Efectivo:** Selector de redondeo exacto o aproximado al $10, $100, $500 o $1.000 más cercano para evitar complicaciones con monedas locales.
  - **Selector Rápido de Divisas:** Conmutador de símbolos monetarios (`$`, `€`, `£`, `R$`, `Bs`).

#### 4. Enfoque 4All (Pomodoro) (`apps/enfoque-4all`)

- **Propósito:** Gestor de concentración y productividad personal basado en la técnica Pomodoro.
- **Funcionalidades Implementadas:**
  - **Temporizador con Precisión Absoluta:** Sincronización antidesfase con `AppState` para mantener el tiempo exacto si la app pasa a segundo plano.
  - **Intervalos Personalizados:** Modal para ajustar los tiempos de Enfoque, Descanso Corto y Descanso Largo.
  - **Barra de Ambientes Sonoros:** Selector de audio para concentración (Silencio, Lluvia, Ruido Blanco, Olas de Mar, Café).
  - **Matriz de Consistencia Semanal y Racha:** Visualizador de productividad estilo cuadrícula de GitHub que registra las sesiones diarias y calcula días consecutivos de racha.

---

### 🛠️ Categoría: Utilidades (Acento Turquesa)

#### 5. Medidas 4All (`apps/medidas-4all`)

- **Propósito:** Conversor universal de unidades físicas y digitales.
- **Funcionalidades Implementadas:**
  - **Almacenamiento Digital:** Soporte para Bytes (B), Kilobytes (KB), Megabytes (MB), Gigabytes (GB), Terabytes (TB) y Petabytes (PB).
  - **Unidades Físicas:** Longitud, Masa/Peso, Temperatura, Volumen (incluyendo tazas culinarias) y Velocidad (incluyendo nudos marítimos).
  - **Botón de Inversión Rápida (↔️):** Intercambia las unidades de entrada y salida con un solo toque.
  - **Copiado al Portapapeles (`expo-clipboard`):** Copia directa del resultado con confirmación visual interactiva.

#### 6. QR 4All (`apps/qr-4all`)

- **Propósito:** Generador y lector de códigos QR con personalización visual avanzada de alta fidelidad, galería local y respaldo en nube.
- **Funcionalidades Implementadas:**
  - **10 Formatos Estructurados:** Enlace Web (URL), Wi-Fi (WPA/WEP/abierta), WhatsApp con mensaje, vCard/Contacto, Texto Libre, Correo Electrónico, Llamada Telefónica, SMS, Bitcoin y PayPal.
  - **Suite Integral de Personalización Visual (100% Offline):**
    - _Paleta de Colores Curada:_ Selección de color frontal sólido con contrastes óptimos garantizados (Zinc, Blue, Teal, Amber, Rose, Emerald, Violet) y color de fondo personalizable.
    - _Gradientes Lineales Bi-Tono:_ 5 gradientes vibrantes pre-calibrados (Aurora, Sunset, Forest, Golden, Cyber) renderizados vectorialmente mediante `react-native-svg`.
    - _Logotipo Central (Presets o Personalizado):_ Carga de imágenes locales desde la galería del dispositivo con recorte cuadrado 1:1 (`expo-image-picker`) o selección de presets vectoriales SVG nativos embebidos (Wi-Fi, URL, WhatsApp, Contacto, Correo, Seguridad, Estrella, Pago).
    - _Marcos con Llamado a la Acción (CTA):_ 4 templates envolventes (`Sin marco`, `Scan Me Superior`, `Scan Me Inferior`, `Estilo Tarjeta / Card`) con campo de texto interactivo personalizable en vivo (ej. *"¡Escanéame!"*, *"Conéctate"*).
    - _Escalado Automático de Redundancia (Nivel 'H' - 30%):_ Al detectar la inserción de un logo o marco, el motor eleva automáticamente la corrección de errores de Reed-Solomon al nivel "H" (30% de redundancia matemática), blindando la tasa de lectura contra cualquier cámara o condición lumínica.
    - _Interfaz Dual con Previsualización Reactiva:_ Cabecera ergonómica con pestañas `[ Contenido ]` y `[ Diseño ]` que actualiza el código en tiempo real ante cualquier cambio de color, logo o marco.
  - **Exportación en Alta Definición:** Renderizado vectorial en SVG con guardado a PNG en la galería de fotos (`expo-media-library`) y compartir nativo (`expo-sharing`).
  - **Escáner Doble:** Escaneo en tiempo real con cámara trasera y linterna, o decodificación desde capturas de pantalla / fotos de la galería (`expo-image-picker`).
  - **Mis QR Guardados con Fidelidad de Estilo:** Pestaña de historial local persistido con `Zustand` que almacena los parámetros de diseño (`styleConfig`) y los reconstruye fielmente en el modal de proyección a pantalla completa, con sincronización en nube opcional mediante `@apps4all/supabase-client`.

#### 7. Lupa y Linterna 4All (`apps/lupa-4all`)

- **Propósito:** Herramienta de magnificación visual para lectura de letra pequeña y prospectos médicos.
- **Funcionalidades Implementadas:**
  - **Filtros de Alto Contraste para Accesibilidad:** Conmutador de capas ópticas:
    - _Natural:_ Color real de la cámara.
    - _Amarillo/Negro:_ Estándar internacional para personas con baja visión, cataratas o degeneración macular.
    - _Invertido:_ Fondo negro con letras claras para reducir deslumbramiento.
    - _Escala de Grises Nítida:_ Máximo contraste de bordes.
  - **Congelar Pantalla (Freeze Frame):** Pausa del sensor de video para examinar el texto sin pulso tembloroso.
  - **Guardar Captura en Galería (`expo-media-library`):** Almacena la imagen congelada en alta resolución en las fotos del celular.
  - **Control de Zoom y Linterna:** Deslizador suave de 1.0x a 4.0x y encendido de linterna trasera (torch).

#### 8. Fotos Ligeras 4All (`apps/fotos-ligeras-4all`)

- **Propósito:** Compresor y redimensionador masivo de imágenes para liberar espacio en memoria.
- **Funcionalidades Implementadas:**
  - **Deslizador Comparativo Antes / Después:** Pantalla dividida interactiva (de 10% a 90%) para evaluar en tiempo real la calidad de la foto original frente a la comprimida.
  - **Métrica Dinámica de Reducción:** Cálculo del peso original frente al peso final y porcentaje exacto de ahorro (ej. _"Original: 5.2 MB ➔ Comprimida: 710 KB (-86%)"_).
  - **Perfiles Predefinidos de Uso:**
    - 💬 _Para WhatsApp:_ Resolución balanceada (1280px, calidad 65%).
    - ✉️ _Para Correo (<2MB):_ Reducción calibrada para el límite de adjuntos.
    - ⚡ _Máximo Ahorro:_ Ultra-compresión para almacenamiento crítico.
    - 🌟 _Alta Calidad:_ Compresión suave manteniendo dimensiones nativas.
  - **Álbum Automático:** Creación automática del álbum "Fotos Ligeras" en la galería del dispositivo.

#### 9. ZIP 4All (`apps/zip-4all`)

- **Propósito:** Compresor y extractor de archivos `.zip` con cifrado y visualizador multimedia.
- **Funcionalidades Implementadas:**
  - **Tarjeta de Rendimiento de Compresión:** Métrica inmediata que muestra el tamaño original total de los archivos, el peso final del `.zip` y el porcentaje de reducción alcanzado.
  - **Visualizador Previo Integrado:**
    - _Imágenes (`.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`):_ Modal a pantalla completa para ver la foto antes de extraerla.
    - _Documentos y Código (`.txt`, `.json`, `.csv`, `.md`, `.js`, `.log`):_ Visor monoespaciado para leer el texto completo sin necesidad de un editor externo, con botón de copiado y compartir.
  - **Cifrado AES-256:** Creación de archivos ZIP protegidos por contraseña y extracción de archivos encriptados.

---

### 💼 Categoría: Productividad (Acento Azul)

#### 10. Notas de Voz 4All (`apps/notas-voz-4all`)

- **Propósito:** Grabadora de notas de voz de alta fidelidad sin límites artificiales.
- **Funcionalidades Implementadas:**
  - **Grabación en Segundo Plano:** Mantiene la grabación activa con la pantalla del celular apagada (`staysActiveInBackground: true`) en formato M4A (AAC ultra-comprimido).
  - **Renombrado de Grabaciones:** Modal para asignar títulos descriptivos (ej. _"Entrevista Laboral"_, _"Reunión Proyecto"_).
  - **Velocidad de Reproducción Variable:** Selector de velocidad instantáneo a `1.0x`, `1.5x` o `2.0x` mediante `expo-av` con preservación de tono de voz.
  - **Recortador de Silencios Local:** Modal con ajuste de segundos de inicio y fin para omitir pausas sin alterar el archivo original.

#### 11. Apuntes 4All (`apps/apuntes-4all`)

- **Propósito:** Cuaderno de notas, listas de tareas y listas de chequeo con carpetas privadas.
- **Funcionalidades Implementadas:**
  - **Buscador Global de Texto en Tiempo Real:** Barra de búsqueda en la pantalla principal que rastrea instantáneamente palabras clave en títulos y contenidos de todas las notas.
  - **Exportación y Respaldo Local:** Botón directo que empaqueta todas las notas y carpetas en un archivo estructurado `apuntes_backup_TIMESTAMP.json` listo para compartir o respaldar.
  - **Bloqueo Biométrico de Carpeta Privada:** Protección de carpetas confidenciales mediante Face ID o Huella Dactilar local (`expo-local-authentication`).
  - **Notas Fijadas y Listas de Tareas Interactivas:** Checklists con tachado dinámico y contador de tareas completadas.

#### 12. Seguridad 4All (`apps/seguridad-4all`)

- **Propósito:** Generador de contraseñas de nivel criptográfico y bóveda cifrada local.
- **Funcionalidades Implementadas:**
  - **Medidor de Fuerza y Entropía en Tiempo Real:** Cálculo matemático de bits de entropía ($E = L \times \log_2(N)$) con barra visual de complejidad (Rojo $\rightarrow$ Verde) y estimación de tiempo de fuerza bruta (ej. _"Inquebrantable - Millones de años"_).
  - **Bóveda Protegida con Biometría:** Acceso exclusivo a las contraseñas guardadas mediante Huella Dactilar o Face ID utilizando `expo-secure-store` y `expo-local-authentication`.
  - **Recordatorio de Renovación / Expiración:** Configuración de ciclos de reemplazo de contraseñas (30, 90 o 180 días) con etiquetas de caducidad visuales en la bóveda (`Vence en X días` o `⚠️ Expirada`).

#### 13. PDF 4All (`apps/pdf-4all`)

- **Propósito:** Suite de procesamiento de documentos PDF en el dispositivo.
- **Funcionalidades Implementadas:**
  - **Leer PDF:** Apertura fluida sin consumo de RAM mediante el visor del sistema operativo (`IntentLauncher` en Android, Quick Look en iOS).
  - **Fotos a PDF:** Conversión de capturas de cámara a PDF multipágina mediante `pdf-lib`.
  - **Unir PDFs:** Fusión de múltiples documentos PDF en un único archivo.
  - **Extraer Páginas:** Extracción de intervalos específicos (ej. `1, 3, 5-7`).
  - **Girar Páginas (90°):** Rotación horaria de todas las páginas de un documento de forma 100% matemática y local.
  - **Marca de Agua Textual Offline:** Estampado diagonal semitransparente personalizable (ej. _"CONFIDENCIAL"_, _"COPIA NO VÁLIDA"_) en cada una de las páginas.

#### 14. Docs 4All (`apps/docs-4all`)

- **Propósito:** Visor ultraligero para documentos de oficina sin software pesado.
- **Funcionalidades Implementadas:**
  - **Buscador en Tiempo Real dentro del Documento:** Resalta coincidencias en párrafos de Word (`.docx`) y en celdas de hojas de cálculo Excel (`.xlsx`).
  - **Navegador de Hojas en Libros de Excel:** Barra inferior con pestañas interactivas para alternar entre todas las hojas del archivo `.xlsx` (`Hoja 1`, `Hoja 2`, `Presupuesto`, etc.).
  - **Exportar a PDF:** Conversión e impresión de documentos o tablas activas a formato PDF estándar mediante `expo-print` y `expo-sharing`.
  - **Escudo de Memoria (10MB):** Bloqueo preventivo de archivos masivos para proteger la RAM del dispositivo.

#### 15. Reproductor 4All (`apps/reproductor-4all`)

- **Propósito:** Reproductor de audio audiófilo de ultra-baja latencia y alta fidelidad 100% offline con ecualizador paramétrico C++.
- **Arquitectura y Funcionalidades Implementadas:**
  - **Decodificación Nativa por Hardware (`AMediaCodec` / `AMediaExtractor`):** Lee y decodifica archivos locales (FLAC, MP3, M4A, WAV) directamente en la CPU/DSP del dispositivo, sin usar FFmpeg ni librerías con licencias virales restrictivas.
  - **Salida de Audio Profesional con Google Oboe (Apache 2.0):** Flujo de audio de latencia ultrabaja en C++ conectado a AAudio / OpenSL ES.
  - **Ecualizador Paramétrico de 5 Bandas (Filtros Biquad IIR):** Ajuste de precisión en tiempo real (Frecuencia de corte, Ganancia en dB y factor Q de resonancia) con suavizado de coeficientes (_anti-zipper_) para evitar chasquidos.
  - **Buffer Circular Concurrente Lock-Free (SPSC Ring Buffer):** Comunicación de cero bloqueo entre el hilo de decodificación y el callback de audio de tiempo real.
  - **Foreground Service y MediaSessionCompat:** Reproducción ininterrumpida en segundo plano con controles nativos en pantalla de bloqueo, barra de notificaciones, audífonos y mandos de volante de automóvil (Bluetooth AVRCP).
  - **Gestión de Audio Focus:** Pausa y reanudación automática ante llamadas entrantes, mensajes o alarmas del sistema.
  - **Conmutación Automática de Perfiles por Bluetooth (Offline):** `BroadcastReceiver` con permiso seguro `BLUETOOTH_CONNECT` (`neverForLocation`) que reconoce los auriculares o altavoces conectados y activa el perfil de ecualización guardado para ese dispositivo.
  - **Categoría y Diseño:** Categoría **Utilities** (Herramientas del Sistema) con acento Teal (`#0F766E` en claro, `#2DD4BF` en oscuro), paleta Zinc, soporte para los 26 idiomas oficiales y visor legal offline (`LegalModal4All`).

---

## 4. Portal Web de Aterrizaje y Distribución Global (`apps/web` - Astro)

El ecosistema cuenta con un portal web oficial estático y de alto rendimiento diseñado como punto de entrada público, exhibición de portafolio y centro de descarga directa de APKs:

- **Tecnología y Rendimiento:** Desarrollado con **Astro 5** en modo de Generación Estática (SSG) pura, logrando tiempos de carga sub-segundo sin dependencias pesadas en el cliente.
- **Matriz de Localización Completa (69 Páginas Estáticas):** 
  - Generación de rutas localizadas para los 26 idiomas oficiales: `/[lang]/` (landing page principal) y páginas legales en `/[lang]/legal/privacy`, `/[lang]/legal/terms` y `/[lang]/legal/license`.
  - Selector desplegable de idiomas interactivo con conmutación en tiempo real y detección de idioma preferido.
- **Vitrina Dinámica de Aplicaciones (`AppCard.astro`):**
  - Muestra las 15 aplicaciones agrupadas en sus tres categorías semánticas (Productividad, Utilidades, Tiempo y Cálculo).
  - Integración directa con los 15 iconos oficiales (`/icons/*.png`) con micro-animaciones `hover:scale-105`, `drop-shadow-md` y carga diferida (`loading="lazy"`).
  - Botones de descarga directa de APKs apuntando a los releases compilados de GitHub.
- **Modo Claro / Oscuro Dinámico:** Alternancia fluida con botón en la barra de navegación que sincroniza la clase `dark` en el elemento raíz `<html>` y preserva la preferencia del usuario en `localStorage`.
- **Claridad de Mensajería:** Refleja la filosofía del ecosistema con textos actualizados: *"15 Apps · 26 Idiomas · 100% Offline"*, destacando que el uso no requiere cuentas y que la sincronización en la nube es 100% opcional.

---

## 5. Análisis Legal, Copyright y Protección para Futura Venta (Exit)

### A. Diagnóstico de la Licencia: ¿Es la PolyForm Noncommercial 1.0.0 la mejor opción?

> [!IMPORTANT]
> **SÍ, es la mejor opción para tus objetivos.**
> Cumple al 100% con tu requerimiento explícito: _"debe ser gratuita para los usuarios, pero debo conservar los derechos en caso de que a futuro alguien desee comprarlas y yo pueda venderlas sin ningún problema"_.

#### Comparativa Legal Estratégica:

| Criterio                                 | Licencia Abierta (MIT / Apache)          | Licencia Viral (GPL v3)            | **PolyForm Noncommercial 1.0.0 (Actual)**          |
| :--------------------------------------- | :--------------------------------------- | :--------------------------------- | :------------------------------------------------- |
| **Gratis para usuarios**                 | Sí                                       | Sí                                 | **Sí (100% gratuito para uso personal)**           |
| **Prohíbe a terceros vender tu app**     | ❌ No (Cualquiera puede comercializarla) | ⚠️ Complejo (Exige código abierto) | **✅ Sí (Prohibición comercial absoluta)**         |
| **Derecho exclusivo del autor a vender** | ⚠️ Pierde exclusividad                   | ❌ No puede cerrarse fácilmente    | **✅ Sí (El autor posee el 100% de los derechos)** |
| **Exhibición en Portafolio Público**     | Sí                                       | Sí                                 | **✅ Sí (Auditable y público sin riesgo)**         |

#### ¿Por qué protege la venta futura a un inversor?

Bajo la **PolyForm Noncommercial License 1.0.0**:

1. Los usuarios tienen derecho a usar, compilar y ejecutar el software **únicamente con fines no comerciales**.
2. **Ninguna empresa, competidor ni tercero** puede lucrar, redistribuir con fines de lucro, vender ni incorporar este código en un producto comercial.
3. Como **Autor y Titular Original de los Derechos de Autor (Copyright Holder)**, tú no estás limitado por la licencia que otorgas al público. Puedes:
   - Vender la propiedad intelectual completa (IP Assignment) a un comprador por cualquier cifra.
   - Re-licenciar el código de forma propietaria exclusiva a una empresa adquirente.
   - El comprador adquiere el control comercial total sin que existan ataduras de licencias copyleft (como la GPL).

### B. Marcado de Código Fuente (Cabecera de Copyright)

Para reforzar legalmente la titularidad de autor en el monorepositorio, los archivos principales de código fuente deben incluir la siguiente cabecera estándar:

```typescript
/**
 * Para Todos (4All) Ecosystem
 * Copyright (c) 2026 [Tu Nombre o Razón Social]. Todos los derechos reservados.
 *
 * Licenciado bajo PolyForm Noncommercial License 1.0.0.
 * Queda estrictamente prohibido el uso comercial, monetización o redistribución
 * con fines de lucro sin autorización previa por escrito del autor.
 */
```

---

## 6. Guía de Blindaje del Repositorio en GitHub (Solo Tú Puedes Modificar)

Para garantizar que el repositorio sea público para tu portafolio, pero que **absolutamente nadie que no seas tú pueda hacer commits, enviar Pull Requests ni alterar el código**, sigue esta configuración paso a paso en GitHub:

### Paso 1: Subir el Monorepositorio a GitHub

Ejecuta en tu terminal local (`d:\APP_development\Apps_4all`):

```bash
git init
git add .
git commit -m "🚀 Master Release: 4All Ecosystem (15 Apps + Astro Portal)"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/Apps_4all.git
git push -u origin main
```

### Paso 2: Blindar la Rama `main` (Branch Protection Rule)

1. En GitHub, entra a tu repositorio y haz clic en **Settings** (pestaña superior).
2. En el menú lateral izquierdo, haz clic en **Branches**.
3. Haz clic en **Add branch protection rule** (o **Add rule**).
4. En **Branch name pattern**, escribe: `main`.
5. Activa las siguientes casillas:
   - ✅ **Require a pull request before merging:** (Exige que cualquier cambio pase por revisión).
     - Desmarca la opción de que otros puedan aprobar.
   - ✅ **Restrict who can push to matching branches:**
     - En el campo de búsqueda, **escribe tu propio usuario de GitHub y selecciónalo**.
     - _Resultado:_ Ningún otro usuario del mundo tendrá permisos de push a la rama principal.
   - ❌ Asegúrate de que **"Allow force pushes"** y **"Allow deletions"** estén **DESMARCADAS**.
6. Haz clic en **Create** (o **Save changes**).

### Paso 3: Desactivar Pull Requests y Aportes Externos

1. Ve a **Settings** $\rightarrow$ **General**.
2. Desplázate hacia abajo hasta la sección **Features**:
   - Desmarca **Issues** (para evitar que terceros abran reportes no deseados).
   - Desmarca **Discussions** (para evitar foros de discusión no moderados).
3. Si el repositorio es de exhibición estricta:
   - En **Settings** $\rightarrow$ **Moderation** (o **Interaction limits**), activa **Limit to existing collaborators** (Restringe interacciones de usuarios externos).

### Paso 4: Agregar el Archivo `CONTRIBUTING.md`

En la raíz del repositorio se añade el archivo `CONTRIBUTING.md` que notifica formalmente a cualquier visitante que el repositorio no acepta colaboraciones externas ni solicitudes de extracción.

---

## 7. Arquitectura de DevOps, Firmas Criptográficas y Auditoría de Licencias

### A. Auditoría de Licencias de Terceros y Protección de Propiedad Intelectual

Para blindar el valor comercial y jurídico del ecosistema bajo la licencia **PolyForm Noncommercial 1.0.0**, el monorepositorio se somete a una auditoría estricta de dependencias:

- **Categoría Segura / Permisiva:** Únicamente se permiten paquetes con licencias permisivas (MIT, Apache 2.0, BSD-2/3-Clause, ISC, Unlicense, Public Domain).
- **Zona Roja / Prohibida (Copyleft Viral):** Queda estrictamente prohibida la incorporación de librerías bajo licencias virales (GPLv2/v3, AGPL, LGPL restrictivas o CC-BY-SA) tanto en JavaScript como en C++ y Java/Kotlin.
- **Auditoría de Nuevas Dependencias (Verificada):** Se validó que los módulos recientemente integrados (`react-native-svg` [MIT], `expo-image-picker` [MIT], `astro` [MIT], `tailwindcss` [MIT]) cumplen al 100% con licencias permisivas, sin contaminar el código fuente.
- **Garantía para Venta Corporativa (M&A Due Diligence):** Esta auditoría certifica que el código fuente no contiene "infecciones" de código abierto que obliguen legalmente a abrir el código del ecosistema, permitiendo transferir o vender el software a terceros con titularidad limpia y sin contingencias.

### B. Blindaje de Keystores y Firmas de Producción en Release

- **Prevención de `debug.keystore` en Producción:** La configuración de Gradle (`android/app/build.gradle`) exige que las compilaciones de tipo `release` se firmen exclusivamente con el Keystore de producción oficial inyectado a través de variables de entorno o `gradle.properties` fuera de control de versiones. Si las variables no están presentes, la compilación falla con un error explícito.
- **Protección Cero Fugas en Git (`.gitignore`):** Ningún archivo de firma (`*.keystore`, `*.jks`, `credentials.json`, `release-signing.properties`) se incluye en el control de versiones.

### C. Gestión Definitiva de Keystores de Producción (Implementación Actual)

**¿Qué es un Keystore y por qué es crítico?**
Un archivo `.keystore` (o `.jks`) es la firma criptográfica (el pasaporte digital) de tus aplicaciones. Android y Google Play lo usan para verificar que tú eres el creador legítimo de una actualización y no un hacker intentando suplantar tu app.

**Reglas de Oro del Ecosistema 4All:**
1. **Firma Definitiva desde el Día 1:** Desde el primer APK que se ofrezca para descarga directa en el portal web (Astro), se debe compilar usando el Keystore de Producción definitivo. 
   - *¿Por qué?* Si el día de mañana decides publicar la app en Google Play Store (o unificar canales), el usuario podrá instalar la actualización encima del APK antiguo sin problemas. Si firmas con una clave de prueba hoy, y mañana cambias a la definitiva, Android arrojará el error `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, forzando al usuario a desinstalar la app y **perder absolutamente todos sus datos locales** (apuntes, finanzas, etc.).
2. **Protección Extrema de la Clave:**
   - La pérdida del Keystore o de sus contraseñas significa la muerte comercial del proyecto: es matemáticamente imposible enviar una actualización legítima sin él.
   - Debe respaldarse en hardware físico offline (USBs cifrados) y bóvedas en la nube de alta seguridad.
   - Las contraseñas (Store Password, Key Password, Alias) NUNCA se escriben en el código. Se manejan exclusivamente como Variables de Entorno (`.env`) en la máquina de compilación local del desarrollador.
3. **Transición Segura a Google Play (Play App Signing):**
   - Cuando las aplicaciones se publiquen en Google Play Store (ej. a nombre de la futura LLC corporativa), Google intentará por defecto firmar los APKs con una clave nueva generada por ellos (*Google Play App Signing*).
   - **⚠️ REGLA ESTRICTA (ANTI-PÉRDIDA DE DATOS):** Se debe **RECHAZAR** la opción por defecto de Google. Se debe elegir la opción avanzada de *"Exportar y subir una clave desde un Java Keystore"* (usando la herramienta PEPK). Esto obliga a Google a usar el mismo `release.keystore` original de la distribución web, garantizando que los usuarios que descargaron el APK manual puedan actualizar desde la Play Store sin sufrir un choque de firmas y perder sus datos locales.

### D. Sistema de Actualizaciones "Over-The-Air" (OTA) Privado (Implementación Pendiente)

Dado que la distribución inicial es 100% independiente a través del portal web (sin Google Play Store), los APKs instalados quedan "huérfanos" y no se auto-actualizan. Para solucionar esto sin violar la filosofía *Privacy by Design* usando SDKs de rastreo (como AppCenter o CodePush), se construirá un mecanismo de **Ping Estático**.

**Flujo del Sistema (A implementar en la siguiente fase):**
1. **Lado Web (El Host):** En la carpeta `public/` del proyecto web Astro (`apps/web`), se alojará un archivo estático público llamado `versions.json` que mapee cada app con su última versión y link de descarga directo.
2. **Lado App (El Cliente):** El componente compartido `SettingsModal4All` incluirá una función asíncrona simple que haga un `fetch('GET')` a `https://[DOMINIO-WEB]/versions.json`.
3. **Privacidad Garantizada:** Al ser una simple petición de lectura a un archivo de texto estático plano, no se envía la IP, ni correos, ni telemetría a servidores de terceros.
4. **Experiencia de Usuario:** Si la versión del JSON es mayor a la `Constants.expoConfig.version` de la app instalada, aparecerá un botón discreto en los ajustes alertando: *"Nueva versión disponible (vX.X). Toca para actualizar"*.

### E. Certificación Anti-Bloqueo (Android Developer Verification)

A partir de septiembre de 2026, Google Play Protect introdujo bloqueos estrictos a nivel de sistema operativo para APKs instalados fuera de la tienda oficial (Sideloading) si provienen de desarrolladores "desconocidos". Esto afecta directamente la distribución primaria de 4All a través de la web oficial.

**Acción Obligatoria:**
1. **Registro Inmediato:** El desarrollador debe registrar su identidad (personal o empresarial, según la fase del proyecto) en la **Android Developer Console** (plataforma independiente de Google Play Console).
2. **Vinculación de Firmas:** En esta consola, se debe vincular la huella digital criptográfica (SHA-256 del `release.keystore` definitivo) a la identidad verificada.
3. **Garantía de Supervivencia:** Al completar este proceso, Google Play Protect reconocerá los APKs descargados desde `apps4all.com` como seguros, evitando que el sistema operativo lance advertencias rojas de "App Peligrosa" o bloquee la instalación por completo en los teléfonos de los usuarios.
- **Script de Verificación Criptográfica (`apksigner`):** Automatización de validación previa al despliegue que verifica la firma APK v2/v3/v4 y la huella digital SHA-256 de los binarios generados (`scripts/verify-keystore.ps1` para Windows y `scripts/verify-keystore.sh` para CI/CD).

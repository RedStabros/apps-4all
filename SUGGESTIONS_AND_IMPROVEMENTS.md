# Auditoría Técnica y Propuestas de Mejora - Ecosistema 4All 🚀

Este documento consolida la auditoría de código realizada sobre las 14 aplicaciones móviles y el portal web, junto con una hoja de ruta de sugerencias, mejoras y nuevas funcionalidades potenciales para ser evaluadas antes y después del lanzamiento oficial.

---

## 1. Hallazgos Críticos de la Auditoría y Correcciones Aplicadas

Durante la revisión profunda del monorepositorio se identificaron y solucionaron los siguientes problemas:

### 🔴 Conflicto Crítico de Archivo de Entrada (`App.js` vs `App.tsx`)
- **Problema:** En las 14 aplicaciones móviles coexistían dos archivos de entrada: `App.js` (la plantilla en blanco generada por defecto al crear el proyecto con Expo) y `App.tsx` (el código real y completo de cada app). Debido a que `index.js` importa `./App`, el empaquetador Metro resolvía prioritariamente `App.js` (por orden de extensión estándar `.js` antes de `.tsx`), provocando que cualquier app arrancara en una pantalla blanca vacía.
- **Acción ejecutada:** Se eliminaron de forma automatizada todos los archivos residuales `App.js` en las 14 carpetas de `apps/`, garantizando que Metro y las compilaciones de EAS utilicen `App.tsx` de manera inequívoca.

### 🟡 Mock Residual de Nube en Apuntes 4All
- **Problema:** En `apps/apuntes-4all/src/screens/HomeScreen.tsx` continuaba visible un interruptor con el texto `"Online (Supabase Mock)"`. Esto contradecía la directriz de la Fase 1 (100% Local-First).
- **Acción ejecutada:** Se removió la tarjeta de sincronización simulada, dejando la interfaz limpia y consistente con `zip-4all`.

### ♿ Accesibilidad (A11y) Ampliada
- **Problema:** Múltiples botones que solo contenían íconos (linterna y congelar en `lupa-4all`, reset e info en `enfoque-4all`, grabar/reproducir/compartir/eliminar en `notas-voz-4all`, nueva carpeta y eliminar en `apuntes-4all`) no tenían etiquetas para lectores de pantalla.
- **Acción ejecutada:** Se inyectaron atributos `accessible={true}`, `accessibilityRole="button"` y `accessibilityLabel` con traducciones en todos estos controles.

---

## 2. Sugerencias de Funcionalidades e Implementaciones por Aplicación

A continuación se presentan propuestas de alto valor organizadas por categoría semántica para evaluar su inclusión futura (Fase 1.1 o Fase 2):

---

### ⏱️ Categoría: Tiempo y Cálculo (Acento Ámbar)

#### 1. Festivos Colombia 4All (✅ IMPLEMENTADO)
* [x] **Exportar a Calendario Nativo:** Integrado con `expo-calendar`. Permite al usuario sincronizar en un solo toque todos los festivos del año en su calendario nativo (Google Calendar / Apple Calendar) de forma 100% offline.
* [x] **Widget / Contador Regresivo:** Tarjeta destacada dinámica en la parte superior que detecta el festivo más próximo y calcula la cuenta regresiva en tiempo real (*"¡Hoy es festivo!"*, *"¡Mañana!"* o *"Faltan X días"*), indicando la bandera y fecha.
* [x] **Soporte Multipaís:** Barra de filtros rápidos con chips horizontales interactivos para conmutar festivos de Colombia 🇨🇴, México 🇲🇽, Argentina 🇦🇷, España 🇪🇸, Chile 🇨🇱, Perú 🇵🇪 y EE.UU. 🇺🇸, con selector visual completo y códigos ISO personalizados en Configuración.

#### 2. Azar 4All (✅ IMPLEMENTADO)
* [x] **Respuesta Háptica (`expo-haptics`):** Vibraciones físicas y hápticas integradas al lanzar dados, girar monedas, extraer números o sortear integrantes.
* [x] **Divisor de Equipos / Grupos:** Modo dedicado para barajar participantes y dividirlos de forma equilibrada en 2, 3 o 4 equipos con cabeceras y colores diferenciados.
* [x] **Ruleta de la Suerte Visual:** Ruleta animada interactiva con puntero indicador superior, interpolación angular de 360° y parada fluida sobre el ítem ganador.

#### 3. Cuentas 4All (✅ IMPLEMENTADO)
* [x] **Consumo Individualizado (Quién comió qué):** Modo de desglose por platos/bebidas con asignación individual o compartida entre comensales, distribuyendo proporcionalmente la propina y los impuestos para exportar por WhatsApp.
* [x] **Redondeo Inteligente de Efectivo:** Selector de redondeo configurable (Exacto, $10, $100, $500, $1.000) para eliminar fricción al pagar en efectivo.
* [x] **Selector Rápido de Divisas:** Conmutador en cabecera con soporte para `$`, `€`, `£`, `R$` y `Bs`.

#### 4. Enfoque 4All (Pomodoro) (✅ IMPLEMENTADO)
* [x] **Generador de Ruido Blanco / Sonidos Ambientales Offline:** Barra horizontal con conmutadores de ambiente (Silencio 🔕, Lluvia 🌧️, Ruido Blanco 📻, Olas de Mar 🌊, Café ☕) para aislamiento acústico durante el trabajo.
* [x] **Intervalos Personalizables:** Modal de ajuste para configurar a gusto los minutos de Enfoque, Descanso Corto y Descanso Largo.
* [x] **Matriz de Hábitos / Racha:** Gráfica de consistencia de los últimos 7 días con niveles de intensidad de color (estilo GitHub) y cálculo automático de la racha de días consecutivos activos.

---

### 🛠️ Categoría: Utilidades (Acento Turquesa)

#### 5. Medidas 4All (✅ IMPLEMENTADO)
* [x] **Ampliación de Unidades:** Integrada la categoría de **Almacenamiento Digital** (B, KB, MB, GB, TB, PB), además de nuevas unidades como Tazas (`cup`), Pintas (`pt`), Nudos (`kn`) y Pulgadas Cuadradas (`in²`).
* [x] **Botón de Inversión Instantánea (↔️):** Botón central flotante con diseño ergonómico y respuesta táctil para invertir origen y destino de inmediato.
* [x] **Copiar Resultado al Portapapeles:** Botón directo integrado con `expo-clipboard` que copia el valor numérico junto a su unidad y confirma con un indicador visual ("¡Copiado!").

#### 6. QR 4All (✅ IMPLEMENTADO)
* [x] **Generador Multiformato (10 Modos Especializados):** Interfaz táctil basada en plantillas especializadas para Enlaces (URL), Wi-Fi (SSID/clave con autoconexión), WhatsApp con mensaje directo, Contacto vCard completo, Texto plano, Correo electrónico, Llamadas telefónicas, SMS, billeteras Bitcoin y pagos PayPal.
* [x] **Guardar en Mis QR y Exportar:** Guardado en la biblioteca local del dispositivo, exportación directa a la galería de Fotos en formato PNG (`expo-media-library`) y compartir nativo (`expo-sharing`).
* [x] **Sincronización en la Nube Opt-in:** Interruptor opcional que respalda y sincroniza la colección con la cuenta del usuario mediante Supabase sin vulnerar la privacidad ni romper el funcionamiento 100% offline.
* [x] **Escanear desde Galería y Cámara:** Decodificación visual con la cámara trasera en tiempo real y soporte para importar capturas de pantalla o fotos desde el carrete (`expo-image-picker`).

#### 7. Lupa y Linterna 4All (✅ IMPLEMENTADO)
* [x] **Filtros de Alto Contraste para Accesibilidad:** Capa óptica de accesibilidad con filtros intercambiables: Natural, Amarillo/Negro (estándar internacional de baja visión), Invertido y Escala de Grises nítida para prospectos médicos.
* [x] **Guardar Captura Congelada:** Botón directo integrado con `expo-media-library` que guarda la toma congelada en alta definición en el carrete de Fotos del teléfono.

#### 8. Fotos Ligeras 4All (✅ IMPLEMENTADO)
* [x] **Deslizador Comparativo Antes / Después:** Comparador visual interactivo en tiempo real con pantalla dividida (0% a 100%) que muestra la calidad y el ahorro exacto de peso (ej. *"Original: 5.2 MB ➔ Comprimida: 710 KB (-86%)"*).
* [x] **Perfiles Predefinidos de Uso:** Botones rápidos de un solo toque: *"Para WhatsApp"*, *"Para Correo (<2MB)"*, *"Máximo Ahorro"* y *"Alta Calidad"*, con control fino opcional de calidad y dimensiones.

#### 9. ZIP 4All (✅ IMPLEMENTADO)
* [x] **Visualizador Previo de Archivos Extraídos:** Modal interactivo para previsualizar imágenes (`.png`, `.jpg`, `.webp`) y leer archivos de texto plano o código (`.txt`, `.json`, `.csv`, `.md`, `.log`) con visor integrado antes de compartirlos.
* [x] **Tarjeta de Rendimiento de Compresión:** Tarjeta de métricas instantáneas que calcula el tamaño original acumulado, el peso final del archivo ZIP y el porcentaje de reducción de espacio obtenido.

---

### 💼 Categoría: Productividad (Acento Azul)

#### 10. Notas de Voz 4All (✅ IMPLEMENTADO)
* [x] **Renombrado de Grabaciones:** Edición personalizada del nombre de las grabaciones para clasificarlas con claridad (`Entrevista`, `Clase`, etc.).
* [x] **Velocidad de Reproducción Variable:** Selector directo de velocidad a 1.0x, 1.5x o 2.0x mediante `expo-av`.
* [x] **Recortador de Audio Local:** Modal interactivo para recortar segundos de inicio o final y omitir silencios de grabación.

#### 11. Apuntes 4All (✅ IMPLEMENTADO)
* [x] **Buscador de Texto en Tiempo Real:** Barra de búsqueda global en la pantalla principal para filtrar instantáneamente entre títulos y contenido de notas.
* [x] **Exportación y Respaldo Local:** Botón directo para generar y compartir un archivo `.json` con todas las notas y carpetas.
* [x] **Bloqueo Biométrico de Carpeta Privada:** Protección con Face ID / Huella Dactilar mediante `expo-local-authentication` antes de abrir carpetas privadas.

#### 12. Seguridad 4All (✅ IMPLEMENTADO)
* [x] **Desbloqueo Biométrico de la Bóveda:** Acceso seguro con Huella / Face ID para visualizar las contraseñas guardadas en el almacenamiento seguro local.
* [x] **Medidor de Fuerza y Entropía en Tiempo Real:** Indicador visual de complejidad en bits con estimación de tiempo de fuerza bruta (*"Inquebrantable - Millones de años"*).
* [x] **Notas de Expiración / Renovación:** Recordatorio configurable (30, 90 o 180 días) con etiquetas de caducidad visuales en la bóveda.

#### 13. PDF 4All (✅ IMPLEMENTADO)
* [x] **Reorganización y Giro de Páginas:** Herramienta para girar todas las páginas 90° en sentido horario de forma 100% offline con `pdf-lib`.
* [x] **Marca de Agua Textual Offline:** Estampado diagonal semitransparente personalizable (*"CONFIDENCIAL"*, *"COPIA"*).
* [x] **Extracción de Páginas:** Selector flexible de rangos de páginas (ej. `1, 3, 5-7`) para generar un nuevo PDF.

#### 14. Docs 4All (✅ IMPLEMENTADO)
* [x] **Buscador de Texto dentro del Documento:** Barra de búsqueda en tiempo real con resaltado visual de palabras clave tanto en párrafos Word (.docx) como en celdas de Excel (.xlsx).
* [x] **Navegador de Hojas en Libros de Excel:** Barra inferior con pestañas interactivas para alternar entre todas las hojas del libro de trabajo.
* [x] **Exportar a PDF:** Conversión e impresión de documentos y tablas a formato PDF estándar mediante `expo-print` y `expo-sharing`.

---

## 3. Mejoras para el Portal Web (`apps/web`) y DevOps

1. **Demos Interactivas en la Web:** Como las utilidades matemáticas (`Azar`, `Cuentas`, `Medidas`) son lógica pura de TypeScript, pueden compilarse como componentes Astro interactivos directamente en la página web para que los visitantes las prueben desde el navegador antes de descargar el APK.
2. **Automatización de Builds en GitHub Actions:** Configurar un flujo de CI/CD que genere los APKs de Android de forma automática cada vez que se cree un tag de versión (`v1.0.0`) y los adjunte a las Releases de GitHub.
3. **Página de Preguntas Frecuentes (FAQ):** Sección en la web que resuelva inquietudes sobre por qué las apps son 100% gratis, cómo funcionan sin conexión y cómo se garantiza la privacidad.

// appsData.ts — Fuente de verdad para las 15 aplicaciones del ecosistema 4All en la web
export interface AppFeature {
  title: string;
  description: string;
  icon: string;
}

export interface AppManualStep {
  step: number;
  title: string;
  description: string;
}

export interface AppPermission {
  name: string;
  usage: string;
}

export interface AppTechnicalSpec {
  label: string;
  value: string;
}

export interface AppData {
  slug: string;
  name: string;
  category: 'productivity' | 'utilities' | 'time-math';
  iconUrl: string;
  apkUrl: string;
  hasAccountOption: boolean;
  tagline: {
    es: string;
    en: string;
  };
  summary: {
    es: string;
    en: string;
  };
  accountBadge: {
    es: string;
    en: string;
  };
  accountExplanation: {
    es: string;
    en: string;
  };
  features: {
    es: AppFeature[];
    en: AppFeature[];
  };
  manualSteps: {
    es: AppManualStep[];
    en: AppManualStep[];
  };
  permissions: {
    es: AppPermission[];
    en: AppPermission[];
  };
  technicalSpecs: AppTechnicalSpec[];
}

export const APPS_DATA: AppData[] = [
  // ─────────────────────────────────────────────
  // PRODUCTIVIDAD (Acento Azul)
  // ─────────────────────────────────────────────
  {
    slug: 'apuntes-4all',
    name: 'Apuntes 4All',
    category: 'productivity',
    iconUrl: '/icons/apuntes-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/apuntes-4all/releases/latest',
    hasAccountOption: true,
    tagline: {
      es: 'Bloc de notas ultrarrápido con carpetas biométricas y listas interactivas.',
      en: 'Fast, local notepad with biometric folders and interactive checklists.',
    },
    summary: {
      es: 'Captura notas, listas de compras y pendientes al instante sin conexión, con opción de cifrado biométrico y respaldo en la nube.',
      en: 'Capture notes, shopping lists, and to-dos instantly offline with biometric lock and optional cloud backup.',
    },
    accountBadge: {
      es: 'Cuenta Opcional (Nube)',
      en: 'Optional Account (Cloud)',
    },
    accountExplanation: {
      es: 'La aplicación opera al 100% de manera local y offline sin crear ninguna cuenta. Si decides iniciar sesión en tu cuenta 4All, tus notas, carpetas y listas se sincronizarán voluntariamente entre tus dispositivos.',
      en: 'The app works 100% locally and offline without any account. If you choose to log into your 4All account, your notes, folders, and lists will optionally sync across your devices.',
    },
    features: {
      es: [
        { title: 'Búsqueda Global en Tiempo Real', description: 'Encuentra cualquier nota o palabra clave en milisegundos a medida que escribes.', icon: '🔍' },
        { title: 'Carpetas Privadas con Biometría', description: 'Protege notas confidenciales mediante Huella Dactilar o Face ID (Secure Enclave local).', icon: '🔒' },
        { title: 'Listas de Chequeo Interactivas', description: 'Crea tareas con casillas marcables, tachado dinámico y contador de progreso.', icon: '✅' },
        { title: 'Exportación y Respaldo JSON', description: 'Genera copias de seguridad portátiles que puedes restaurar o compartir libremente.', icon: '📦' },
        { title: 'Notas Fijadas', description: 'Mantén tus notas más prioritarias siempre en la parte superior del cuaderno.', icon: '📌' },
      ],
      en: [
        { title: 'Real-time Global Search', description: 'Find any note or keyword in milliseconds as you type.', icon: '🔍' },
        { title: 'Biometric Private Folders', description: 'Protect confidential notes using Fingerprint or Face ID locally.', icon: '🔒' },
        { title: 'Interactive Checklists', description: 'Create tasks with checkboxes, dynamic strikethrough, and progress count.', icon: '✅' },
        { title: 'JSON Export & Backup', description: 'Generate portable backups you can restore or share freely.', icon: '📦' },
        { title: 'Pinned Notes', description: 'Keep your most important notes always on top of your notepad.', icon: '📌' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Crear una Nota o Lista', description: 'Toca el botón "+" en la pantalla principal. Elige entre texto enriquecido o lista de tareas con casillas.' },
        { step: 2, title: 'Organizar en Carpetas', description: 'Asigna categorías para trabajo, finanzas o personal. Puedes bloquear cualquier carpeta con tu huella digital.' },
        { step: 3, title: 'Exportar o Sincronizar', description: 'Guarda un archivo de respaldo en tu teléfono o activa la sincronización en Ajustes si tienes cuenta 4All.' },
      ],
      en: [
        { step: 1, title: 'Create a Note or List', description: 'Tap the "+" button on the home screen. Choose between plain text or task checklists.' },
        { step: 2, title: 'Organize into Folders', description: 'Assign categories for work, finance, or personal notes. Lock any folder with your fingerprint.' },
        { step: 3, title: 'Export or Sync', description: 'Save a backup file to your phone or enable sync in Settings if you have a 4All account.' },
      ],
    },
    permissions: {
      es: [
        { name: 'Biometría (Huella / Face ID)', usage: 'Acceso exclusivo y local para desbloquear carpetas privadas (ninguna clave sale del dispositivo).' },
        { name: 'Almacenamiento Local', usage: 'Guardar y exportar archivos de respaldo estructurados en JSON.' },
      ],
      en: [
        { name: 'Biometrics (Fingerprint / Face ID)', usage: 'Exclusive local access to unlock private folders (no biometric data ever leaves your device).' },
        { name: 'Local Storage', usage: 'Save and export structured JSON backup files.' },
      ],
    },
    technicalSpecs: [
      { label: 'Procesamiento', value: '100% Local en CPU' },
      { label: 'Almacenamiento', value: 'AsyncStorage + expo-secure-store' },
      { label: 'Formato de Backup', value: 'JSON estructurado' },
      { label: 'Sincronización Nube', value: 'Opcional (Supabase Client)' },
    ],
  },
  {
    slug: 'seguridad-4all',
    name: 'Seguridad 4All',
    category: 'productivity',
    iconUrl: '/icons/seguridad-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/seguridad-4all/releases/latest',
    hasAccountOption: true,
    tagline: {
      es: 'Generador de contraseñas de alta entropía y bóveda criptográfica local.',
      en: 'High-entropy password generator and encrypted local vault.',
    },
    summary: {
      es: 'Genera claves matemáticamente seguras, mide su entropía en bits y almacena credenciales protegidas con biometría.',
      en: 'Generate mathematically secure passwords, measure bit entropy, and store biometric-protected credentials.',
    },
    accountBadge: {
      es: 'Cuenta Opcional (Nube)',
      en: 'Optional Account (Cloud)',
    },
    accountExplanation: {
      es: 'Toda la generación y cifrado de claves ocurre en tu procesador. Si deseas respaldo opcional en la nube, la bóveda se transmite cifrada de extremo a extremo sin que nadie más pueda leer tus secretos.',
      en: 'All password generation and encryption happens on your CPU. If you enable optional cloud backup, the vault is transmitted end-to-end encrypted so only you can read your secrets.',
    },
    features: {
      es: [
        { title: 'Medidor de Entropía Matemática', description: 'Cálculo exacto de bits de seguridad y estimación de tiempo para hackeo por fuerza bruta.', icon: '⚡' },
        { title: 'Bóveda con Clave y Biometría', description: 'Guarda contraseñas bajo el hardware seguro de Android KeyStore / Apple Keychain.', icon: '🛡️' },
        { title: 'Alertas de Caducidad', description: 'Configura ciclos de renovación (30, 90 o 180 días) con etiquetas visuales de expiración.', icon: '⏳' },
        { title: 'Filtros Personalizados', description: 'Control de longitud, mayúsculas, minúsculas, números y caracteres especiales no ambiguos.', icon: '🎛️' },
      ],
      en: [
        { title: 'Mathematical Entropy Meter', description: 'Exact bit security calculation and brute-force time estimation.', icon: '⚡' },
        { title: 'Biometric Encrypted Vault', description: 'Store passwords under Android KeyStore / Apple Keychain hardware.', icon: '🛡️' },
        { title: 'Expiration Alerts', description: 'Set renewal cycles (30, 90, 180 days) with visual expiration labels.', icon: '⏳' },
        { title: 'Custom Character Filters', description: 'Control length, uppercase, lowercase, numbers, and unambiguous symbols.', icon: '🎛️' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Definir Criterios', description: 'Ajusta la longitud deseada y selecciona qué tipos de caracteres incluir.' },
        { step: 2, title: 'Generar y Copiar', description: 'Presiona "Generar". El medidor te indicará si la clave es "Inquebrantable" y podrás copiarla al portapapeles con limpieza automática.' },
        { step: 3, title: 'Guardar en la Bóveda', description: 'Asigna un título (ej: "Banco", "Correo") y almacénala protegida con tu huella digital.' },
      ],
      en: [
        { step: 1, title: 'Set Criteria', description: 'Adjust the desired length and choose which character sets to include.' },
        { step: 2, title: 'Generate & Copy', description: 'Press "Generate". The meter indicates strength and lets you copy it securely.' },
        { step: 3, title: 'Save to Vault', description: 'Name the entry (e.g. "Bank", "Email") and save it under biometric lock.' },
      ],
    },
    permissions: {
      es: [
        { name: 'Biometría (expo-local-authentication)', usage: 'Desbloquear la bóveda cifrada en el dispositivo.' },
        { name: 'Almacén Seguro (expo-secure-store)', usage: 'Persistencia de claves criptográficas en el chip de seguridad local.' },
      ],
      en: [
        { name: 'Biometrics (expo-local-authentication)', usage: 'Unlock the local encrypted vault on the device.' },
        { name: 'Secure Storage (expo-secure-store)', usage: 'Persist cryptographic keys inside the local hardware security chip.' },
      ],
    },
    technicalSpecs: [
      { label: 'Cálculo de Entropía', value: 'E = L * log2(N)' },
      { label: 'Cifrado de Bóveda', value: 'AES-256 Hardware-backed' },
      { label: 'Protección', value: 'KeyStore / Keychain' },
      { label: 'Nube', value: 'Opcional Cifrada Zero-Knowledge' },
    ],
  },
  {
    slug: 'pdf-4all',
    name: 'PDF 4All',
    category: 'productivity',
    iconUrl: '/icons/pdf-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/pdf-4all/releases/latest',
    hasAccountOption: false,
    tagline: {
      es: 'Suite integral de herramientas PDF en tu dispositivo sin subir archivos a la web.',
      en: 'Complete on-device PDF utility suite without uploading files to the web.',
    },
    summary: {
      es: 'Visualiza, escanea fotos a PDF, une documentos, extrae páginas, rota y coloca marcas de agua 100% offline.',
      en: 'View, scan photos to PDF, merge documents, extract pages, rotate, and watermark 100% offline.',
    },
    accountBadge: {
      es: '100% Sin Cuenta',
      en: '100% No Account',
    },
    accountExplanation: {
      es: 'Esta aplicación no requiere ni utiliza cuentas de ningún tipo. Toda la manipulación de documentos PDF ocurre localmente en la memoria de tu dispositivo para máxima privacidad.',
      en: 'This app does not require or use accounts of any kind. All PDF document manipulation happens locally on your device memory for complete privacy.',
    },
    features: {
      es: [
        { title: 'Fotos y Cámara a PDF', description: 'Captura documentos con la cámara o selecciona imágenes y genera un PDF multipágina.', icon: '📸' },
        { title: 'Unir Documentos PDF', description: 'Fusiona dos o más archivos PDF en un solo documento consolidado en segundos.', icon: '📑' },
        { title: 'Extraer Páginas Específicas', description: 'Extrae hojas individuales o intervalos (ej: 1, 3, 5-7) generando un nuevo archivo.', icon: '✂️' },
        { title: 'Rotar Páginas 90°', description: 'Corrige la orientación de documentos escaneados al revés con rotación matemática limpia.', icon: '🔄' },
        { title: 'Marca de Agua Offline', description: 'Estampa texto diagonal personalizado (ej: "CONFIDENCIAL", "COPIA") con opacidad regulable.', icon: '🏷️' },
      ],
      en: [
        { title: 'Photos to PDF', description: 'Capture documents with your camera or select images to build a multi-page PDF.', icon: '📸' },
        { title: 'Merge PDF Documents', description: 'Combine two or more PDF files into a single consolidated document in seconds.', icon: '📑' },
        { title: 'Extract Specific Pages', description: 'Extract individual pages or ranges (e.g. 1, 3, 5-7) into a new file.', icon: '✂️' },
        { title: 'Rotate Pages 90°', description: 'Fix orientation on misaligned scanned documents cleanly.', icon: '🔄' },
        { title: 'Offline Watermark', description: 'Stamp custom diagonal text (e.g. "CONFIDENTIAL") with adjustable opacity.', icon: '🏷️' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Seleccionar la Herramienta', description: 'Elige entre Escanear a PDF, Unir, Extraer, Rotar o Marca de Agua.' },
        { step: 2, title: 'Cargar Archivos Locales', description: 'Selecciona los documentos o imágenes directamente del almacenamiento de tu teléfono.' },
        { step: 3, title: 'Procesar y Compartir', description: 'El archivo se procesa en el CPU y queda listo para abrir, compartir o guardar en tu carpeta de descargas.' },
      ],
      en: [
        { step: 1, title: 'Select Tool', description: 'Choose between Scan to PDF, Merge, Extract, Rotate, or Watermark.' },
        { step: 2, title: 'Pick Local Files', description: 'Select documents or images directly from your phone storage.' },
        { step: 3, title: 'Process & Share', description: 'The file is processed in CPU and ready to open, share, or save to your downloads.' },
      ],
    },
    permissions: {
      es: [
        { name: 'Cámara (DocumentScanner)', usage: 'Capturar fotografías de documentos físicos para convertirlas a PDF.' },
        { name: 'Almacenamiento Local', usage: 'Leer los archivos PDF seleccionados y guardar los documentos procesados.' },
      ],
      en: [
        { name: 'Camera (DocumentScanner)', usage: 'Capture physical documents to convert into PDF.' },
        { name: 'Local Storage', usage: 'Read selected PDF files and save processed documents.' },
      ],
    },
    technicalSpecs: [
      { label: 'Motor PDF', value: 'pdf-lib (Vectorial Local)' },
      { label: 'Visor', value: 'Nativo SO (IntentLauncher / QuickLook)' },
      { label: 'Subida a Servidores', value: '0% (Cero servidores remotos)' },
      { label: 'Cuentas', value: 'No requerida' },
    ],
  },
  {
    slug: 'docs-4all',
    name: 'Docs 4All',
    category: 'productivity',
    iconUrl: '/icons/docs-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/docs-4all/releases/latest',
    hasAccountOption: false,
    tagline: {
      es: 'Visor ultraligero y seguro para documentos Word y hojas de cálculo Excel.',
      en: 'Ultralight, secure offline viewer for Word documents and Excel spreadsheets.',
    },
    summary: {
      es: 'Abre archivos .docx y .xlsx al instante, navega entre pestañas de cálculo, busca texto y exporta a PDF sin software pesado.',
      en: 'Open .docx and .xlsx files instantly, switch spreadsheet sheets, search text, and export to PDF without heavy office suites.',
    },
    accountBadge: {
      es: '100% Sin Cuenta',
      en: '100% No Account',
    },
    accountExplanation: {
      es: 'Esta app funciona 100% desconectada y no cuenta con opción de registro. Abre tus archivos directamente en la memoria local con protección contra desbordamiento.',
      en: 'This app works 100% disconnected with zero account requirements. It reads your files directly in local memory with overflow protection.',
    },
    features: {
      es: [
        { title: 'Buscador de Texto en Vivo', description: 'Encuentra y resalta palabras clave al instante en documentos Word y celdas de Excel.', icon: '🔎' },
        { title: 'Navegador de Hojas en Excel', description: 'Alterna fluidamente entre las distintas pestañas de un libro de cálculo (.xlsx).', icon: '📊' },
        { title: 'Exportación a PDF Estándar', description: 'Convierte cualquier documento o tabla abierta a formato PDF mediante el motor nativo.', icon: '🖨️' },
        { title: 'Escudo de Memoria (10 MB)', description: 'Protección preventiva que evita bloqueos del sistema ante archivos excesivamente pesados.', icon: '🛡️' },
      ],
      en: [
        { title: 'Live Text Search', description: 'Instantly find and highlight keywords in Word paragraphs and Excel cells.', icon: '🔎' },
        { title: 'Excel Sheet Navigator', description: 'Seamlessly switch between multiple sheets in any workbook (.xlsx).', icon: '📊' },
        { title: 'Standard PDF Export', description: 'Convert any opened document or table to PDF using the native engine.', icon: '🖨️' },
        { title: 'Memory Shield (10 MB)', description: 'Protects device RAM from crashing on oversized files.', icon: '🛡️' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Abrir Documento', description: 'Pulsa "Abrir archivo" y selecciona tu documento Word (.docx) o Excel (.xlsx).' },
        { step: 2, title: 'Navegar y Buscar', description: 'Explora el contenido con scroll fluido. Usa la barra de búsqueda para saltar a datos específicos.' },
        { step: 3, title: 'Imprimir o Exportar', description: 'Presiona el botón de exportación para generar una copia en PDF lista para enviar.' },
      ],
      en: [
        { step: 1, title: 'Open Document', description: 'Tap "Open File" and choose your Word (.docx) or Excel (.xlsx) file.' },
        { step: 2, title: 'Navigate & Search', description: 'Scroll smoothly and use the search bar to locate specific text or cells.' },
        { step: 3, title: 'Print or Export', description: 'Tap export to generate a clean PDF copy ready to share.' },
      ],
    },
    permissions: {
      es: [
        { name: 'Almacenamiento de Archivos', usage: 'Seleccionar y abrir documentos desde las carpetas del teléfono.' },
      ],
      en: [
        { name: 'File Storage', usage: 'Pick and read documents from phone storage folders.' },
      ],
    },
    technicalSpecs: [
      { label: 'Formatos Soportados', value: '.docx, .xlsx' },
      { label: 'Renderizado', value: 'XML / Sheet Parser local' },
      { label: 'Exportación', value: 'expo-print (PDF nativo)' },
      { label: 'Cuentas', value: 'No requerida' },
    ],
  },
  {
    slug: 'notas-voz-4all',
    name: 'Notas de Voz 4All',
    category: 'productivity',
    iconUrl: '/icons/notas-voz-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/notas-voz-4all/releases/latest',
    hasAccountOption: true,
    tagline: {
      es: 'Grabadora de alta fidelidad sin límites con segundo plano y control de velocidad.',
      en: 'Unlimited high-fidelity voice recorder with background audio and speed control.',
    },
    summary: {
      es: 'Graba reuniones y notas con pantalla apagada en formato M4A/AAC, ajusta la velocidad de reproducción y recorta silencios.',
      en: 'Record meetings with the screen off in M4A/AAC format, change playback speed, and trim pauses.',
    },
    accountBadge: {
      es: 'Cuenta Opcional (Nube)',
      en: 'Optional Account (Cloud)',
    },
    accountExplanation: {
      es: 'Puedes grabar, recortar y almacenar todas tus notas de voz de forma local y offline. Si inicias sesión en tu cuenta 4All, puedes respaldar opcionalmente tus audios y títulos en tu espacio en la nube.',
      en: 'You can record, trim, and store all your voice notes locally offline. If you sign into your 4All account, you can optionally back up audio files and titles to cloud storage.',
    },
    features: {
      es: [
        { title: 'Grabación con Pantalla Apagada', description: 'Permite grabar horas continuas sin interrupciones ni sobrecalentamiento del teléfono.', icon: '🎙️' },
        { title: 'Velocidad de Escucha Variable', description: 'Acelera la reproducción a 1.0x, 1.5x o 2.0x manteniendo el tono de voz natural.', icon: '⏩' },
        { title: 'Recortador de Silencios Local', description: 'Ajusta el segundo de inicio y fin para quedarte solo con la parte importante del audio.', icon: '✂️' },
        { title: 'Renombrado de Grabaciones', description: 'Asigna títulos descriptivos para organizar tus entrevistas, clases o ideas.', icon: '🏷️' },
      ],
      en: [
        { title: 'Screen-off Background Recording', description: 'Record continuous hours without interruptions or screen drain.', icon: '🎙️' },
        { title: 'Variable Playback Speed', description: 'Speed up listening to 1.0x, 1.5x, or 2.0x while preserving natural pitch.', icon: '⏩' },
        { title: 'Local Silence Trimmer', description: 'Adjust start and end points to extract only the key audio section.', icon: '✂️' },
        { title: 'Custom Naming', description: 'Assign descriptive titles to organize interviews, lectures, or memos.', icon: '🏷️' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Grabar', description: 'Toca el botón rojo del micrófono. Puedes apagar la pantalla o minimizar la app; la grabación continuará activa.' },
        { step: 2, title: 'Reproducir y Editar', description: 'Accede a la lista de grabaciones, ajusta la velocidad o recorta los segundos vacíos.' },
        { step: 3, title: 'Compartir o Respaldar', description: 'Exporta el archivo de audio directamente por cualquier aplicación o respalda con tu cuenta 4All.' },
      ],
      en: [
        { step: 1, title: 'Record', description: 'Tap the red mic button. You can lock the screen or minimize the app; recording continues.' },
        { step: 2, title: 'Play & Edit', description: 'Access the recording list, tweak playback speed, or trim silent sections.' },
        { step: 3, title: 'Share or Backup', description: 'Export the audio file directly or back it up with your 4All account.' },
      ],
    },
    permissions: {
      es: [
        { name: 'Micrófono (expo-av)', usage: 'Capturar el audio ambiental durante las grabaciones.' },
        { name: 'Servicio en Segundo Plano', usage: 'Mantener la grabación activa con la pantalla bloqueada.' },
      ],
      en: [
        { name: 'Microphone (expo-av)', usage: 'Capture ambient sound during voice recordings.' },
        { name: 'Foreground/Background Service', usage: 'Keep recording active with screen locked.' },
      ],
    },
    technicalSpecs: [
      { label: 'Formato de Audio', value: 'M4A (AAC ultra-eficiente)' },
      { label: 'Segundo Plano', value: 'staysActiveInBackground: true' },
      { label: 'Límite de Duración', value: 'Sin límites artificiales' },
      { label: 'Sincronización', value: 'Opcional (Supabase Storage)' },
    ],
  },

  // ─────────────────────────────────────────────
  // UTILIDADES (Acento Turquesa)
  // ─────────────────────────────────────────────
  {
    slug: 'qr-4all',
    name: 'QR 4All',
    category: 'utilities',
    iconUrl: '/icons/qr-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/qr-4all/releases/latest',
    hasAccountOption: true,
    tagline: {
      es: 'Generador y escáner de códigos QR con personalización visual y logos.',
      en: 'QR code generator & scanner with advanced visual styling and central logos.',
    },
    summary: {
      es: 'Crea códigos QR con colores, gradientes, marcos y logotipos con redundancia Nivel H, escanea con cámara o desde fotos.',
      en: 'Generate QR codes with colors, gradients, frames, and logos at Level H error correction, scan via camera or photos.',
    },
    accountBadge: {
      es: 'Cuenta Opcional (Nube)',
      en: 'Optional Account (Cloud)',
    },
    accountExplanation: {
      es: 'El escaneo y la generación con estilos funcionan 100% sin conexión. Puedes guardar tus códigos en el historial local, o iniciar sesión para sincronizar tus códigos QR entre múltiples dispositivos.',
      en: 'Scanning and styled generation work 100% offline. You can save codes to your local history or sign in to sync your saved QR codes across devices.',
    },
    features: {
      es: [
        { title: '10 Formatos Estructurados', description: 'Wi-Fi, URL, WhatsApp, Contactos vCard, Teléfono, Email, SMS, Bitcoin, PayPal y Texto.', icon: '🌐' },
        { title: 'Colores y Gradientes Bi-Tono', description: 'Elige colores sólidos de alto contraste o gradientes vibrantes (Aurora, Sunset, Forest, Golden, Cyber).', icon: '🎨' },
        { title: 'Logos Centrales (Presets o Galería)', description: 'Inserta iconos vectoriales o tu propio logo desde fotos con recorte 1:1.', icon: '🖼️' },
        { title: 'Marcos con Llamado a la Acción', description: 'Templates visuales ("¡Escanéame!", "Conéctate") con texto editable en vivo.', icon: '🏷️' },
        { title: 'Redundancia Nivel "H" Automática', description: 'Eleva al 30% la corrección de errores al añadir logos o marcos para escaneo infalible.', icon: '🛡️' },
        { title: 'Escáner Doble', description: 'Decodifica al instante con la cámara y linterna o leyendo capturas de pantalla de tu galería.', icon: '📷' },
      ],
      en: [
        { title: '10 Structured Formats', description: 'Wi-Fi, URL, WhatsApp, vCard Contacts, Phone, Email, SMS, Bitcoin, PayPal, and Text.', icon: '🌐' },
        { title: 'Colors & Bi-tone Gradients', description: 'Pick high-contrast solids or vibrant gradients (Aurora, Sunset, Forest, Golden, Cyber).', icon: '🎨' },
        { title: 'Central Logos (Presets or Photos)', description: 'Insert native SVG icons or your custom logo cropped 1:1 from photos.', icon: '🖼️' },
        { title: 'Call-to-Action Frames', description: 'Visual templates ("Scan Me", "Connect") with live editable captions.', icon: '🏷️' },
        { title: 'Automatic Level "H" Redundancy', description: 'Boosts error correction to 30% when logos or frames are added.', icon: '🛡️' },
        { title: 'Dual Scanner', description: 'Decode instantly using live camera with flash or screenshots from your photo gallery.', icon: '📷' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Elegir Tipo de Contenido', description: 'En la pestaña "Contenido", selecciona el formato (ej. Wi-Fi o WhatsApp) e introduce los datos.' },
        { step: 2, title: 'Personalizar el Diseño', description: 'Pasa a la pestaña "Diseño": selecciona colores o gradientes, añade un logo central y elige un marco con texto.' },
        { step: 3, title: 'Guardar o Compartir', description: 'Descarga la tarjeta en alta definición PNG en tu galería o compártela directamente por chat.' },
      ],
      en: [
        { step: 1, title: 'Choose Content Type', description: 'In the "Content" tab, pick the format (e.g. Wi-Fi or WhatsApp) and enter information.' },
        { step: 2, title: 'Customize Design', description: 'Switch to the "Design" tab: pick colors, gradients, add a center logo, and pick a CTA frame.' },
        { step: 3, title: 'Save or Share', description: 'Download high-definition PNG to your gallery or share it directly.' },
      ],
    },
    permissions: {
      es: [
        { name: 'Cámara (expo-camera)', usage: 'Escanear códigos QR y códigos de barra en vivo.' },
        { name: 'Galería (expo-media-library / expo-image-picker)', usage: 'Escanear QR desde fotos, cargar logotipos y guardar imágenes generadas.' },
      ],
      en: [
        { name: 'Camera (expo-camera)', usage: 'Scan live QR codes and barcodes.' },
        { name: 'Photo Gallery', usage: 'Scan QR from photos, upload custom logos, and save generated codes.' },
      ],
    },
    technicalSpecs: [
      { label: 'Renderizado', value: 'Vectorial SVG (react-native-svg)' },
      { label: 'Redundancia', value: 'Reed-Solomon Level H (30%)' },
      { label: 'Exportación', value: 'PNG 1024x1024 / SVG nativo' },
      { label: 'Sincronización', value: 'Opcional (Supabase Database)' },
    ],
  },
  {
    slug: 'zip-4all',
    name: 'ZIP 4All',
    category: 'utilities',
    iconUrl: '/icons/zip-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/zip-4all/releases/latest',
    hasAccountOption: false,
    tagline: {
      es: 'Compresor y extractor de archivos con cifrado AES-256 y visor multimedia.',
      en: 'File archiver and extractor with AES-256 encryption and media viewer.',
    },
    summary: {
      es: 'Comprime carpetas y archivos, extrae archivos .zip/.rar con contraseña y previsualiza fotos o documentos sin descomprimir.',
      en: 'Compress files and folders, extract encrypted .zip/.rar archives, and preview photos or text without unzipping.',
    },
    accountBadge: {
      es: '100% Sin Cuenta',
      en: '100% No Account',
    },
    accountExplanation: {
      es: 'Esta utilidad opera al 100% en el procesador y almacenamiento local. No requiere cuentas ni transmite archivos a ningún servidor exterior.',
      en: 'This utility runs 100% on your device CPU and local storage. No accounts required, no files ever transmitted to external servers.',
    },
    features: {
      es: [
        { title: 'Cifrado Fuerte AES-256', description: 'Protege tus archivos comprimidos con contraseña segura de estándar bancario.', icon: '🔐' },
        { title: 'Visor de Fotos Integrado', description: 'Abre imágenes (.png, .jpg, .webp, .gif) directamente dentro del archivo ZIP.', icon: '🖼️' },
        { title: 'Visor de Texto y Código', description: 'Lee documentos .txt, .json, .csv, .md y logs con formato monoespaciado.', icon: '📄' },
        { title: 'Métricas de Compresión', description: 'Visualiza el peso inicial, peso final y porcentaje exacto de espacio ahorrado.', icon: '📉' },
      ],
      en: [
        { title: 'Strong AES-256 Encryption', description: 'Protect your archives with bank-grade password encryption.', icon: '🔐' },
        { title: 'Built-in Photo Viewer', description: 'Preview images (.png, .jpg, .webp, .gif) directly inside the ZIP archive.', icon: '🖼️' },
        { title: 'Text & Code Reader', description: 'Read .txt, .json, .csv, .md files and logs with monospaced styling.', icon: '📄' },
        { title: 'Compression Metrics', description: 'Check initial size, final archive size, and exact saved space percentage.', icon: '📉' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Comprimir Archivos', description: 'Selecciona fotos, documentos o carpetas de tu celular. Opcionalmente asigna una contraseña.' },
        { step: 2, title: 'Abrir un ZIP', description: 'Toca cualquier archivo .zip o .rar. Puedes inspeccionar su árbol de archivos y ver fotos sin descomprimir.' },
        { step: 3, title: 'Extraer', description: 'Elige extraer todos los archivos o solo los elementos que necesitas en tu carpeta de descargas.' },
      ],
      en: [
        { step: 1, title: 'Compress Files', description: 'Pick photos, documents, or folders from your device. Optionally add a password.' },
        { step: 2, title: 'Open an Archive', description: 'Tap any .zip or .rar file to inspect file trees and preview pictures without extraction.' },
        { step: 3, title: 'Extract', description: 'Extract all files or select individual items to save directly to downloads.' },
      ],
    },
    permissions: {
      es: [
        { name: 'Almacenamiento Local', usage: 'Lectura y escritura de archivos en carpetas públicas del dispositivo.' },
      ],
      en: [
        { name: 'Local Storage', usage: 'Read and write archive files in local folders.' },
      ],
    },
    technicalSpecs: [
      { label: 'Formatos Soportados', value: '.zip, .rar (Extracción)' },
      { label: 'Seguridad', value: 'AES-256 Bit Encryption' },
      { label: 'Visores', value: 'Imágenes + Texto monoespaciado' },
      { label: 'Cuentas', value: 'No requerida' },
    ],
  },
  {
    slug: 'fotos-ligeras-4all',
    name: 'Fotos Ligeras 4All',
    category: 'utilities',
    iconUrl: '/icons/fotos-ligeras-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/fotos-ligeras-4all/releases/latest',
    hasAccountOption: false,
    tagline: {
      es: 'Compresor y redimensionador masivo de fotos para liberar espacio en memoria.',
      en: 'Batch image compressor and resizer to free up device memory.',
    },
    summary: {
      es: 'Reduce el peso de tus fotos hasta un 90% conservando la nitidez visual, con comparador interactivo antes/después.',
      en: 'Reduce image file size by up to 90% while preserving sharpness, with an interactive before/after comparison slider.',
    },
    accountBadge: {
      es: '100% Sin Cuenta',
      en: '100% No Account',
    },
    accountExplanation: {
      es: 'La compresión se ejecuta 100% en la GPU/CPU de tu teléfono. Tus fotos privadas jamás se envían a servidores externos ni requieren cuentas.',
      en: 'Compression runs 100% on your device GPU/CPU. Your private photos are never sent to external servers and require zero accounts.',
    },
    features: {
      es: [
        { title: 'Deslizador Antes / Después', description: 'Compara interactivamente la calidad de la foto original frente a la comprimida.', icon: '🪟' },
        { title: 'Perfiles Predefinidos', description: 'Ajustes optimizados para WhatsApp, Correo (<2MB), Máximo Ahorro y Alta Calidad.', icon: '⚡' },
        { title: 'Métricas de Reducción en Tiempo Real', description: 'Comprueba el peso original (ej. 5.2 MB), el peso final (ej. 600 KB) y el % ahorrado.', icon: '📊' },
        { title: 'Álbum Dedicado en Galería', description: 'Crea automáticamente la carpeta "Fotos Ligeras" sin sobreescribir tus fotos originales.', icon: '📁' },
      ],
      en: [
        { title: 'Before/After Comparison Slider', description: 'Interactively inspect the original photo quality against the compressed version.', icon: '🪟' },
        { title: 'Smart Preset Profiles', description: 'Optimized presets for WhatsApp, Email (<2MB), Maximum Savings, and High Quality.', icon: '⚡' },
        { title: 'Live Reduction Metrics', description: 'See original size (e.g. 5.2 MB), final size (e.g. 600 KB), and exact % saved.', icon: '📊' },
        { title: 'Dedicated Album Folder', description: 'Automatically saves into "Fotos Ligeras" without overwriting your original shots.', icon: '📁' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Elegir Fotografías', description: 'Selecciona una o varias imágenes de tu carrete o galería.' },
        { step: 2, title: 'Elegir Perfil de Compresión', description: 'Selecciona "Para WhatsApp", "Para Correo" o personaliza resolución y calidad.' },
        { step: 3, title: 'Comparar y Guardar', description: 'Mueve el deslizador antes/después para verificar nitidez y pulsa Guardar.' },
      ],
      en: [
        { step: 1, title: 'Pick Photos', description: 'Select one or multiple images from your camera roll.' },
        { step: 2, title: 'Choose Preset', description: 'Select "For WhatsApp", "For Email", or customize resolution and quality.' },
        { step: 3, title: 'Compare & Save', description: 'Drag the before/after slider to confirm clarity and tap Save.' },
      ],
    },
    permissions: {
      es: [
        { name: 'Galería de Fotos (expo-media-library)', usage: 'Leer imágenes originales y guardar las copias comprimidas en un álbum dedicado.' },
      ],
      en: [
        { name: 'Photo Gallery (expo-media-library)', usage: 'Read original photos and save compressed copies into a dedicated album.' },
      ],
    },
    technicalSpecs: [
      { label: 'Motor de Procesamiento', value: 'expo-image-manipulator (CPU/GPU)' },
      { label: 'Formatos Soportados', value: 'JPG, PNG, WebP' },
      { label: 'Privacidad', value: '100% Local (Sin nube)' },
      { label: 'Cuentas', value: 'No requerida' },
    ],
  },
  {
    slug: 'lupa-4all',
    name: 'Lupa y Linterna 4All',
    category: 'utilities',
    iconUrl: '/icons/lupa-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/lupa-4all/releases/latest',
    hasAccountOption: false,
    tagline: {
      es: 'Magnificador digital con filtros de accesibilidad médica y linterna.',
      en: 'Digital magnifier with medical accessibility filters and flashlight.',
    },
    summary: {
      es: 'Lee prospectos médicos y letra pequeña con zoom hasta 4x, congelación de pantalla y filtros de contraste para baja visión.',
      en: 'Read medical prescription labels and small print with up to 4x zoom, screen freeze, and high-contrast filters.',
    },
    accountBadge: {
      es: '100% Sin Cuenta',
      en: '100% No Account',
    },
    accountExplanation: {
      es: 'Esta herramienta no utiliza internet ni cuentas. Es una utilidad de visión asistida puramente local y accesible para cualquier persona.',
      en: 'This tool uses zero internet and requires no accounts. It is a purely local assistive vision utility accessible for everyone.',
    },
    features: {
      es: [
        { title: 'Filtro Amarillo/Negro para Visión Reducida', description: 'Estándar clínico para personas con cataratas, glaucoma o degeneración macular.', icon: '👁️' },
        { title: 'Congelar Pantalla (Freeze Frame)', description: 'Pausa el sensor de video para examinar el texto sin pulso tembloroso.', icon: '❄️' },
        { title: 'Zoom Digital Suave (1x a 4x)', description: 'Aumenta el texto con deslizador táctil preciso sin perder enfoque.', icon: '🔍' },
        { title: 'Linterna Integrada', description: 'Enciende el flash LED para iluminar menús en restaurantes oscuros o etiquetas.', icon: '🔦' },
      ],
      en: [
        { title: 'Yellow/Black Accessibility Filter', description: 'Clinical standard for users with cataracts, glaucoma, or macular degeneration.', icon: '👁️' },
        { title: 'Freeze Frame', description: 'Pause live camera feed to inspect text comfortably without hand shake.', icon: '❄️' },
        { title: 'Smooth 1x to 4x Zoom', description: 'Enlarge small text with a tactile slider while maintaining focus.', icon: '🔍' },
        { title: 'Built-in Torch', description: 'Turn on LED flash to illuminate menus in dim restaurants or fine print.', icon: '🔦' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Apuntar al Texto', description: 'Apunta la cámara al texto o prospecto que deseas leer.' },
        { step: 2, title: 'Ajustar Zoom y Linterna', description: 'Desliza el control de aumento hasta alcanzar el tamaño deseado y activa la luz si es necesario.' },
        { step: 3, title: 'Congelar y Aplicar Filtros', description: 'Toca "Congelar" para sostener la imagen quieta y prueba los filtros de alto contraste.' },
      ],
      en: [
        { step: 1, title: 'Aim at Text', description: 'Point camera at the medicine label or fine print you need to read.' },
        { step: 2, title: 'Adjust Zoom & Flash', description: 'Slide zoom control to desired size and toggle torch if lighting is dim.' },
        { step: 3, title: 'Freeze & Filter', description: 'Tap "Freeze" to hold the frame steady and switch through high-contrast filters.' },
      ],
    },
    permissions: {
      es: [
        { name: 'Cámara (expo-camera)', usage: 'Sensor de video en vivo para magnificación y control del LED de la linterna.' },
        { name: 'Galería de Fotos', usage: 'Opcional para guardar capturas congeladas.' },
      ],
      en: [
        { name: 'Camera (expo-camera)', usage: 'Live video sensor for optical zoom and flashlight control.' },
        { name: 'Photo Gallery', usage: 'Optional to save frozen frame captures.' },
      ],
    },
    technicalSpecs: [
      { label: 'Niveles de Zoom', value: '1.0x a 4.0x continuo' },
      { label: 'Filtros Ópticos', value: 'Natural, Amarillo/Negro, Invertido, B&N' },
      { label: 'Operación', value: '100% Offline' },
      { label: 'Cuentas', value: 'No requerida' },
    ],
  },
  {
    slug: 'reproductor-4all',
    name: 'Reproductor 4All',
    category: 'utilities',
    iconUrl: '/icons/reproductor-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/reproductor-4all/releases/latest',
    hasAccountOption: true,
    tagline: {
      es: 'Reproductor audiófilo sin conexión con motor C++ Oboe y ecualizador paramétrico.',
      en: 'Audiophile offline music player with C++ Google Oboe and parametric 5-band EQ.',
    },
    summary: {
      es: 'Audio de ultra-baja latencia con filtros Biquad IIR, decodificación nativa de FLAC/MP3 y perfiles automáticos por Bluetooth.',
      en: 'Ultra-low latency audio with Biquad IIR filters, native FLAC/MP3 hardware decoding, and automatic Bluetooth EQ profiles.',
    },
    accountBadge: {
      es: 'Cuenta Opcional (Nube)',
      en: 'Optional Account (Cloud)',
    },
    accountExplanation: {
      es: 'La reproducción, ecualización y lectura de tus canciones locales opera al 100% offline. Con una cuenta 4All opcional, puedes sincronizar tus listas de reproducción y perfiles de ecualización favoritos entre teléfonos.',
      en: 'Playback, 5-band EQ, and library reading work 100% offline. With an optional 4All account, you can sync your playlists and custom equalizer presets across phones.',
    },
    features: {
      es: [
        { title: 'Motor de Audio C++ Google Oboe', description: 'Flujo de audio profesional de ultra-baja latencia conectado a AAudio / OpenSL ES.', icon: '🎵' },
        { title: 'Ecualizador Paramétrico de 5 Bandas', description: 'Filtros Biquad IIR en tiempo real con suavizado anti-chasquidos (anti-zipper).', icon: '🎚️' },
        { title: 'Decodificación Nativa por Hardware', description: 'Lee FLAC, MP3, M4A y WAV directamente en el chip DSP sin librerías virales.', icon: '⚡' },
        { title: 'Segundo Plano y Bluetooth Automático', description: 'Foreground Service con controles en pantalla de bloqueo y cambio automático de EQ al conectar audífonos.', icon: '🎧' },
      ],
      en: [
        { title: 'C++ Google Oboe Audio Engine', description: 'Professional ultra-low latency audio stream connected to AAudio / OpenSL ES.', icon: '🎵' },
        { title: '5-Band Parametric Equalizer', description: 'Real-time Biquad IIR filters with anti-zipper smoothing for crisp acoustics.', icon: '🎚️' },
        { title: 'Native Hardware Decoding', description: 'Decodes FLAC, MP3, M4A, and WAV directly on device DSP without viral libraries.', icon: '⚡' },
        { title: 'Background Service & Bluetooth Profiles', description: 'Foreground service with lockscreen controls and auto-EQ profile on headphone connection.', icon: '🎧' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Cargar tu Música', description: 'La app detecta automáticamente tus archivos de música locales (FLAC, MP3, M4A).' },
        { step: 2, title: 'Ajustar el Ecualizador', description: 'Abre el panel de EQ de 5 bandas: realza bajos, medios o agudos con precisión paramétrica.' },
        { step: 3, title: 'Perfiles Bluetooth', description: 'Conecta tus auriculares; la app recordará el perfil acústico configurado para ese dispositivo.' },
      ],
      en: [
        { step: 1, title: 'Load Music', description: 'The app automatically recognizes your local audio tracks (FLAC, MP3, M4A).' },
        { step: 2, title: 'Tune Equalizer', description: 'Open the 5-band EQ: tweak bass, mids, or treble with parametric precision.' },
        { step: 3, title: 'Bluetooth Profiles', description: 'Connect headphones; the app remembers the custom acoustic profile for that device.' },
      ],
    },
    permissions: {
      es: [
        { name: 'Foreground Service (Audio)', usage: 'Mantener la reproducción activa con la app minimizada y pantalla bloqueada.' },
        { name: 'Bluetooth Connect (seguro)', usage: 'Reconocer el nombre del auricular conectado para activar su perfil de ecualizador.' },
      ],
      en: [
        { name: 'Foreground Service (Audio)', usage: 'Keep playback uninterrupted while minimized and locked.' },
        { name: 'Bluetooth Connect (safe)', usage: 'Recognize connected headphone identifier to switch EQ profiles.' },
      ],
    },
    technicalSpecs: [
      { label: 'Motor C++', value: 'Google Oboe (Apache 2.0)' },
      { label: 'Arquitectura Buffer', value: 'Lock-Free SPSC Ring Buffer' },
      { label: 'Formatos Soportados', value: 'FLAC, MP3, AAC, M4A, WAV' },
      { label: 'Ecualizador', value: '5 Bandas Paramétricas Biquad IIR' },
    ],
  },

  // ─────────────────────────────────────────────
  // TIEMPO Y MATEMÁTICAS (Acento Ámbar)
  // ─────────────────────────────────────────────
  {
    slug: 'enfoque-4all',
    name: 'Enfoque 4All',
    category: 'time-math',
    iconUrl: '/icons/enfoque-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/enfoque-4all/releases/latest',
    hasAccountOption: true,
    tagline: {
      es: 'Temporizador Pomodoro antidesfase con ambientes sonoros y rachas.',
      en: 'Drift-free Pomodoro timer with ambient sounds and streak tracking.',
    },
    summary: {
      es: 'Mejora tu concentración con sesiones de trabajo y descanso, sonidos de lluvia o café, y matriz de constancia estilo GitHub.',
      en: 'Boost productivity with work/break sessions, offline ambient noise (rain, coffee shop), and GitHub-style streak grids.',
    },
    accountBadge: {
      es: 'Cuenta Opcional (Nube)',
      en: 'Optional Account (Cloud)',
    },
    accountExplanation: {
      es: 'El temporizador, sonidos de concentración y registro de rachas operan 100% de manera local. Con una cuenta 4All opcional, puedes sincronizar tus estadísticas de productividad y rachas entre tus dispositivos.',
      en: 'Timer, ambient concentration sounds, and streak tracking run 100% locally. With an optional 4All account, you can sync productivity stats and streak records across devices.',
    },
    features: {
      es: [
        { title: 'Temporizador con Precisión Absoluta', description: 'Sincronizado con AppState para evitar desfaces cuando el celular entra en reposo.', icon: '⏱️' },
        { title: 'Ambientes Sonoros Offline', description: 'Audio para concentración en bucle (Lluvia, Olas de Mar, Café, Ruido Blanco).', icon: '🌧️' },
        { title: 'Matriz de Consistencia y Racha', description: 'Visualizador de constancia estilo cuadrícula de GitHub que registra días consecutivos.', icon: '🟩' },
        { title: 'Intervalos Flexibles', description: 'Personaliza la duración de trabajo (ej. 25 min), descanso corto (5 min) y largo (15 min).', icon: '⚙️' },
      ],
      en: [
        { title: 'Drift-free Timer Precision', description: 'Synced with AppState to eliminate timing lag during phone sleep.', icon: '⏱️' },
        { title: 'Offline Ambient Soundscapes', description: 'Looping focus audio (Rain, Ocean Waves, Cafe, White Noise).', icon: '🌧️' },
        { title: 'Consistency Grid & Streaks', description: 'GitHub-style productivity matrix mapping your consecutive focus days.', icon: '🟩' },
        { title: 'Flexible Intervals', description: 'Customize focus blocks (e.g. 25m), short breaks (5m), and long rests (15m).', icon: '⚙️' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Elegir Ambiente', description: 'Selecciona silencio o tu sonido relajante preferido (lluvia, mar, café).' },
        { step: 2, title: 'Iniciar Sesión', description: 'Presiona "Comenzar". Enfócate en una sola tarea hasta que suene la alarma local.' },
        { step: 3, title: 'Descansar y Revisar Racha', description: 'Toma tu descanso programado y observa cómo se ilumina tu cuadrícula de productividad.' },
      ],
      en: [
        { step: 1, title: 'Pick Ambient Sound', description: 'Choose silence or soothing soundscapes (rain, waves, coffee shop).' },
        { step: 2, title: 'Start Focus', description: 'Tap "Start". Focus on a single task until the local chime sounds.' },
        { step: 3, title: 'Rest & Check Streak', description: 'Take your scheduled break and watch your productivity grid light up.' },
      ],
    },
    permissions: {
      es: [
        { name: 'Notificaciones Locales (expo-notifications)', usage: 'Avisar cuando finaliza una sesión de enfoque o descanso (sin push remoto).' },
      ],
      en: [
        { name: 'Local Notifications (expo-notifications)', usage: 'Alert when a focus or break interval concludes (no remote push).' },
      ],
    },
    technicalSpecs: [
      { label: 'Precisión', value: 'AppState Delta Drift-Free' },
      { label: 'Notificaciones', value: '100% Locales en dispositivo' },
      { label: 'Sonidos', value: 'Archivos de audio AAC embebidos' },
      { label: 'Sincronización', value: 'Opcional (Supabase Database)' },
    ],
  },
  {
    slug: 'cuentas-4all',
    name: 'Cuentas 4All',
    category: 'time-math',
    iconUrl: '/icons/cuentas-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/cuentas-4all/releases/latest',
    hasAccountOption: false,
    tagline: {
      es: 'Calculadora de propinas y división de cuentas para restaurantes.',
      en: 'Tip calculator and bill splitter with itemized restaurant tabs.',
    },
    summary: {
      es: 'Divide la cuenta entre comensales, calcula propinas al instante, desglosa "quién comió qué" y redondea efectivo.',
      en: 'Split bills among dinner guests, calculate tips in real time, itemize "who ordered what", and round cash.',
    },
    accountBadge: {
      es: '100% Sin Cuenta',
      en: '100% No Account',
    },
    accountExplanation: {
      es: 'Herramienta de cálculo instantáneo puramente local. No requiere registro, no recopila datos de gastos y funciona sin conexión.',
      en: 'Purely local instant math tool. Requires zero registration, collects no spending data, and works fully offline.',
    },
    features: {
      es: [
        { title: 'División Equitativa Inmediata', description: 'Calcula el porcentaje de propina (0% al 30%) y el costo por persona en tiempo real.', icon: '🧾' },
        { title: 'Consumo Individualizado ("Quién comió qué")', description: 'Asigna platos específicos a comensales y reparte propinas proporcionalmente.', icon: '👥' },
        { title: 'Redondeo Inteligente de Efectivo', description: 'Aproxima al $10, $100, $500 o $1.000 más cercano para facilitar el cambio en efectivo.', icon: '🪙' },
        { title: 'Selector de Divisas', description: 'Cambia instantáneamente de símbolo monetario ($, €, £, R$, Bs).', icon: '💱' },
      ],
      en: [
        { title: 'Instant Bill Splitting', description: 'Calculate tips (0% to 30%) and cost per diner in real time.', icon: '🧾' },
        { title: 'Itemized Breakdown ("Who ate what")', description: 'Assign specific meals to friends and distribute taxes/tips proportionally.', icon: '👥' },
        { title: 'Smart Cash Rounding', description: 'Rounds to the nearest $10, $100, or $1,000 to simplify cash change.', icon: '🪙' },
        { title: 'Currency Switcher', description: 'Instantly toggle currency symbols ($, €, £, R$, Bs).', icon: '💱' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Ingresar Total y Comensales', description: 'Escribe el monto total de la cuenta y el número de personas en la mesa.' },
        { step: 2, title: 'Ajustar Propina y Redondeo', description: 'Elige el porcentaje de propina con un toque y activa el redondeo si pagan en efectivo.' },
        { step: 3, title: 'Desglose Detallado', description: 'Si algunos comensales consumieron platos diferentes, usa el modal individual para dar la cifra exacta a cada uno.' },
      ],
      en: [
        { step: 1, title: 'Enter Total & Guests', description: 'Type the total check amount and the number of people at the table.' },
        { step: 2, title: 'Adjust Tip & Rounding', description: 'Tap your tip percentage and toggle cash rounding if paying in physical bills.' },
        { step: 3, title: 'Itemize Breakdown', description: 'If guests ordered distinct items, use the individual modal for custom diner totals.' },
      ],
    },
    permissions: {
      es: [
        { name: 'Ninguno requerido', usage: 'No solicita acceso a cámara, contactos ni red.' },
      ],
      en: [
        { name: 'None Required', usage: 'No access requested to camera, contacts, or network.' },
      ],
    },
    technicalSpecs: [
      { label: 'Cálculo Matemático', value: 'IEEE 754 con corrección de redondeo' },
      { label: 'Persistencia', value: 'Memoria de última sesión' },
      { label: 'Operación', value: '100% Offline' },
      { label: 'Cuentas', value: 'No requerida' },
    ],
  },
  {
    slug: 'medidas-4all',
    name: 'Medidas 4All',
    category: 'time-math',
    iconUrl: '/icons/medidas-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/medidas-4all/releases/latest',
    hasAccountOption: false,
    tagline: {
      es: 'Conversor universal de unidades físicas y almacenamiento digital.',
      en: 'Universal offline converter for physical units and digital storage.',
    },
    summary: {
      es: 'Convierte longitud, peso, temperatura, volumen culinario y almacenamiento digital (Bytes a Petabytes) al instante.',
      en: 'Instantly convert length, weight, temperature, cooking volume, and digital storage (Bytes to Petabytes).',
    },
    accountBadge: {
      es: '100% Sin Cuenta',
      en: '100% No Account',
    },
    accountExplanation: {
      es: 'Utilidad matemática 100% desconectada. No solicita cuentas, no contiene anuncios y realiza todas las conversiones en milisegundos.',
      en: '100% offline mathematical utility. No accounts requested, no ads, performs all conversions in milliseconds.',
    },
    features: {
      es: [
        { title: 'Almacenamiento Digital', description: 'Bytes, Kilobytes, Megabytes, Gigabytes, Terabytes y Petabytes (base 10 y base 2).', icon: '💾' },
        { title: 'Unidades Culinarias y Volumen', description: 'Litros, Mililitros, Galones, Onzas líquidas y Tazas de cocina.', icon: '🍳' },
        { title: 'Magnitudes Físicas', description: 'Longitud (mm a km, pulgadas, pies), Masa (gramos, libras, kilos), Temperatura y Velocidad.', icon: '📐' },
        { title: 'Inversión Rápida (↔️)', description: 'Intercambia unidades de entrada y salida con un solo toque.', icon: '🔄' },
      ],
      en: [
        { title: 'Digital Storage', description: 'Bytes, Kilobytes, Megabytes, Gigabytes, Terabytes, and Petabytes.', icon: '💾' },
        { title: 'Cooking Volume Units', description: 'Liters, Milliliters, Gallons, Fluid Ounces, and Recipe Cups.', icon: '🍳' },
        { title: 'Physical Dimensions', description: 'Length (mm to km, inches, feet), Mass (grams, pounds, kg), Temperature, and Speed.', icon: '📐' },
        { title: 'Quick Swap (↔️)', description: 'Swap input and output units with a single tap.', icon: '🔄' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Elegir Categoría', description: 'Selecciona la magnitud: Longitud, Masa, Almacenamiento, Temperatura o Volumen.' },
        { step: 2, title: 'Escribir Valor', description: 'Escribe el número a convertir; el resultado se calcula en tiempo real mientras digitas.' },
        { step: 3, title: 'Copiar Resultado', description: 'Toca el resultado para copiarlo al portapapeles con confirmación háptica.' },
      ],
      en: [
        { step: 1, title: 'Select Category', description: 'Choose dimension: Length, Weight, Storage, Temperature, or Volume.' },
        { step: 2, title: 'Type Value', description: 'Enter number to convert; result updates in real time as you type.' },
        { step: 3, title: 'Copy Result', description: 'Tap the result to copy to clipboard with haptic confirmation.' },
      ],
    },
    permissions: {
      es: [
        { name: 'Portapapeles (expo-clipboard)', usage: 'Copiar los resultados calculados.' },
      ],
      en: [
        { name: 'Clipboard (expo-clipboard)', usage: 'Copy calculated values.' },
      ],
    },
    technicalSpecs: [
      { label: 'Magnitudes', value: 'Longitud, Masa, Temp, Volumen, Velocidad, Datos' },
      { label: 'Precisión', value: 'Hasta 6 decimales dinámicos' },
      { label: 'Cálculo', value: '100% Local en CPU' },
      { label: 'Cuentas', value: 'No requerida' },
    ],
  },
  {
    slug: 'azar-4all',
    name: 'Azar 4All',
    category: 'time-math',
    iconUrl: '/icons/azar-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/azar-4all/releases/latest',
    hasAccountOption: false,
    tagline: {
      es: 'Generador de eventos aleatorios con ruleta 360°, dados, monedas y equipos.',
      en: 'Random event generator with 360° lucky wheel, dice, coin flip, and team sorter.',
    },
    summary: {
      es: 'Toma decisiones divertidas y justas: gira la ruleta animada, lanza dados poliédricos, tira monedas y divide grupos sin anuncios.',
      en: 'Make fair, fun decisions: spin the animated lucky wheel, roll polyhedral dice, flip coins, and split teams ad-free.',
    },
    accountBadge: {
      es: '100% Sin Cuenta',
      en: '100% No Account',
    },
    accountExplanation: {
      es: 'Aplicación 100% offline y libre de cuentas. Los cálculos aleatorios usan algoritmos criptográficos locales con vibración háptica.',
      en: '100% offline app with zero accounts. Random generation uses local cryptographic RNG with physical haptics.',
    },
    features: {
      es: [
        { title: 'Ruleta de la Suerte 360°', description: 'Rueda animada con física de desaceleración y aguja indicadora superior.', icon: '🎡' },
        { title: 'Divisor de Equipos Equilibrados', description: 'Ingresa nombres y repártelos en 2, 3 o 4 equipos justos al azar.', icon: '👥' },
        { title: 'Lanzador de Dados y Monedas', description: 'Animación con respuesta háptica calibrada al agitar el teléfono.', icon: '🎲' },
        { title: 'Sorteo de Números', description: 'Genera números únicos en rangos definidos sin repeticiones.', icon: '🔢' },
      ],
      en: [
        { title: '360° Lucky Wheel', description: 'Physics deceleration wheel with top pointer announcing winners.', icon: '🎡' },
        { title: 'Balanced Team Sorter', description: 'Input names and automatically balance them into 2, 3, or 4 fair groups.', icon: '👥' },
        { title: 'Dice Roller & Coin Flipper', description: 'Animated rolls with calibrated haptic feedback on shake.', icon: '🎲' },
        { title: 'Random Number Draw', description: 'Generate unique numbers in defined ranges with no duplicates.', icon: '🔢' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Elegir Modo de Juego', description: 'Selecciona entre Ruleta, Dados, Moneda, Números o Formador de Equipos.' },
        { step: 2, title: 'Configurar Opciones', description: 'Escribe los nombres de la ruleta o selecciona cuántas caras tiene tu dado.' },
        { step: 3, title: 'Tocar o Agitar', description: 'Presiona el botón de acción o agita tu teléfono para activar el sorteo.' },
      ],
      en: [
        { step: 1, title: 'Pick Game Mode', description: 'Choose between Wheel, Dice, Coin, Numbers, or Team Sorter.' },
        { step: 2, title: 'Configure Options', description: 'Enter wheel options or set the number of dice faces.' },
        { step: 3, title: 'Tap or Shake', description: 'Tap the action button or shake your phone to trigger the roll.' },
      ],
    },
    permissions: {
      es: [
        { name: 'Respuesta Háptica (expo-haptics)', usage: 'Vibraciones mecánicas de rebote al lanzar dados o girar monedas.' },
      ],
      en: [
        { name: 'Haptic Feedback (expo-haptics)', usage: 'Physical bounce vibrations on dice throws and coin flips.' },
      ],
    },
    technicalSpecs: [
      { label: 'Generador Aleatorio', value: 'Crypto-grade RNG local' },
      { label: 'Animación', value: '60fps Reanimated / SVG' },
      { label: 'Publicidad', value: 'Cero anuncios' },
      { label: 'Cuentas', value: 'No requerida' },
    ],
  },
  {
    slug: 'festivos-4all',
    name: 'Festivos Colombia 4All',
    category: 'time-math',
    iconUrl: '/icons/festivos-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/festivos-4all/releases/latest',
    hasAccountOption: false,
    tagline: {
      es: 'Calendario perpetuo de festivos con cómputo Emiliani y exportación a calendarios.',
      en: 'Perpetual holiday calendar with Emiliani rule calculations and native calendar sync.',
    },
    summary: {
      es: 'Conoce los días feriados con cuenta regresiva en vivo, soporte para 7 países y sincronización a Google/Apple Calendar en un toque.',
      en: 'Discover national holidays with live countdowns, 7-country support, and one-tap sync to Google/Apple Calendar.',
    },
    accountBadge: {
      es: '100% Sin Cuenta',
      en: '100% No Account',
    },
    accountExplanation: {
      es: 'El cálculo astronómico de feriados se realiza matemáticamente en el dispositivo. No requiere cuentas ni conexión a internet.',
      en: 'Astronomical holiday calculations run mathematically on device. Zero accounts and zero internet connection required.',
    },
    features: {
      es: [
        { title: 'Widget Contador Heroico', description: 'Indica exactamente cuántos días faltan para el próximo feriado ("Faltan 4 días").', icon: '⏰' },
        { title: 'Cálculo de la Ley Emiliani y Pascua', description: 'Cálculo perpetuo de los traslados a lunes y festividades religiosas sin fallos.', icon: '📅' },
        { title: 'Soporte Multipaís', description: 'Cambia entre Colombia 🇨🇴, México 🇲🇽, Argentina 🇦🇷, España 🇪🇸, Chile 🇨🇱, Perú 🇵🇪 y EE.UU. 🇺🇸.', icon: '🌎' },
        { title: 'Exportar al Calendario Nativo', description: 'Añade todos los festivos del año a tu Google Calendar o Apple Calendar en un toque.', icon: '📲' },
      ],
      en: [
        { title: 'Hero Countdown Widget', description: 'Shows exact days remaining until the next holiday ("4 days remaining").', icon: '⏰' },
        { title: 'Emiliani & Easter Algorithms', description: 'Perpetual mathematical calculation of Monday transfers and Easter dates.', icon: '📅' },
        { title: 'Multi-Country Support', description: 'Switch between Colombia, Mexico, Argentina, Spain, Chile, Peru, and USA.', icon: '🌎' },
        { title: 'Export to Native Calendar', description: 'Add all annual holidays to Google Calendar or Apple Calendar in one tap.', icon: '📲' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Consultar Próximo Festivo', description: 'El widget superior te saluda con el feriado más cercano y los días restantes.' },
        { step: 2, title: 'Cambiar de País', description: 'Toca la bandera superior para explorar feriados en México, España, Argentina, etc.' },
        { step: 3, title: 'Sincronizar Calendario', description: 'Presiona "Exportar al Calendario" para que los festivos aparezcan en la app de calendario de tu teléfono.' },
      ],
      en: [
        { step: 1, title: 'Check Next Holiday', description: 'The top widget immediately highlights the closest holiday and remaining days.' },
        { step: 2, title: 'Switch Country', description: 'Tap the top flag bar to explore holidays in Mexico, Spain, Argentina, etc.' },
        { step: 3, title: 'Sync Calendar', description: 'Tap "Export to Calendar" to add all national holidays to your native phone calendar.' },
      ],
    },
    permissions: {
      es: [
        { name: 'Calendario (expo-calendar)', usage: 'Permite guardar los eventos feriados en el calendario personal de Google o Apple.' },
      ],
      en: [
        { name: 'Calendar (expo-calendar)', usage: 'Allows saving holiday events to your personal Google or Apple calendar.' },
      ],
    },
    technicalSpecs: [
      { label: 'Algoritmo de Pascua', value: 'Algoritmo de Butcher / Meeus' },
      { label: 'Reglas de Traslado', value: 'Ley 51 de 1983 (Emiliani)' },
      { label: 'Países', value: '7 Países Iberoamérica + USA' },
      { label: 'Cuentas', value: 'No requerida' },
    ],
  },
];

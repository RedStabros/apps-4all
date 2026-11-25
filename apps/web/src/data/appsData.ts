// appsData.ts — Fuente de verdad para las 15 aplicaciones del ecosistema 4All en la web (v1.0.1 — 100% Offline)
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
    apkUrl: 'https://github.com/RedStabros/apps-4all/releases/download/v1.0.1/apuntes-4all-v1.0.1.apk',
    hasAccountOption: false,
    tagline: {
      es: 'Bloc de notas ultrarrápido con bóveda privada cifrada, Markdown y listas interactivas.',
      en: 'Fast, local notepad with encrypted private vault, Markdown preview, and interactive checklists.',
    },
    summary: {
      es: 'Captura notas con vista Markdown, adjunta fotos locales, crea listas de tareas y protege notas confidenciales con cifrado 256-bit y biometría, 100% offline.',
      en: 'Capture Markdown notes, attach local photos, create checklists, and lock confidential notes with 256-bit encryption and biometrics, 100% offline.',
    },
    accountBadge: {
      es: '100% Offline • Sin Cuentas',
      en: '100% Offline • No Accounts',
    },
    accountExplanation: {
      es: 'La aplicación opera al 100% de manera local y sin conexión. Tus notas, fotos adjuntas y carpetas privadas nunca salen de tu teléfono y puedes exportar o importar respaldos JSON cuando quieras.',
      en: 'The app runs 100% locally and offline. Your notes, attached photos, and private folders never leave your phone, and you can export or import JSON backups anytime.',
    },
    features: {
      es: [
        { title: 'Bóveda Privada Cifrada (256-bit)', description: 'Protege notas confidenciales con cifrado local y desbloqueo por Huella Dactilar o Face ID.', icon: '🔒' },
        { title: 'Vista Previa Markdown e Imágenes', description: 'Escribe con encabezados, negritas y listas, y adjunta fotografías guardadas en tu dispositivo.', icon: '📝' },
        { title: 'Listas de Chequeo Interactivas', description: 'Crea tareas con casillas marcables, tachado dinámico y contador de progreso.', icon: '✅' },
        { title: 'Búsqueda Global y Notas Fijadas', description: 'Encuentra cualquier nota en milisegundos y fija tus apuntes prioritarios arriba.', icon: '🔍' },
        { title: 'Respaldo y Restauración JSON', description: 'Exporta e importa copias de seguridad portátiles sin depender de servidores externos.', icon: '📦' },
      ],
      en: [
        { title: 'Encrypted Private Vault (256-bit)', description: 'Protect confidential notes with local encryption and Fingerprint or Face ID unlock.', icon: '🔒' },
        { title: 'Markdown Preview & Local Photos', description: 'Format headings, bold text, and lists, and attach images stored locally on your device.', icon: '📝' },
        { title: 'Interactive Checklists', description: 'Create tasks with checkboxes, dynamic strikethrough, and progress counter.', icon: '✅' },
        { title: 'Global Search & Pinned Notes', description: 'Find any note in milliseconds and pin priority notes at the top.', icon: '🔍' },
        { title: 'JSON Backup & Restore', description: 'Export and import portable backups with zero external servers.', icon: '📦' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Crear una Nota o Lista', description: 'Toca el botón "+" en la pantalla principal. Alterna entre editor, vista Markdown, fotos adjuntas o lista de tareas.' },
        { step: 2, title: 'Proteger en Bóveda Privada', description: 'Marca cualquier nota como privada para cifrarla localmente y requerir tu huella digital.' },
        { step: 3, title: 'Exportar o Restaurar Respaldo', description: 'Desde Ajustes genera un archivo JSON portátil o restaura una copia previa en tu nuevo teléfono.' },
      ],
      en: [
        { step: 1, title: 'Create a Note or List', description: 'Tap the "+" button on the home screen. Switch between editor, Markdown preview, photo attachments, or checklists.' },
        { step: 2, title: 'Lock in Private Vault', description: 'Mark any note as private to encrypt it locally behind your device biometrics.' },
        { step: 3, title: 'Export or Restore Backup', description: 'Generate a portable JSON backup from Settings or restore a previous copy on a new phone.' },
      ],
    },
    permissions: {
      es: [
        { name: 'Biometría (Huella / Face ID)', usage: 'Acceso exclusivo y local para desbloquear la bóveda privada.' },
        { name: 'Galería y Almacenamiento Local', usage: 'Adjuntar fotos a tus notas y exportar/importar respaldos JSON.' },
      ],
      en: [
        { name: 'Biometrics (Fingerprint / Face ID)', usage: 'Exclusive local access to unlock the private vault.' },
        { name: 'Gallery & Local Storage', usage: 'Attach photos to notes and export/import JSON backups.' },
      ],
    },
    technicalSpecs: [
      { label: 'Procesamiento', value: '100% Local en CPU' },
      { label: 'Cifrado Privado', value: '256-bit local + SecureStore' },
      { label: 'Formato de Backup', value: 'JSON portable (Importar/Exportar)' },
      { label: 'Cuentas / Nube', value: 'Ninguna (100% Offline)' },
    ],
  },
  {
    slug: 'seguridad-4all',
    name: 'Seguridad 4All',
    category: 'productivity',
    iconUrl: '/icons/seguridad-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/releases/download/v1.0.1/seguridad-4all-v1.0.1.apk',
    hasAccountOption: false,
    tagline: {
      es: 'Generador de contraseñas y frases seguras con bóveda criptográfica ilimitada.',
      en: 'High-entropy password & passphrase generator with unlimited encrypted local vault.',
    },
    summary: {
      es: 'Genera claves o frases de 128 palabras, mide entropía en bits, limpia el portapapeles en 30s y guarda usuarios y notas en una bóveda cifrada offline.',
      en: 'Generate passwords or 128-word passphrases, measure bit entropy, auto-clear clipboard in 30s, and store credentials in an offline encrypted vault.',
    },
    accountBadge: {
      es: '100% Offline • Sin Cuentas',
      en: '100% Offline • No Accounts',
    },
    accountExplanation: {
      es: 'Toda la generación, cifrado con MAC y almacenamiento de tu bóveda ocurre exclusivamente en tu dispositivo. Sin cuentas ni servidores remotos; puedes crear respaldos locales cifrados.',
      en: 'All generation, MAC-authenticated encryption, and vault storage happen exclusively on your device. No accounts or remote servers; create encrypted local backups anytime.',
    },
    features: {
      es: [
        { title: 'Generador de Claves y Frases (Passphrase)', description: 'Crea claves aleatorias de alta entropía o frases memorables con diccionario de 128 palabras.', icon: '⚡' },
        { title: 'Bóveda Ilimitada con MAC y Biometría', description: 'Almacena usuario, contraseña y notas cifradas sin límite de 2 KB, protegidas con huella/Face ID.', icon: '🛡️' },
        { title: 'Limpieza Automática del Portapapeles', description: 'Borra la contraseña copiada del portapapeles tras 30 segundos para evitar fugas.', icon: '🧹' },
        { title: 'Respaldo Local Cifrado y Caducidad', description: 'Exporta e importa tu bóveda cifrada localmente y controla ciclos de renovación (30/90/180 días).', icon: '🔐' },
      ],
      en: [
        { title: 'Password & Passphrase Generator', description: 'Generate high-entropy random passwords or memorable passphrases from a 128-word dictionary.', icon: '⚡' },
        { title: 'Unlimited MAC-Verified Biometric Vault', description: 'Store username, password, and notes with no 2 KB limit, locked via fingerprint/Face ID.', icon: '🛡️' },
        { title: '30-Second Clipboard Auto-Clear', description: 'Automatically wipes copied passwords from your clipboard after 30 seconds.', icon: '🧹' },
        { title: 'Encrypted Local Backup & Expiry Alerts', description: 'Export/import encrypted vault backups locally and track 30/90/180-day renewal cycles.', icon: '🔐' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Elegir Modo de Generación', description: 'Selecciona contraseña aleatoria o frase segura (Passphrase) y ajusta la longitud y símbolos.' },
        { step: 2, title: 'Copiar con Seguridad', description: 'El medidor calcula la entropía en bits. Al copiar, el portapapeles se limpia automáticamente a los 30 segundos.' },
        { step: 3, title: 'Guardar en la Bóveda', description: 'Registra título, usuario, clave y notas bajo llave biométrica y exporta respaldos cifrados cuando necesites.' },
      ],
      en: [
        { step: 1, title: 'Choose Generator Mode', description: 'Pick random password or memorable passphrase and adjust length and character sets.' },
        { step: 2, title: 'Copy Safely', description: 'Check bit entropy and copy securely with automatic 30-second clipboard clearing.' },
        { step: 3, title: 'Save to Vault', description: 'Store title, username, password, and notes under biometric lock and export encrypted backups.' },
      ],
    },
    permissions: {
      es: [
        { name: 'Biometría (expo-local-authentication)', usage: 'Desbloquear la bóveda cifrada en el dispositivo.' },
        { name: 'Almacén Seguro (expo-secure-store)', usage: 'Custodiar la llave maestra en el chip de seguridad local.' },
      ],
      en: [
        { name: 'Biometrics (expo-local-authentication)', usage: 'Unlock the local encrypted vault on the device.' },
        { name: 'Secure Storage (expo-secure-store)', usage: 'Protect the master key inside the hardware security chip.' },
      ],
    },
    technicalSpecs: [
      { label: 'Cálculo de Entropía', value: 'E = L * log2(N)' },
      { label: 'Cifrado de Bóveda', value: 'Stream + MAC autenticado local' },
      { label: 'Protección', value: 'Android KeyStore / iOS Keychain' },
      { label: 'Cuentas / Nube', value: 'Ninguna (100% Offline)' },
    ],
  },
  {
    slug: 'pdf-4all',
    name: 'PDF 4All',
    category: 'productivity',
    iconUrl: '/icons/pdf-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/releases/download/v1.0.1/pdf-4all-v1.0.1.apk',
    hasAccountOption: false,
    tagline: {
      es: 'Suite de 8 herramientas PDF en tu dispositivo sin subir archivos a internet.',
      en: '8-tool on-device PDF utility suite without uploading files to the web.',
    },
    summary: {
      es: 'Lee, convierte fotos a PDF, une, divide, organiza páginas, optimiza peso, rota 90° y estampa marcas de agua 100% offline.',
      en: 'Read, convert photos to PDF, merge, split, organize pages, optimize size, rotate 90°, and watermark 100% offline.',
    },
    accountBadge: {
      es: '100% Offline • Sin Cuentas',
      en: '100% Offline • No Accounts',
    },
    accountExplanation: {
      es: 'Esta aplicación no requiere ni utiliza cuentas. Toda la edición de tus documentos PDF ocurre localmente en la memoria de tu dispositivo para máxima privacidad.',
      en: 'This app requires zero accounts. All PDF document editing happens locally in your device memory for complete privacy.',
    },
    features: {
      es: [
        { title: '8 Herramientas PDF Completas', description: 'Leer, Fotos a PDF, Unir, Extraer/Dividir, Organizar Páginas, Optimizar, Rotar 90° y Marca de Agua.', icon: '🧰' },
        { title: 'Organizar y Reordenar Páginas', description: 'Reordena o elimina hojas individuales de cualquier PDF con lista visual interactiva.', icon: '📑' },
        { title: 'Optimizar y Limpiar PDF', description: 'Re-empaqueta documentos para reducir sobrecarga interna y limpiar metadatos redundantes.', icon: '⚡' },
        { title: 'Fotos y Cámara a PDF', description: 'Captura documentos con la cámara o selecciona imágenes para generar un PDF multipágina.', icon: '📸' },
        { title: 'Marca de Agua y Rotación 90°', description: 'Estampa texto diagonal personalizado con opacidad regulable y corrige páginas giradas.', icon: '🏷️' },
      ],
      en: [
        { title: '8 Complete PDF Tools', description: 'Read, Photos to PDF, Merge, Split/Extract, Organize Pages, Optimize, Rotate 90°, and Watermark.', icon: '🧰' },
        { title: 'Organize & Reorder Pages', description: 'Reorder or remove individual pages from any PDF with an interactive page list.', icon: '📑' },
        { title: 'Optimize & Clean PDF', description: 'Re-pack documents to reduce internal bloat and strip redundant structure.', icon: '⚡' },
        { title: 'Photos & Camera to PDF', description: 'Capture documents with your camera or select images to build a multi-page PDF.', icon: '📸' },
        { title: 'Watermark & 90° Rotation', description: 'Stamp custom diagonal text with adjustable opacity and fix rotated scans.', icon: '🏷️' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Seleccionar Herramienta', description: 'Elige cualquiera de las 8 herramientas desde la pantalla principal (Unir, Dividir, Organizar, Optimizar, etc.).' },
        { step: 2, title: 'Cargar Archivos Locales', description: 'Selecciona documentos PDF o imágenes directamente del almacenamiento de tu teléfono.' },
        { step: 3, title: 'Procesar y Compartir', description: 'El archivo se procesa en tu CPU y queda listo para abrir, guardar o compartir al instante.' },
      ],
      en: [
        { step: 1, title: 'Select Tool', description: 'Choose any of the 8 tools from the home screen (Merge, Split, Organize, Optimize, etc.).' },
        { step: 2, title: 'Pick Local Files', description: 'Select PDF documents or images directly from your phone storage.' },
        { step: 3, title: 'Process & Share', description: 'The file is processed on CPU and ready to view, save, or share immediately.' },
      ],
    },
    permissions: {
      es: [
        { name: 'Cámara y Galería', usage: 'Capturar o seleccionar fotografías de documentos físicos para convertirlas a PDF.' },
        { name: 'Almacenamiento Local', usage: 'Leer los archivos PDF seleccionados y guardar los documentos procesados.' },
      ],
      en: [
        { name: 'Camera & Gallery', usage: 'Capture or select photos of physical documents to convert into PDF.' },
        { name: 'Local Storage', usage: 'Read selected PDF files and save processed documents.' },
      ],
    },
    technicalSpecs: [
      { label: 'Motor PDF', value: 'pdf-lib (Vectorial Local)' },
      { label: 'Herramientas', value: '8 utilidades PDF offline' },
      { label: 'Subida a Servidores', value: '0% (Cero servidores remotos)' },
      { label: 'Cuentas / Nube', value: 'Ninguna (100% Offline)' },
    ],
  },
  {
    slug: 'docs-4all',
    name: 'Docs 4All',
    category: 'productivity',
    iconUrl: '/icons/docs-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/releases/download/v1.0.1/docs-4all-v1.0.1.apk',
    hasAccountOption: false,
    tagline: {
      es: 'Visor ultraligero y seguro para Word, Excel, CSV, Markdown y texto plano.',
      en: 'Ultralight, secure offline viewer for Word, Excel, CSV, Markdown, and plain text.',
    },
    summary: {
      es: 'Abre archivos .docx, .xlsx, .csv, .txt y .md al instante con zoom de lectura, historial de recientes, buscador y exportación a PDF.',
      en: 'Open .docx, .xlsx, .csv, .txt, and .md files instantly with reading zoom, recent history, live search, and PDF export.',
    },
    accountBadge: {
      es: '100% Offline • Sin Cuentas',
      en: '100% Offline • No Accounts',
    },
    accountExplanation: {
      es: 'Funciona 100% desconectada y sin registro. Abre tus archivos directamente en memoria local con protección preventiva contra desbordamiento.',
      en: 'Works 100% disconnected with zero accounts. Reads your files directly in local memory with overflow protection.',
    },
    features: {
      es: [
        { title: '5 Formatos sin Suites Pesadas', description: 'Lee Word (.docx), Excel (.xlsx), hojas .csv, Markdown (.md) y texto plano (.txt) offline.', icon: '📄' },
        { title: 'Zoom de Fuente y Recientes', description: 'Ajusta el tamaño de letra de 12px a 24px y reabre tus documentos recientes con un toque.', icon: '🔎' },
        { title: 'Navegador de Hojas en Excel', description: 'Alterna fluidamente entre pestañas de libros .xlsx y busca texto en vivo.', icon: '📊' },
        { title: 'Exportación a PDF y Escudo 10 MB', description: 'Imprime o exporta cualquier documento a PDF con protección de RAM en archivos grandes.', icon: '🖨️' },
      ],
      en: [
        { title: '5 Formats Without Heavy Suites', description: 'Read Word (.docx), Excel (.xlsx), .csv tables, Markdown (.md), and plain text (.txt) offline.', icon: '📄' },
        { title: 'Font Zoom & Recent History', description: 'Adjust reading font size from 12px to 24px and reopen recent documents in one tap.', icon: '🔎' },
        { title: 'Excel Sheet Navigator', description: 'Switch seamlessly between workbook sheets (.xlsx) with live keyword search.', icon: '📊' },
        { title: 'PDF Export & 10 MB Memory Shield', description: 'Export any opened document to PDF with RAM protection on oversized files.', icon: '🖨️' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Abrir Documento', description: 'Pulsa "Abrir archivo" y elige un .docx, .xlsx, .csv, .md o .txt desde tu teléfono.' },
        { step: 2, title: 'Leer, Buscar y Ajustar Zoom', description: 'Usa los botones A-/A+ para ajustar la lectura y la barra de búsqueda para saltar a datos clave.' },
        { step: 3, title: 'Exportar a PDF', description: 'Presiona el botón de exportación para generar una copia PDF lista para compartir.' },
      ],
      en: [
        { step: 1, title: 'Open Document', description: 'Tap "Open File" and pick a .docx, .xlsx, .csv, .md, or .txt file from storage.' },
        { step: 2, title: 'Read, Search & Zoom', description: 'Use A-/A+ controls to adjust text size and search bar to jump to specific content.' },
        { step: 3, title: 'Export to PDF', description: 'Tap export to generate a clean PDF copy ready to share.' },
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
      { label: 'Formatos Soportados', value: '.docx, .xlsx, .csv, .txt, .md' },
      { label: 'Zoom de Lectura', value: '12px a 24px + historial reciente' },
      { label: 'Exportación', value: 'expo-print (PDF nativo)' },
      { label: 'Cuentas / Nube', value: 'Ninguna (100% Offline)' },
    ],
  },
  {
    slug: 'notas-voz-4all',
    name: 'Notas de Voz 4All',
    category: 'productivity',
    iconUrl: '/icons/notas-voz-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/releases/download/v1.0.1/notas-voz-4all-v1.0.1.apk',
    hasAccountOption: false,
    tagline: {
      es: 'Grabadora de alta fidelidad con pausa/reanudar, categorías y recorte no destructivo.',
      en: 'High-fidelity voice recorder with pause/resume, category tags, and non-destructive trim.',
    },
    summary: {
      es: 'Graba reuniones y notas con pantalla apagada en M4A/AAC, pausa y reanuda, organiza con etiquetas, busca al instante y ajusta velocidad.',
      en: 'Record meetings with the screen off in M4A/AAC, pause and resume, organize with tags, search live, and control playback speed.',
    },
    accountBadge: {
      es: '100% Offline • Sin Cuentas',
      en: '100% Offline • No Accounts',
    },
    accountExplanation: {
      es: 'Todas tus grabaciones M4A, etiquetas y recortes se guardan exclusivamente en tu dispositivo. Sin cuentas, sin nube y sin límites artificiales de duración.',
      en: 'All your M4A recordings, category tags, and trims stay exclusively on your device. No accounts, no cloud, and no artificial time limits.',
    },
    features: {
      es: [
        { title: 'Grabación con Pausa y Pantalla Apagada', description: 'Pausa y reanuda sobre la marcha y graba horas continuas en segundo plano.', icon: '🎙️' },
        { title: 'Buscador en Vivo y Etiquetas', description: 'Clasifica tus audios por categoría (Trabajo, Personal, Ideas, Reuniones) y filtra al instante.', icon: '🏷️' },
        { title: 'Velocidad Variable (1x / 1.5x / 2x)', description: 'Acelera la escucha manteniendo el tono natural de la voz.', icon: '⏩' },
        { title: 'Recorte No Destructivo y Reinicio', description: 'Define puntos de inicio y fin sin dañar el archivo original, con botón de restablecer.', icon: '✂️' },
      ],
      en: [
        { title: 'Pause/Resume & Screen-Off Recording', description: 'Pause and resume on the fly and record continuous hours in the background.', icon: '🎙️' },
        { title: 'Live Search & Category Tags', description: 'Organize memos by category (Work, Personal, Ideas, Meetings) and filter instantly.', icon: '🏷️' },
        { title: 'Variable Speed (1x / 1.5x / 2x)', description: 'Speed up playback while preserving natural vocal pitch.', icon: '⏩' },
        { title: 'Non-Destructive Trim & Reset', description: 'Set start/end playback markers without altering the original file, with 1-tap reset.', icon: '✂️' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Grabar, Pausar y Reanudar', description: 'Toca el botón del micrófono. Puedes pausar, reanudar o apagar la pantalla sin cortar la grabación.' },
        { step: 2, title: 'Etiquetar y Buscar', description: 'Asigna título y categoría a tu nota de voz para encontrarla rápido en la lista.' },
        { step: 3, title: 'Escuchar, Recortar y Compartir', description: 'Ajusta la velocidad, marca el tramo útil y comparte el archivo M4A directamente.' },
      ],
      en: [
        { step: 1, title: 'Record, Pause & Resume', description: 'Tap the mic button. Pause, resume, or lock the screen without interrupting recording.' },
        { step: 2, title: 'Tag & Search', description: 'Assign a title and category tag to find any recording quickly.' },
        { step: 3, title: 'Play, Trim & Share', description: 'Change playback speed, set trim range, and share the M4A file directly.' },
      ],
    },
    permissions: {
      es: [
        { name: 'Micrófono (expo-av)', usage: 'Capturar el audio ambiental durante las grabaciones.' },
        { name: 'Servicio en Segundo Plano', usage: 'Mantener la grabación activa con la pantalla bloqueada.' },
      ],
      en: [
        { name: 'Microphone (expo-av)', usage: 'Capture ambient sound during voice recordings.' },
        { name: 'Background Audio Service', usage: 'Keep recording active while the screen is locked.' },
      ],
    },
    technicalSpecs: [
      { label: 'Formato de Audio', value: 'M4A (AAC ultra-eficiente)' },
      { label: 'Segundo Plano', value: 'staysActiveInBackground: true' },
      { label: 'Límite de Duración', value: 'Sin límites artificiales' },
      { label: 'Cuentas / Nube', value: 'Ninguna (100% Offline)' },
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
    apkUrl: 'https://github.com/RedStabros/apps-4all/releases/download/v1.0.1/qr-4all-v1.0.1.apk',
    hasAccountOption: false,
    tagline: {
      es: 'Generador y escáner QR con estilos, logos persistentes y respaldo JSON local.',
      en: 'QR generator & scanner with custom styling, persistent logos, and local JSON backup.',
    },
    summary: {
      es: 'Crea códigos QR estáticos en 10 formatos con gradientes, marcos y logos propios (Nivel H), escanea QR o códigos de barras y respalda tu historial offline.',
      en: 'Create static QR codes across 10 formats with gradients, frames, and custom logos (Level H), scan QR/barcodes, and back up locally.',
    },
    accountBadge: {
      es: '100% Offline • Sin Cuentas',
      en: '100% Offline • No Accounts',
    },
    accountExplanation: {
      es: 'El escáner, el estudio de diseño QR, tus logos guardados y el historial funcionan 100% offline. Puedes exportar o restaurar tu historial en JSON cuando cambies de teléfono.',
      en: 'Scanner, QR design studio, saved logos, and history work 100% offline. Export or restore your history as JSON whenever you switch phones.',
    },
    features: {
      es: [
        { title: '10 Formatos QR Estáticos', description: 'Wi-Fi, URL, WhatsApp, Contactos vCard, Teléfono, Email, SMS, Bitcoin, PayPal y Texto.', icon: '🌐' },
        { title: 'Logos SVG y Galería Persistente', description: '10 iconos vectoriales integrados o tu propio logo guardado de forma permanente en el dispositivo.', icon: '🖼️' },
        { title: 'Colores, Gradientes y Marcos CTA', description: 'Gradientes bi-tono y marcos editables con corrección automática Nivel H (30%).', icon: '🎨' },
        { title: 'Escáner "Solo QR" o "QR + Barras"', description: 'Alterna modo de lectura para evitar falsos positivos, con cámara, flash o fotos de galería.', icon: '📷' },
        { title: 'Respaldo y Restauración JSON', description: 'Exporta e importa tus códigos QR favoritos sin depender de ninguna cuenta.', icon: '📦' },
      ],
      en: [
        { title: '10 Static QR Formats', description: 'Wi-Fi, URL, WhatsApp, vCard Contacts, Phone, Email, SMS, Bitcoin, PayPal, and Text.', icon: '🌐' },
        { title: 'SVG Presets & Persistent Gallery Logos', description: '10 built-in vector icons or your own custom logo stored permanently on device.', icon: '🖼️' },
        { title: 'Colors, Gradients & CTA Frames', description: 'Bi-tone gradients and editable frames with automatic Level H (30%) redundancy.', icon: '🎨' },
        { title: '"QR Only" or "QR + Barcodes" Scanner', description: 'Toggle scan mode to avoid accidental reads, using live camera, torch, or gallery photos.', icon: '📷' },
        { title: 'Local JSON Backup & Restore', description: 'Export and import your saved QR collection with zero accounts.', icon: '📦' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Elegir Formato', description: 'En la pestaña "Contenido" selecciona el tipo (Wi-Fi, WhatsApp, vCard, etc.) e ingresa los datos.' },
        { step: 2, title: 'Diseñar Estilo y Logo', description: 'En "Diseño" elige colores o gradientes, añade un icono SVG o tu logo propio y un marco con texto.' },
        { step: 3, title: 'Guardar, Compartir o Escanear', description: 'Exporta el PNG en alta definición o usa el escáner en modo Solo QR / QR + Barras.' },
      ],
      en: [
        { step: 1, title: 'Choose Format', description: 'In "Content" pick the format (Wi-Fi, WhatsApp, vCard, etc.) and fill in the fields.' },
        { step: 2, title: 'Customize Style & Logo', description: 'In "Design" pick colors or gradients, add an SVG preset or custom logo, and a CTA frame.' },
        { step: 3, title: 'Save, Share or Scan', description: 'Export HD PNG to gallery or use the scanner in QR Only / QR + Barcodes mode.' },
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
      { label: 'Respaldo', value: 'JSON local + logos persistentes' },
      { label: 'Cuentas / Nube', value: 'Ninguna (100% Offline)' },
    ],
  },
  {
    slug: 'zip-4all',
    name: 'ZIP 4All',
    category: 'utilities',
    iconUrl: '/icons/zip-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/releases/download/v1.0.1/zip-4all-v1.0.1.apk',
    hasAccountOption: false,
    tagline: {
      es: 'Compresor y extractor ZIP con cifrado AES-256 y extracción selectiva de archivos.',
      en: 'ZIP archiver and extractor with AES-256 encryption and selective file extraction.',
    },
    summary: {
      es: 'Comprime archivos con o sin contraseña AES-256, inspecciona el contenido de un ZIP y extrae todo o solo los archivos que selecciones.',
      en: 'Compress files with or without AES-256 password, inspect archive contents, and extract everything or only selected files.',
    },
    accountBadge: {
      es: '100% Offline • Sin Cuentas',
      en: '100% Offline • No Accounts',
    },
    accountExplanation: {
      es: 'Opera al 100% en el procesador y almacenamiento local. No requiere cuentas ni transmite archivos a ningún servidor exterior.',
      en: 'Runs 100% on your device CPU and local storage. Zero accounts required and no files ever leave your phone.',
    },
    features: {
      es: [
        { title: 'Cifrado Fuerte AES-256', description: 'Protege tus archivos comprimidos con contraseña segura de estándar bancario (zip4j nativo).', icon: '🔐' },
        { title: 'Inspección y Extracción Selectiva', description: 'Lista el contenido de un archivo ZIP antes de descomprimir y elige exactamente qué archivos extraer.', icon: '📂' },
        { title: 'Visor de Fotos y Texto Integrado', description: 'Previsualiza imágenes (.jpg, .png, .webp) y textos (.txt, .json, .csv, .md) dentro del flujo local.', icon: '🖼️' },
        { title: 'Métricas de Compresión', description: 'Comprueba el peso inicial, peso final y porcentaje exacto de espacio ahorrado.', icon: '📉' },
      ],
      en: [
        { title: 'Strong AES-256 Encryption', description: 'Protect your archives with bank-grade password encryption (native zip4j).', icon: '🔐' },
        { title: 'Archive Inspection & Selective Extract', description: 'List ZIP contents before unzipping and pick only the exact files you need.', icon: '📂' },
        { title: 'Built-in Photo & Text Preview', description: 'Preview images (.jpg, .png, .webp) and text (.txt, .json, .csv, .md) locally.', icon: '🖼️' },
        { title: 'Compression Metrics', description: 'Check initial size, final archive size, and exact saved space percentage.', icon: '📉' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Comprimir Archivos', description: 'Selecciona fotos o documentos de tu celular. Opcionalmente añade una contraseña AES-256.' },
        { step: 2, title: 'Inspeccionar un ZIP', description: 'Abre cualquier archivo .zip para listar su contenido interno sin extraer archivos innecesarios.' },
        { step: 3, title: 'Extraer Todo o Selectivo', description: 'Descomprime el archivo completo o selecciona elementos individuales para guardar o compartir.' },
      ],
      en: [
        { step: 1, title: 'Compress Files', description: 'Pick photos or documents from your device. Optionally secure with an AES-256 password.' },
        { step: 2, title: 'Inspect a ZIP', description: 'Open any .zip file to browse its internal contents before extracting.' },
        { step: 3, title: 'Extract All or Selective', description: 'Unzip the entire archive or select individual entries to save or share.' },
      ],
    },
    permissions: {
      es: [
        { name: 'Almacenamiento Local', usage: 'Lectura y escritura de archivos comprimidos en carpetas del dispositivo.' },
      ],
      en: [
        { name: 'Local Storage', usage: 'Read and write archive files in local device folders.' },
      ],
    },
    technicalSpecs: [
      { label: 'Motor Nativo', value: 'zip4j (Apache 2.0) / SSZipArchive (MIT)' },
      { label: 'Seguridad', value: 'AES-256 Bit Encryption' },
      { label: 'Extracción', value: 'Completa o selectiva por archivo' },
      { label: 'Cuentas / Nube', value: 'Ninguna (100% Offline)' },
    ],
  },
  {
    slug: 'fotos-ligeras-4all',
    name: 'Fotos Ligeras 4All',
    category: 'utilities',
    iconUrl: '/icons/fotos-ligeras-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/releases/download/v1.0.1/fotos-ligeras-4all-v1.0.1.apk',
    hasAccountOption: false,
    tagline: {
      es: 'Compresor masivo de fotos con escudo de privacidad EXIF y rotación 90°.',
      en: 'Batch photo compressor with EXIF privacy shield and 90° rotation.',
    },
    summary: {
      es: 'Reduce el peso de tus fotos hasta un 90%, limpia metadatos GPS/EXIF automáticamente, rota 90° y compara nitidez antes/después.',
      en: 'Shrink photo sizes up to 90%, automatically strip GPS/EXIF metadata, rotate 90°, and compare sharpness before/after.',
    },
    accountBadge: {
      es: '100% Offline • Sin Cuentas',
      en: '100% Offline • No Accounts',
    },
    accountExplanation: {
      es: 'La compresión y limpieza de metadatos EXIF se ejecutan 100% en la GPU/CPU de tu teléfono. Tus fotos privadas jamás salen del dispositivo.',
      en: 'Compression and EXIF metadata stripping run 100% on your device GPU/CPU. Your private photos never leave your phone.',
    },
    features: {
      es: [
        { title: 'Escudo de Privacidad EXIF', description: 'Al recomprimir elimina automáticamente coordenadas GPS y datos de cámara antes de compartir.', icon: '🛡️' },
        { title: 'Rotación 90° y Comparador Visual', description: 'Gira fotos mal orientadas antes de comprimir y verifica la calidad con deslizador antes/después.', icon: '🔄' },
        { title: 'Perfiles Inteligentes por Lote', description: 'Ajustes rápidos para WhatsApp, Correo (<2MB), Máximo Ahorro y Alta Calidad.', icon: '⚡' },
        { title: 'Álbum Dedicado en Galería', description: 'Guarda en "Fotos Ligeras" sin sobreescribir nunca tus originales.', icon: '📁' },
      ],
      en: [
        { title: 'EXIF Privacy Shield', description: 'Automatically strips GPS coordinates and camera metadata upon re-encoding before sharing.', icon: '🛡️' },
        { title: '90° Rotation & Visual Slider', description: 'Rotate misaligned photos before compression and verify clarity with before/after slider.', icon: '🔄' },
        { title: 'Smart Batch Presets', description: 'One-tap presets for WhatsApp, Email (<2MB), Max Savings, and High Quality.', icon: '⚡' },
        { title: 'Dedicated Gallery Album', description: 'Saves into "Fotos Ligeras" without ever overwriting your original shots.', icon: '📁' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Elegir Fotografías', description: 'Selecciona una o varias imágenes de tu galería.' },
        { step: 2, title: 'Rotar y Elegir Perfil', description: 'Gira 90° si lo necesitas y elige WhatsApp, Correo, Máximo Ahorro o calidad manual.' },
        { step: 3, title: 'Comparar y Guardar', description: 'Comprueba el ahorro en MB, confirma la limpieza EXIF y guarda o comparte.' },
      ],
      en: [
        { step: 1, title: 'Pick Photos', description: 'Select one or multiple images from your gallery.' },
        { step: 2, title: 'Rotate & Choose Preset', description: 'Rotate 90° if needed and pick WhatsApp, Email, Max Savings, or custom quality.' },
        { step: 3, title: 'Compare & Save', description: 'Check MB savings, verify EXIF protection, and save or share.' },
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
      { label: 'Privacidad', value: 'Limpieza automática de EXIF / GPS' },
      { label: 'Formatos Soportados', value: 'JPG, PNG, WebP' },
      { label: 'Cuentas / Nube', value: 'Ninguna (100% Offline)' },
    ],
  },
  {
    slug: 'lupa-4all',
    name: 'Lupa y Linterna 4All',
    category: 'utilities',
    iconUrl: '/icons/lupa-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/releases/download/v1.0.1/lupa-4all-v1.0.1.apk',
    hasAccountOption: false,
    tagline: {
      es: 'Magnificador digital con presets 1x–4x, congelación nítida y filtros médicos.',
      en: 'Digital magnifier with 1x–4x presets, crisp freeze-frame, and medical contrast filters.',
    },
    summary: {
      es: 'Lee prospectos y letra pequeña con zoom táctil a una mano (1x/2x/3x/4x), foto congelada nítida, filtros de baja visión y linterna.',
      en: 'Read labels and fine print with one-hand 1x/2x/3x/4x zoom presets, crisp freeze-frame capture, low-vision filters, and torch.',
    },
    accountBadge: {
      es: '100% Offline • Sin Cuentas',
      en: '100% Offline • No Accounts',
    },
    accountExplanation: {
      es: 'Herramienta de visión asistida puramente local y sin internet. El permiso de galería solo se solicita bajo demanda si decides guardar una captura congelada.',
      en: 'Purely local assistive vision utility with zero internet usage. Gallery permission is requested on demand only when saving a frozen frame.',
    },
    features: {
      es: [
        { title: 'Presets de Zoom a Una Mano (1x–4x)', description: 'Salta instantáneamente a 1x, 2x, 3x o 4x o ajusta suavemente con el deslizador.', icon: '🔍' },
        { title: 'Congelación Nítida Real (Freeze Frame)', description: 'Captura un fotograma estático de alta claridad para leer sin pulso tembloroso y guardarlo si deseas.', icon: '❄️' },
        { title: 'Filtros Clínicos de Alto Contraste', description: 'Modo Amarillo/Negro, Invertido y Blanco y Negro para facilitar lectura con baja visión.', icon: '👁️' },
        { title: 'Linterna LED Integrada', description: 'Ilumina etiquetas y menús en ambientes oscuros con un solo toque.', icon: '🔦' },
      ],
      en: [
        { title: 'One-Hand Zoom Presets (1x–4x)', description: 'Jump straight to 1x, 2x, 3x, or 4x or fine-tune with the smooth slider.', icon: '🔍' },
        { title: 'Real Crisp Freeze Frame', description: 'Capture a steady high-clarity still frame to read comfortably and save on demand.', icon: '❄️' },
        { title: 'Clinical High-Contrast Filters', description: 'Yellow/Black, Inverted, and B&W modes tailored for low-vision reading.', icon: '👁️' },
        { title: 'Built-in LED Torch', description: 'Illuminate labels and dim restaurant menus with a single tap.', icon: '🔦' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Apuntar y Hacer Zoom', description: 'Apunta al texto y toca 1x, 2x, 3x o 4x (o desliza) mientras enciendes la linterna si hace falta.' },
        { step: 2, title: 'Congelar la Imagen', description: 'Toca "Congelar" para capturar una foto quieta y leer con comodidad.' },
        { step: 3, title: 'Aplicar Filtros o Guardar', description: 'Alterna filtros de contraste o guarda la captura en tu galería bajo demanda.' },
      ],
      en: [
        { step: 1, title: 'Aim & Zoom', description: 'Point at text and tap 1x, 2x, 3x, or 4x presets and toggle torch if dim.' },
        { step: 2, title: 'Freeze the Frame', description: 'Tap "Freeze" to capture a steady high-clarity frame for comfortable reading.' },
        { step: 3, title: 'Filter or Save', description: 'Switch contrast filters or save the frozen capture to your gallery on demand.' },
      ],
    },
    permissions: {
      es: [
        { name: 'Cámara (expo-camera)', usage: 'Sensor de video en vivo para magnificación y control del LED de la linterna.' },
        { name: 'Galería (Bajo demanda)', usage: 'Solicitado únicamente si presionas Guardar sobre una imagen congelada.' },
      ],
      en: [
        { name: 'Camera (expo-camera)', usage: 'Live video sensor for magnification and LED flashlight control.' },
        { name: 'Photo Gallery (On demand)', usage: 'Requested only when you tap Save on a frozen capture.' },
      ],
    },
    technicalSpecs: [
      { label: 'Niveles de Zoom', value: 'Presets 1x/2x/3x/4x + continuo' },
      { label: 'Filtros Ópticos', value: 'Natural, Amarillo/Negro, Invertido, B&N' },
      { label: 'Operación', value: '100% Offline' },
      { label: 'Cuentas / Nube', value: 'Ninguna (100% Offline)' },
    ],
  },
  {
    slug: 'reproductor-4all',
    name: 'Reproductor 4All',
    category: 'utilities',
    iconUrl: '/icons/reproductor-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/releases/download/v1.0.1/reproductor-4all-v1.0.1.apk',
    hasAccountOption: false,
    tagline: {
      es: 'Reproductor audiófilo offline con motor C++ Oboe, Android Auto y EQ de 5 bandas.',
      en: 'Audiophile offline player with C++ Google Oboe engine, Android Auto, and 5-band EQ.',
    },
    summary: {
      es: 'Audio C++ de ultra-baja latencia con soporte nativo para Android Auto, 2 modos Shuffle, filtro anti-WhatsApp, 8 presets de EQ y espectro visual.',
      en: 'Ultra-low latency C++ audio with native Android Auto support, 2 Shuffle modes, anti-WhatsApp filter, 8 EQ presets, and live EQ spectrum.',
    },
    accountBadge: {
      es: '100% Offline • Sin Cuentas',
      en: '100% Offline • No Accounts',
    },
    accountExplanation: {
      es: 'Tu biblioteca musical, carpetas, listas de reproducción y perfiles de ecualización viven 100% en tu teléfono sin cuentas, sin suscripciones y sin internet.',
      en: 'Your music library, folders, playlists, and EQ profiles live 100% on your phone with zero accounts, zero subscriptions, and zero internet.',
    },
    features: {
      es: [
        { title: 'Android Auto Nativo (MediaBrowserService)', description: 'Explora tu biblioteca y controla tu música directamente desde la pantalla del vehículo.', icon: '🚗' },
        { title: 'Motor C++ Google Oboe + EQ 5 Bandas', description: 'Filtros Biquad IIR en tiempo real con 8 presets (Parlante, Audífonos, Auto, Rock, Jazz y más) y espectro.', icon: '🎚️' },
        { title: '2 Modos Aleatorio (Sin Repetir y Azar)', description: 'Ciclo Fisher-Yates que no repite canciones en tu sesión, o modo totalmente aleatorio + Sleep Timer.', icon: '🔀' },
        { title: 'Explorador Inteligente Anti-WhatsApp', description: 'Navega por Carpetas, Canciones o Playlists filtrando automáticamente audios cortos (<30s) y notas de WhatsApp.', icon: '📁' },
      ],
      en: [
        { title: 'Native Android Auto (MediaBrowserService)', description: 'Browse your library and control playback directly from your car head unit.', icon: '🚗' },
        { title: 'C++ Google Oboe + 5-Band EQ', description: 'Real-time Biquad IIR filters with 8 presets (Speaker, Headphones, Car, Rock, Jazz, etc.) and spectrum.', icon: '🎚️' },
        { title: '2 Shuffle Modes (No-Repeat & Full Random)', description: 'Fisher-Yates no-repeat session cycle or full random playback, plus Repeat and Sleep Timer.', icon: '🔀' },
        { title: 'Smart Anti-WhatsApp Folder Explorer', description: 'Browse Folders, Songs, or Playlists while filtering out short clips (<30s) and WhatsApp voice notes.', icon: '📁' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Explorar Carpetas o Canciones', description: 'La app escanea tu música local (FLAC, MP3, M4A, WAV) ignorando notas de voz de WhatsApp y grabaciones cortas.' },
        { step: 2, title: 'Elegir Preset de EQ y Visualizador', description: 'Ajusta las 5 bandas o elige Audífonos, Parlante o Auto, y cambia entre los 3 modos visuales.' },
        { step: 3, title: 'Conectar a Bluetooth o Android Auto', description: 'Disfruta reproducción en segundo plano con controles en pantalla de bloqueo y en el tablero de tu carro.' },
      ],
      en: [
        { step: 1, title: 'Browse Folders or Tracks', description: 'Automatically scans local music (FLAC, MP3, M4A, WAV) while filtering WhatsApp voice notes.' },
        { step: 2, title: 'Pick EQ Preset & Visualizer', description: 'Tune the 5 bands or pick Headphones, Speaker, or Car presets, and switch between 3 visual modes.' },
        { step: 3, title: 'Connect Bluetooth or Android Auto', description: 'Enjoy background playback with lockscreen controls and native car head-unit integration.' },
      ],
    },
    permissions: {
      es: [
        { name: 'Audio / Almacenamiento Local', usage: 'Leer únicamente tus archivos de música locales.' },
        { name: 'Foreground Service (Audio)', usage: 'Mantener la música activa con pantalla bloqueada y Android Auto.' },
        { name: 'Bluetooth Connect', usage: 'Detectar audífonos o sistema de audio del vehículo para activar su perfil EQ.' },
      ],
      en: [
        { name: 'Local Audio Storage', usage: 'Read your local music files only.' },
        { name: 'Foreground Service (Audio)', usage: 'Keep music playing while locked and on Android Auto.' },
        { name: 'Bluetooth Connect', usage: 'Detect connected headphones or car stereo to apply matching EQ profile.' },
      ],
    },
    technicalSpecs: [
      { label: 'Motor C++', value: 'Google Oboe (Apache 2.0)' },
      { label: 'Android Auto', value: 'MediaBrowserServiceCompat nativo' },
      { label: 'Formatos Soportados', value: 'FLAC, MP3, AAC, M4A, WAV' },
      { label: 'Cuentas / Nube', value: 'Ninguna (100% Offline)' },
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
    apkUrl: 'https://github.com/RedStabros/apps-4all/releases/download/v1.0.1/enfoque-4all-v1.0.1.apk',
    hasAccountOption: false,
    tagline: {
      es: 'Temporizador Pomodoro antidesfase con etiquetas de tarea, ambientes sonoros y rachas.',
      en: 'Drift-free Pomodoro timer with task tags, ambient soundscapes, and streak tracking.',
    },
    summary: {
      es: 'Enfócate por bloques etiquetando cada sesión, escucha ambientes offline, revisa tu matriz de constancia y exporta tus estadísticas en JSON.',
      en: 'Focus in blocks with active task tags, offline ambient sounds, GitHub-style consistency grid, and JSON stats export.',
    },
    accountBadge: {
      es: '100% Offline • Sin Cuentas',
      en: '100% Offline • No Accounts',
    },
    accountExplanation: {
      es: 'El temporizador, los ambientes sonoros, el registro de sesiones y tus rachas operan 100% en tu dispositivo sin cuentas ni notificaciones push remotas.',
      en: 'Timer, ambient sounds, session logs, and streaks run 100% locally with zero accounts and zero remote push notifications.',
    },
    features: {
      es: [
        { title: 'Etiqueta de Tarea e Historial de Sesiones', description: 'Nombra en qué trabajas en cada bloque y consulta el registro de tus sesiones recientes.', icon: '🎯' },
        { title: 'Precisión Antidesfase (AppState)', description: 'Calcula el tiempo real aunque bloquees el teléfono o cambies de aplicación.', icon: '⏱️' },
        { title: 'Ambientes Sonoros Offline', description: 'Audio en bucle local (Lluvia, Olas, Café, Ruido Blanco) para concentrarte sin internet.', icon: '🌧️' },
        { title: 'Matriz de Racha y Exportación JSON', description: 'Visualiza tu constancia diaria estilo GitHub y comparte tus estadísticas locales.', icon: '🟩' },
      ],
      en: [
        { title: 'Active Task Tag & Session Log', description: 'Label what you are working on per block and review your recent completed sessions.', icon: '🎯' },
        { title: 'Drift-Free Precision (AppState)', description: 'Tracks exact elapsed time even when the screen locks or you switch apps.', icon: '⏱️' },
        { title: 'Offline Ambient Soundscapes', description: 'Looping local focus audio (Rain, Waves, Cafe, White Noise) without internet.', icon: '🌧️' },
        { title: 'Consistency Grid & JSON Export', description: 'Track daily streaks in a GitHub-style matrix and share your stats locally.', icon: '🟩' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Etiquetar Tarea y Ambiente', description: 'Escribe la tarea actual y elige silencio o un sonido relajante offline.' },
        { step: 2, title: 'Iniciar Bloque de Enfoque', description: 'Presiona "Comenzar" y trabaja sin distracciones hasta completar el intervalo.' },
        { step: 3, title: 'Revisar Racha o Exportar', description: 'Consulta tu cuadrícula de constancia y exporta tu historial en JSON cuando quieras.' },
      ],
      en: [
        { step: 1, title: 'Tag Task & Pick Sound', description: 'Enter your current task label and choose silence or an offline ambient track.' },
        { step: 2, title: 'Start Focus Block', description: 'Tap "Start" and work distraction-free until the interval completes.' },
        { step: 3, title: 'Review Streak or Export', description: 'Inspect your consistency grid and export your stats as JSON anytime.' },
      ],
    },
    permissions: {
      es: [
        { name: 'Audio y Háptica Local', usage: 'Reproducir ambientes sonoros y avisos locales al completar sesiones.' },
      ],
      en: [
        { name: 'Local Audio & Haptics', usage: 'Play ambient soundscapes and local completion chimes.' },
      ],
    },
    technicalSpecs: [
      { label: 'Precisión', value: 'AppState Delta Drift-Free' },
      { label: 'Alertas', value: '100% Locales (Cero Push)' },
      { label: 'Estadísticas', value: 'Matriz de rachas + Exportar JSON' },
      { label: 'Cuentas / Nube', value: 'Ninguna (100% Offline)' },
    ],
  },
  {
    slug: 'cuentas-4all',
    name: 'Cuentas 4All',
    category: 'time-math',
    iconUrl: '/icons/cuentas-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/releases/download/v1.0.1/cuentas-4all-v1.0.1.apk',
    hasAccountOption: false,
    tagline: {
      es: 'Calculadora de propinas, comensales guardados y platos compartidos para restaurantes.',
      en: 'Tip calculator, saved diners, and shared dish splitter for restaurants.',
    },
    summary: {
      es: 'Divide la cuenta en 1 toque con propinas 0–20%, guarda comensales, reparte platos compartidos proporcionalmente y redondea efectivo.',
      en: 'Split checks in 1 tap with 0–20% tips, save diners, split shared dishes proportionally, and round cash totals.',
    },
    accountBadge: {
      es: '100% Offline • Sin Cuentas',
      en: '100% Offline • No Accounts',
    },
    accountExplanation: {
      es: 'Herramienta de cálculo instantáneo puramente local. No requiere registro, no recopila gastos y funciona sin conexión.',
      en: 'Purely local instant math tool. Zero registration, zero spending telemetry, and 100% offline.',
    },
    features: {
      es: [
        { title: 'Propinas en 1 Toque y Stepper', description: 'Píldoras rápidas (0% a 20%) y controles −/+ para ajustar personas al instante.', icon: '🧾' },
        { title: 'Comensales y Platos Compartidos', description: 'Asigna platos individuales o compartidos entre varios amigos repartiendo la propina proporcionalmente.', icon: '👥' },
        { title: 'Redondeo Inteligente de Efectivo', description: 'Aproxima al $10, $100, $500 o $1.000 más cercano para pagar fácil en efectivo.', icon: '🪙' },
        { title: 'Selector de Divisas y Resumen', description: 'Cambia de moneda ($, €, £, R$, Bs) y comparte el desglose por chat en un toque.', icon: '💱' },
      ],
      en: [
        { title: '1-Tap Tip Pills & Stepper', description: 'Quick 0%–20% tip pills and −/+ people stepper for instant calculations.', icon: '🧾' },
        { title: 'Saved Diners & Shared Dishes', description: 'Assign individual or shared dishes across multiple friends with proportional tips.', icon: '👥' },
        { title: 'Smart Cash Rounding', description: 'Rounds to the nearest $10, $100, or $1,000 to simplify physical cash change.', icon: '🪙' },
        { title: 'Currency Switcher & Share', description: 'Toggle currency symbols ($, €, £, R$, Bs) and share the split breakdown via chat.', icon: '💱' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Ingresar Total y Comensales', description: 'Escribe el monto total y usa −/+ para elegir cuántas personas dividen la cuenta.' },
        { step: 2, title: 'Ajustar Propina y Redondeo', description: 'Toca el porcentaje de propina y activa el redondeo si pagan en efectivo.' },
        { step: 3, title: 'Platos Individuales o Compartidos', description: 'En la pestaña Detallada asigna cada plato a uno o varios comensales y comparte el resumen.' },
      ],
      en: [
        { step: 1, title: 'Enter Total & Diners', description: 'Type the bill total and use −/+ to set how many people are splitting.' },
        { step: 2, title: 'Adjust Tip & Rounding', description: 'Tap your tip percentage and enable cash rounding if paying in cash.' },
        { step: 3, title: 'Individual or Shared Dishes', description: 'In Detailed mode assign dishes to one or multiple diners and share the summary.' },
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
      { label: 'Modos', value: 'Equitativo + Comensales y Platos Compartidos' },
      { label: 'Operación', value: '100% Offline' },
      { label: 'Cuentas / Nube', value: 'Ninguna (100% Offline)' },
    ],
  },
  {
    slug: 'medidas-4all',
    name: 'Medidas 4All',
    category: 'time-math',
    iconUrl: '/icons/medidas-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/releases/download/v1.0.1/medidas-4all-v1.0.1.apk',
    hasAccountOption: false,
    tagline: {
      es: 'Conversor universal con 10 categorías físicas/digitales, favoritos y buscador.',
      en: 'Universal offline converter with 10 physical/digital categories, favorites, and search.',
    },
    summary: {
      es: 'Convierte 10 magnitudes (incluyendo Tiempo, Presión, Energía y Datos), fija conversiones favoritas y busca unidades al instante.',
      en: 'Convert across 10 categories (including Time, Pressure, Energy, and Data), pin favorite conversions, and search units instantly.',
    },
    accountBadge: {
      es: '100% Offline • Sin Cuentas',
      en: '100% Offline • No Accounts',
    },
    accountExplanation: {
      es: 'Utilidad matemática 100% desconectada. No solicita cuentas, no contiene anuncios y realiza todas las conversiones en milisegundos.',
      en: '100% offline mathematical utility. Zero accounts, zero ads, instant conversions in milliseconds.',
    },
    features: {
      es: [
        { title: '10 Categorías Completas Offline', description: 'Longitud, Masa, Temperatura, Volumen, Área, Velocidad, Datos, Tiempo, Presión y Energía.', icon: '📐' },
        { title: 'Conversiones Favoritas Fijadas', description: 'Guarda tus pares más usados (ej. °C ↔ °F o km ↔ mi) para acceder en un toque.', icon: '⭐' },
        { title: 'Buscador Rápido de Unidades', description: 'Filtra cualquier unidad por nombre o símbolo directamente dentro del selector.', icon: '🔍' },
        { title: 'Inversión Rápida y Copia Háptica', description: 'Invierte unidades (↔️) y copia resultados exactos al portapapeles en un toque.', icon: '🔄' },
      ],
      en: [
        { title: '10 Complete Offline Categories', description: 'Length, Mass, Temperature, Volume, Area, Speed, Data, Time, Pressure, and Energy.', icon: '📐' },
        { title: 'Pinned Favorite Conversions', description: 'Save your most-used pairs (e.g. °C ↔ °F or km ↔ mi) for 1-tap access.', icon: '⭐' },
        { title: 'Fast Unit Search', description: 'Filter any unit by name or symbol right inside the picker modal.', icon: '🔍' },
        { title: 'Quick Swap & Haptic Copy', description: 'Swap input/output units (↔️) and copy exact results to clipboard in one tap.', icon: '🔄' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Elegir Categoría o Favorito', description: 'Selecciona entre las 10 magnitudes o toca uno de tus pares fijados.' },
        { step: 2, title: 'Buscar Unidades y Escribir Valor', description: 'Usa el buscador del modal si necesitas una unidad específica; el cálculo es instantáneo.' },
        { step: 3, title: 'Fijar o Copiar Resultado', description: 'Toca la estrella para guardar como favorito o toca el resultado para copiarlo.' },
      ],
      en: [
        { step: 1, title: 'Pick Category or Favorite', description: 'Choose from 10 categories or tap a pinned favorite pair.' },
        { step: 2, title: 'Search Units & Type Value', description: 'Use the modal search bar to find units quickly; results update as you type.' },
        { step: 3, title: 'Pin or Copy Result', description: 'Tap the star to pin as favorite or tap the result to copy.' },
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
      { label: 'Magnitudes', value: '10 categorías (incl. Tiempo, Presión y Energía)' },
      { label: 'Precisión', value: 'Hasta 6 decimales dinámicos' },
      { label: 'Cálculo', value: '100% Local en CPU' },
      { label: 'Cuentas / Nube', value: 'Ninguna (100% Offline)' },
    ],
  },
  {
    slug: 'azar-4all',
    name: 'Azar 4All',
    category: 'time-math',
    iconUrl: '/icons/azar-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/releases/download/v1.0.1/azar-4all-v1.0.1.apk',
    hasAccountOption: false,
    tagline: {
      es: 'Ruleta 360° con opciones guardadas, dados, monedas y equipos Fisher-Yates.',
      en: '360° lucky wheel with saved options, dice, coin flip, and Fisher-Yates team sorter.',
    },
    summary: {
      es: 'Toma decisiones justas y divertidas: gira la ruleta guardando tus listas, lanza dados, tira monedas y arma equipos balanceados sin anuncios.',
      en: 'Make fair decisions: spin the wheel with persisted lists, roll dice, flip coins, and build balanced teams ad-free.',
    },
    accountBadge: {
      es: '100% Offline • Sin Cuentas',
      en: '100% Offline • No Accounts',
    },
    accountExplanation: {
      es: 'Aplicación 100% offline y sin cuentas. Tus listas de la ruleta se guardan localmente y todos los sorteos usan mezcla justa en tu dispositivo.',
      en: '100% offline app with zero accounts. Your wheel lists persist locally and all draws run fairly on your device.',
    },
    features: {
      es: [
        { title: 'Ruleta 360° con Memoria Local', description: 'Rueda animada con física suave que recuerda tus opciones entre sesiones.', icon: '🎡' },
        { title: 'Equipos Equilibrados (Fisher-Yates)', description: 'Baraja nombres con mezcla matemáticamente imparcial en 2, 3 o 4 equipos.', icon: '👥' },
        { title: 'Dados Poliédricos y Moneda', description: 'Animación fluida con respuesta háptica al tocar o agitar el teléfono.', icon: '🎲' },
        { title: 'Sorteo de Números Únicos', description: 'Genera números en rangos definidos sin repeticiones.', icon: '🔢' },
      ],
      en: [
        { title: '360° Wheel with Local Memory', description: 'Smooth physics wheel that remembers your custom options across sessions.', icon: '🎡' },
        { title: 'Balanced Teams (Fisher-Yates)', description: 'Shuffles names with unbiased Fisher-Yates algorithm into 2, 3, or 4 teams.', icon: '👥' },
        { title: 'Polyhedral Dice & Coin Flip', description: 'Smooth animations with calibrated haptic feedback on tap or shake.', icon: '🎲' },
        { title: 'Unique Number Draw', description: 'Generate unique random numbers within custom ranges with no duplicates.', icon: '🔢' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Elegir Modo de Sorteo', description: 'Selecciona entre Ruleta, Dados, Moneda, Números o Formador de Equipos.' },
        { step: 2, title: 'Configurar Opciones', description: 'Añade nombres a la ruleta (se guardan automáticamente) o elige las caras del dado.' },
        { step: 3, title: 'Tocar o Agitar', description: 'Presiona el botón de acción o agita el celular para realizar el sorteo.' },
      ],
      en: [
        { step: 1, title: 'Pick Draw Mode', description: 'Choose between Wheel, Dice, Coin, Numbers, or Team Sorter.' },
        { step: 2, title: 'Configure Options', description: 'Add wheel items (auto-saved locally) or pick dice faces.' },
        { step: 3, title: 'Tap or Shake', description: 'Tap the action button or shake your phone to trigger the draw.' },
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
      { label: 'Algoritmo', value: 'Fisher-Yates + RNG local' },
      { label: 'Animación', value: '60fps Reanimated / SVG' },
      { label: 'Publicidad', value: 'Cero anuncios' },
      { label: 'Cuentas / Nube', value: 'Ninguna (100% Offline)' },
    ],
  },
  {
    slug: 'festivos-4all',
    name: 'Festivos 4All',
    category: 'time-math',
    iconUrl: '/icons/festivos-4all.png',
    apkUrl: 'https://github.com/RedStabros/apps-4all/releases/download/v1.0.1/festivos-4all-v1.0.1.apk',
    hasAccountOption: false,
    tagline: {
      es: 'Calendario perpetuo de festivos multipaís con filtro "Solo Puentes" y calculadora de días hábiles.',
      en: 'Multi-country perpetual holiday calendar with Long Weekends filter and Business Days calculator.',
    },
    summary: {
      es: 'Consulta feriados oficiales en múltiples países, filtra puentes festivos, calcula días hábiles entre fechas y exporta a tu calendario offline.',
      en: 'Check official holidays across countries, filter long weekends, calculate business days between dates, and export to your calendar offline.',
    },
    accountBadge: {
      es: '100% Offline • Sin Cuentas',
      en: '100% Offline • No Accounts',
    },
    accountExplanation: {
      es: 'El cálculo perpetuo de feriados, puentes y días hábiles se realiza matemáticamente en el dispositivo. Cero cuentas y cero conexión a internet.',
      en: 'Perpetual holiday, long-weekend, and business-day calculations run mathematically on device. Zero accounts and zero internet required.',
    },
    features: {
      es: [
        { title: 'Selector Multipaís Persistente', description: 'Cambia entre Colombia, México, Argentina, España, Chile, Perú, EE.UU. y más; recuerda tu país siempre.', icon: '🌎' },
        { title: 'Filtro "Solo Puentes" Festivos', description: 'Identifica en un toque todos los fines de semana largos del año para planear viajes.', icon: '🏖️' },
        { title: 'Calculadora de Días Hábiles', description: 'Calcula días laborables exactos entre dos fechas descontando fines de semana y festivos oficiales.', icon: '🧮' },
        { title: 'Cuenta Regresiva y Exportación', description: 'Muestra cuántos días faltan para el próximo feriado y expórtalos a tu calendario nativo.', icon: '📲' },
      ],
      en: [
        { title: 'Persistent Multi-Country Picker', description: 'Switch between Colombia, Mexico, Argentina, Spain, Chile, Peru, USA, and more; remembers your selection.', icon: '🌎' },
        { title: '"Long Weekends Only" Filter', description: 'Highlight all 3-day holiday weekends in one tap to plan trips effortlessly.', icon: '🏖️' },
        { title: 'Offline Business Days Calculator', description: 'Compute exact working days between two dates excluding weekends and official holidays.', icon: '🧮' },
        { title: 'Live Countdown & Calendar Export', description: 'See days remaining until the next holiday and export them to your native phone calendar.', icon: '📲' },
      ],
    },
    manualSteps: {
      es: [
        { step: 1, title: 'Elegir País y Consultar Próximo Festivo', description: 'Toca la bandera superior para elegir tu país (queda guardado) y ver la cuenta regresiva.' },
        { step: 2, title: 'Filtrar Puentes o Calcular Días Hábiles', description: 'Activa "Solo Puentes" o abre la calculadora de días hábiles para fechas laborales.' },
        { step: 3, title: 'Exportar al Calendario Nativo', description: 'Presiona "Exportar" para añadir los feriados a tu Google o Apple Calendar.' },
      ],
      en: [
        { step: 1, title: 'Select Country & Next Holiday', description: 'Tap the top flag to pick your country (saved automatically) and view the countdown.' },
        { step: 2, title: 'Filter Long Weekends or Business Days', description: 'Toggle "Long Weekends Only" or use the offline Business Days calculator.' },
        { step: 3, title: 'Export to Native Calendar', description: 'Tap "Export" to add national holidays to your Google or Apple Calendar.' },
      ],
    },
    permissions: {
      es: [
        { name: 'Calendario (expo-calendar)', usage: 'Guardar los eventos feriados en el calendario personal solo si tú lo solicitas.' },
      ],
      en: [
        { name: 'Calendar (expo-calendar)', usage: 'Save holiday events to your personal calendar only when you request it.' },
      ],
    },
    technicalSpecs: [
      { label: 'Motor de Festivos', value: 'Ley Emiliani + date-holidays (CC-BY-3.0)' },
      { label: 'Utilidades', value: 'Filtro Solo Puentes + Días Hábiles' },
      { label: 'Operación', value: '100% Offline Perpetuo' },
      { label: 'Cuentas / Nube', value: 'Ninguna (100% Offline)' },
    ],
  },
];

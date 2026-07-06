export const USER_TYPES = {
  SUPERADMIN: 'superadmin',
  DIRECTIVO: 'directivo',
  PERSONAL: 'personal',
};

export const USER_TYPE_ARRAYS = {
  SUPERADMIN: ['superadmin'],
  DIRECTIVO: ['directivo'],
  PERSONAL: ['personal'],
  DIRECTIVO_PERSONAL: ['directivo', 'personal'],
  ALL: ['superadmin', 'directivo', 'personal'],
};

export const STATUS = {
  ACTIVIDAD: {
    PENDIENTE: 'pendiente',
    EN_PROGRESO: 'en_progreso',
    COMPLETADA: 'completada',
  },
  COMUNICADO: {
    PUBLICADO: 'publicado',
    BORRADOR: 'borrador',
  },
  TAREA: {
    PENDIENTE: 'pendiente',
    EN_PROGRESO: 'en_progreso',
    COMPLETADA: 'completada',
  },
};

export const LIMITS = {
  FILE_SIZE: {
    LOGO: 2 * 1024 * 1024,
    PHOTO: 2 * 1024 * 1024,
    IMAGE: 5 * 1024 * 1024,
    DOCUMENT: 10 * 1024 * 1024,
    PPTX: 10 * 1024 * 1024,
    SMOA_FILE: 50 * 1024 * 1024,
  },
  MAX_FILES: 5,
  MAX_TIPO_ACTIVIDAD_LENGTH: 100,
  MAX_DESCRIPTION_WORDS: 200,
  MAX_DESCRIPTION_CHARS: 2000,
  MAX_TITULO_LENGTH: 200,
  MIN_PASSWORD_LENGTH: 6,
};

export const ACCEPT = {
  IMAGE: 'image/*',
  PPTX: '.pptx',
  IMAGE_EXTENSIONS: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'],
};

export const FILE_EXTENSIONS = {
  LOGO: ['.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg'],
};

export const IMAGES = {
  DEFAULT_AVATAR: '/api/university/personal/foto/default-avatar.png',
  STRIDE_LOGO: '/uploads/logo_app/STRIDE%20WITHE%20LETTERS.png',
  STRIDE_LOGO_FALLBACK: '/uploads/logo_app/stride-logo.png',
};

export const STORAGE_KEYS = {
  TOKEN: 'stride_token',
  USER: 'stride_user',
};

export const DATE_FORMATS = {
  PLACEHOLDER_DMY: 'DD/MM/AAAA',
  PLACEHOLDER_YEAR: 'AAAA',
  LOCALE: 'es-ES',
  FULL_LONG: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
  FULL_WITH_TIME: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
  SHORT: { day: '2-digit', month: 'short', year: 'numeric' },
};

export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/university/login-general',
    CREATE_SUPERUSER: '/api/university/create-superuser',
    SUPERUSERS: '/api/university/superusers',
  },
  DIRECCIONES: '/api/university/direcciones',
  DIRECTIVOS: '/api/university/directivos',
  PERSONAL: '/api/university/personal',
  MATRIZ: {
    SECCIONES: '/api/university/matriz-secciones',
    ENCABEZADO: '/api/university/matriz-encabezado',
    COLUMNAS: '/api/university/matriz-columnas',
    FILAS: '/api/university/matriz-filas',
    USUARIOS: '/api/university/matriz-usuarios',
    ASIGNAR: '/api/university/matriz-asignar',
    COLUMNAS_ASIGNAR: '/api/university/matriz-columnas-asignar',
  },
  SMOA: {
    USUARIOS: '/api/university/smoa-usuarios',
    USUARIOS_DISPONIBLES: '/api/university/smoa-usuarios-disponibles',
    FILAS: '/api/university/smoa-filas',
    ENCABEZADO: '/api/university/smoa-encabezado',
    COLUMNAS: '/api/university/smoa-columnas',
    UPLOAD_IMAGE: '/api/university/smoa-upload-image',
    ASIGNAR: '/api/university/smoa-asignar',
    COLUMNAS_ASIGNAR: '/api/university/smoa-columnas-asignar',
  },
  SEPLADE: {
    HOJAS: '/api/university/seplade-hojas',
    INDICADORES: '/api/university/seplade-indicadores',
    USUARIOS: '/api/university/seplade-usuarios',
    FILAS: '/api/university/seplade-filas',
  },
  COMUNICADOS: {
    ADMIN: '/api/university/comunicados-admin',
    RECIENTES: '/api/university/comunicados-recientes',
    BASE: '/api/university/comunicados',
  },
  TAREAS: '/api/university/tareas',
  ACTIVIDADES: '/api/university/actividades',
  LOGO: '/api/university/logo',
  LOGO_APP: '/api/university/logo-app',
};

export const MESSAGES = {
  CARGANDO: 'Cargando...',
  SIN_ACTIVIDADES: 'No hay actividades registradas en el sistema',
  ACCESO_NO_AUTORIZADO: 'Acceso no autorizado',
  SIN_DIRECCION: 'No tienes una dirección asignada',
  CONTRASENAS_NO_COINCIDEN: 'Las contraseñas no coinciden',
  CONTRASENA_MINIMA: (n = LIMITS.MIN_PASSWORD_LENGTH) => `La contraseña debe tener al menos ${n} caracteres`,
  CELDA_GUARDADA: 'Celda guardada',
  FILA_AGREGADA: 'Fila agregada',
  FILA_ELIMINADA: 'Fila eliminada',
  SOLO_PPTX: 'Solo se permiten archivos .pptx',
  ARCHIVO_EXCEDE_TAMANO: (name, maxMB) => `El archivo "${name}" excede el tamaño máximo de ${maxMB}MB`,
  MAXIMO_ARCHIVOS: (n) => `Máximo ${n} archivos`,
  BIENVENIDO: (nombre) => `¡Bienvenido ${nombre}!`,
  MAXIMO_CARACTERES: (n) => `Máximo ${n} caracteres`,
  FOTO_MAX_2MB: 'La imagen es demasiado grande. Máximo 2MB',
  IMAGEN_MAX_5MB: 'Alguna imagen excede el tamaño máximo de 5MB',
};

export const COLORS = {
  PRIMARY_BLUE: '#1f6fd6',
  CYAN: '#2dd4d4',
  TURQUESA: '#22c1c3',
  CORAL_RED: '#ff5f6d',
  SOFT_YELLOW: '#f6c667',
  DARK_TEXT: '#2b2b2b',
  GRAY_TEXT: '#6c757d',
  LIGHT_BG: '#f8f9fa',
  WHITE: '#ffffff',
  BRAND_BLUE: '#0055a4',
  BRAND_DARK: '#003366',
  SUCCESS_GREEN: '#166534',
  LINK_BLUE: '#4A90E2',
  STATUS_GREEN: '#50C878',
  STATUS_ORANGE: '#FF7F50',
  STATUS_GRAY: '#A0A0A0',
  DANGER_RED: '#dc3545',
};

export const CAROUSEL = {
  SPEED: 500,
  AUTOPLAY_SPEED: 5000,
  SLIDES_TO_SHOW: 1,
  SLIDES_TO_SCROLL: 1,
};

export const UI = {
  ANIMATION_DURATION: '0.5s',
  ANIMATION_EASING: 'cubic-bezier(0.250, 0.460, 0.450, 0.940)',
  MODAL_Z_INDEX: 1000,
};

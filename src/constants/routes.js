export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  CREATE_SUPERADMIN: '/create-superadmin',
  WELCOME: '/welcome',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_ACTIVIDADES: '/admin/actividades',
  ADMIN_TAREAS: '/admin/tareas',
  ADMIN_SMOA: '/admin/smoa',
  DIRECTIVO_DASHBOARD: '/directivo/dashboard',
  DIRECTIVO_SMOA: '/directivo/smoa',
  PERSONAL_DASHBOARD: '/personal/dashboard',
  PERSONAL_TAREAS: '/personal/tareas',
  PERSONAL_SMOA: '/personal/smoa',
};

export const DASHBOARD_BY_TYPE = {
  superadmin: ROUTES.ADMIN_DASHBOARD,
  directivo: ROUTES.DIRECTIVO_DASHBOARD,
  personal: ROUTES.PERSONAL_DASHBOARD,
};

export const PREFIX_BY_TYPE = {
  superadmin: '/admin',
  directivo: '/directivo',
  personal: '/personal',
};

export const getDashboardPath = (userType) =>
  DASHBOARD_BY_TYPE[userType] || ROUTES.WELCOME;

export const getRoutePrefix = (userType) =>
  PREFIX_BY_TYPE[userType] || '';

export const matrizIndicadores = (tipo, seccionId) =>
  `${PREFIX_BY_TYPE[tipo] || `/${tipo}`}/matriz-indicadores/${seccionId}`;

export const seplade = (tipo, hojaId) =>
  `${PREFIX_BY_TYPE[tipo] || `/${tipo}`}/seplade/${hojaId}`;

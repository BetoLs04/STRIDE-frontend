const USER_COLOR_PALETTES = [
  { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc', dot: '#0284c7', name: 'sky' },
  { bg: '#fef3c7', text: '#b45309', border: '#fcd34d', dot: '#d97706', name: 'amber' },
  { bg: '#dcfce7', text: '#15803d', border: '#86efac', dot: '#16a34a', name: 'green' },
  { bg: '#f3e8ff', text: '#7e22ce', border: '#d8b4fe', dot: '#9333ea', name: 'purple' },
  { bg: '#ffe4e6', text: '#be123c', border: '#fda4af', dot: '#e11d48', name: 'rose' },
  { bg: '#ffedd5', text: '#c2410c', border: '#fdba74', dot: '#ea580c', name: 'orange' },
  { bg: '#ccfbf1', text: '#0f766e', border: '#5eead4', dot: '#0d9488', name: 'teal' },
  { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd', dot: '#7c3aed', name: 'violet' },
  { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4', dot: '#db2777', name: 'pink' },
  { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc', dot: '#4f46e5', name: 'indigo' },
  { bg: '#ecfccb', text: '#4d7c0f', border: '#bef264', dot: '#65a30d', name: 'lime' },
  { bg: '#cffafe', text: '#155e75', border: '#67e8f9', dot: '#0891b2', name: 'cyan' },
];

export const getUserColor = (userIdOrName) => {
  if (!userIdOrName) return USER_COLOR_PALETTES[0];
  let hash = 0;
  const str = String(userIdOrName);
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_COLOR_PALETTES.length;
  return USER_COLOR_PALETTES[index];
};

export default getUserColor;

export const ADMIN_THEME = {
  primary: '#137fec',
  primaryLight: '#137fec20',
  primaryHover: '#0f5dc1',
  background: '#0a1220',
  backgroundSecondary: '#162a33',
  border: '#283940',
  text: {
    primary: '#ffffff',
    secondary: '#9db9ab',
  },
};

export const STUDENT_THEME = {
  primary: '#13ec80',
  primaryLight: '#13ec8020',
  primaryHover: '#0fd673',
  background: '#102219',
  backgroundSecondary: '#1a2c23',
  border: '#283930',
  text: {
    primary: '#ffffff',
    secondary: '#9db9ab',
  },
};

export function getTheme(isAdmin: boolean) {
  return isAdmin ? ADMIN_THEME : STUDENT_THEME;
}

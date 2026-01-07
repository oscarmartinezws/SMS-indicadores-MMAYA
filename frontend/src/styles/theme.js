// Theme and styles configuration
export const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Color Themes
export const colorThemes = {
  negro: { primary: '#000000', primaryHover: '#333333', accent: '#09AA5B' },
  azul: { primary: '#0066CC', primaryHover: '#004C99', accent: '#00A3E0' },
  rosa: { primary: '#FF5A5F', primaryHover: '#E04E52', accent: '#FF385C' }
};

// Base styles
export const baseStyles = {
  white: '#FFFFFF',
  gray100: '#F6F6F6',
  gray200: '#EEEEEE',
  gray300: '#E2E2E2',
  gray400: '#CACACA',
  gray500: '#A0A0A0',
  gray600: '#6B6B6B',
  gray700: '#545454',
  gray800: '#333333',
  gray900: '#1A1A1A',
  green: '#09AA5B',
  red: '#E11900',
  blue: '#0066CC',
};

// Generate styles based on theme
export const getStyles = (colorTheme = 'negro', modo = 'claro') => {
  const theme = colorThemes[colorTheme] || colorThemes.negro;
  const isDark = modo === 'oscuro';
  
  return {
    ...baseStyles,
    black: theme.primary,
    primary: theme.primary,
    primaryHover: theme.primaryHover,
    accent: theme.accent,
    ...(isDark ? {
      white: '#1A1A1A',
      gray100: '#2A2A2A',
      gray200: '#3A3A3A',
      gray300: '#4A4A4A',
      gray600: '#AAAAAA',
      gray700: '#BBBBBB',
      textColor: '#FFFFFF',
      bgColor: '#121212'
    } : {
      textColor: '#000000',
      bgColor: '#F6F6F6'
    })
  };
};

// Default styles
export const defaultStyles = getStyles('negro', 'claro');

// Table styles - compact
export const getTableStyles = (styles) => ({
  rowStyle: { padding: '6px 10px', fontSize: '0.8rem', verticalAlign: 'middle' },
  headerStyle: { background: styles.black, color: styles.white, padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase' }
});

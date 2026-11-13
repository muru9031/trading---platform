import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app-theme') || 'normal';
  });

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    document.documentElement.classList.remove('dark', 'theme-black');
    if (theme === 'normal') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'dark') {
      document.documentElement.classList.add('dark', 'theme-black');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'normal' ? 'light' : (prev === 'light' ? 'dark' : 'normal'));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}


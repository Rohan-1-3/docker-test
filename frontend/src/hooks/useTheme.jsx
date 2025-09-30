import { useState, useEffect } from 'react';

const useTheme = () => {
  const [theme, setTheme] = useState('');

  useEffect(() => {
    // Check for stored theme or use system preference
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(systemTheme);
    }

    // Listen for changes to system theme
    const themeChangeListener = (e) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setTheme(newTheme);
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', themeChangeListener);

    return () => {
      mediaQuery.removeEventListener('change', themeChangeListener);
    };
  }, []);

  useEffect(()=>{
    if(theme === 'dark'){
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('theme', theme);
  },[theme])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return {
    theme,
    toggleTheme
  };
};

export default useTheme;

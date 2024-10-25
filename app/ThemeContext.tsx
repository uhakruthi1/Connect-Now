import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext<{
  darkModeEnabled: boolean;
  toggleDarkMode: () => void;
}>({
  darkModeEnabled: false,
  toggleDarkMode: () => {},
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [darkModeEnabled, setDarkModeEnabled] = useState<boolean>(false);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedValue = await AsyncStorage.getItem('darkModeEnabled');
        if (storedValue !== null) {
          setDarkModeEnabled(JSON.parse(storedValue));
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };

    loadThemePreference();
  }, []);

  const toggleDarkMode = async () => {
    const newMode = !darkModeEnabled;
    setDarkModeEnabled(newMode);
    try {
      await AsyncStorage.setItem('darkModeEnabled', JSON.stringify(newMode));
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ darkModeEnabled, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  return useContext(ThemeContext);
};

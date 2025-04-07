import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setDarkMode: (value: boolean) => void;
};

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
  setDarkMode: () => {},
});

// Hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedDarkMode = await AsyncStorage.getItem('darkMode');
        if (savedDarkMode !== null) {
          setIsDarkMode(JSON.parse(savedDarkMode));
        } else {
          setIsDarkMode(systemColorScheme === 'dark');
        }
      } catch (error) {
        console.log('Failed to load theme preference:', error);
        setIsDarkMode(systemColorScheme === 'dark');
      } finally {
        setIsInitialized(true);
      }
    };
    
    loadThemePreference();
  }, [systemColorScheme]);

  // Save theme preference when it changes
  useEffect(() => {
    if (isInitialized) {
      const saveThemePreference = async () => {
        try {
          await AsyncStorage.setItem('darkMode', JSON.stringify(isDarkMode));
          // Set a timestamp to force updates on other components
          await AsyncStorage.setItem('themeUpdateTimestamp', Date.now().toString());
        } catch (error) {
          console.log('Failed to save theme preference:', error);
        }
      };
      
      saveThemePreference();
    }
  }, [isDarkMode, isInitialized]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const setDarkMode = (value: boolean) => {
    setIsDarkMode(value);
  };

  // Don't render until theme is initialized
  if (!isInitialized) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext; 
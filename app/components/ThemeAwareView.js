import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme as useCustomTheme } from '../context/ThemeContext';

/**
 * ThemeAwareView component that automatically applies correct background color
 * based on the current theme and ensures theme changes are properly reflected
 */
export default function ThemeAwareView({ children, style, tabName }) {
  const { isDarkMode } = useCustomTheme();
  
  return (
    <View 
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' },
        style
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  }
}); 
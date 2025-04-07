import React, { useMemo } from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * TabBackground component provides unique visual styling for each tab
 * This component is deprecated, use direct View components with proper padding instead
 */
export default function TabBackground({ tabName, children, style }) {
  console.warn('TabBackground is deprecated. Use direct View components with proper padding instead.');
  
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dimensions = useWindowDimensions();
  
  // Get tab-specific colors
  const tabKey = `${tabName}Tab`;
  const tabColors = theme.dark 
    ? Colors.dark[tabKey] || Colors.dark.homeTab
    : Colors.light[tabKey] || Colors.light.homeTab;
  
  const gradientColors = tabColors.gradient || [tabColors.primary, tabColors.secondary];
  
  return (
    <View style={[styles.container, style]}>
      {/* Background pattern that works on both web and mobile */}
      <View style={[styles.backgroundPattern, { opacity: Platform.OS === 'web' ? 0.05 : 0.03 }]}>
        {/* Gradient background for mobile */}
        {Platform.OS !== 'web' && (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradientBackground, { opacity: 0.1 }]}
          />
        )}
        
        {/* Decorative circles */}
        {Array.from({ length: 3 }).map((_, i) => (
          <View 
            key={i}
            style={[
              styles.patternCircle,
              { 
                backgroundColor: tabColors.primary,
                opacity: 0.05 + (i * 0.02),
                right: dimensions.width * 0.05 + (i * 40),
                top: dimensions.height * 0.05 + (i * 40),
                width: 80 + (i * 40),
                height: 80 + (i * 40),
              }
            ]}
          />
        ))}
      </View>
      
      <View style={styles.contentContainer}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 2,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternCircle: {
    position: 'absolute',
    borderRadius: 999,
  }
}); 
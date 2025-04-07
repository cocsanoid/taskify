import React, { useMemo } from 'react';
import { StyleSheet, View, Dimensions, useWindowDimensions } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Colors } from '../constants/Colors';

// PageBackground component creates a visually interesting background
// that matches the color scheme of the given page/tab
export const PageBackground = ({ pageName, style }) => {
  // Get theme and dimensions for responsive design
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  
  // Get the colors for the current page
  const getPageColors = () => {
    const tabKey = `${pageName}Tab`;
    return theme.dark ? Colors.dark[tabKey] : Colors.light[tabKey];
  };
  
  // Create a dynamic pattern based on page name
  const renderBackground = useMemo(() => {
    const colors = getPageColors() || 
      (theme.dark ? Colors.dark.homeTab : Colors.light.homeTab);
    
    const primary = colors.primary;
    const secondary = colors.secondary;
    
    // Create different patterns based on the page name
    switch (pageName) {
      case 'home':
        return (
          <View style={styles.container}>
            {/* Wavy pattern */}
            {Array.from({ length: 5 }).map((_, i) => (
              <View 
                key={`wave-${i}`}
                style={[
                  styles.wave,
                  {
                    top: height * 0.05 + (i * 50),
                    width: width * 1.5,
                    height: 60 + (i * 10),
                    backgroundColor: primary,
                    opacity: 0.03 + (i * 0.01),
                    transform: [
                      { translateX: i % 2 === 0 ? -50 : -100 },
                      { translateY: i * 5 },
                      { rotate: `${i * 2}deg` }
                    ]
                  }
                ]}
              />
            ))}
          </View>
        );
        
      case 'tasks':
        return (
          <View style={styles.container}>
            {/* Circular pattern */}
            {Array.from({ length: 8 }).map((_, i) => (
              <View 
                key={`circle-${i}`}
                style={[
                  styles.circle,
                  {
                    top: Math.random() * height * 0.6,
                    left: Math.random() * width * 0.8,
                    width: 100 + (Math.random() * 150),
                    height: 100 + (Math.random() * 150),
                    backgroundColor: i % 2 === 0 ? primary : secondary,
                    opacity: 0.02 + (Math.random() * 0.04),
                    transform: [
                      { scale: 0.5 + (Math.random() * 1.5) }
                    ]
                  }
                ]}
              />
            ))}
          </View>
        );
        
      case 'calendar':
        return (
          <View style={styles.container}>
            {/* Grid pattern */}
            <View style={styles.gridContainer}>
              {Array.from({ length: 12 }).map((_, i) => (
                <View 
                  key={`grid-${i}`}
                  style={[
                    styles.gridLine,
                    {
                      backgroundColor: primary,
                      opacity: 0.08,
                      transform: [
                        { rotate: `${45 + (i * 5)}deg` }
                      ],
                      width: width * 2,
                      height: 1,
                      left: -width / 2,
                      top: height * 0.1 + (i * height * 0.07)
                    }
                  ]}
                />
              ))}
            </View>
          </View>
        );
        
      case 'notes':
        return (
          <View style={styles.container}>
            {/* Dot pattern */}
            <View style={styles.dotContainer}>
              {Array.from({ length: Math.floor(width / 30) }).map((_, i) => (
                Array.from({ length: Math.floor(height / 30) }).map((_, j) => (
                  <View 
                    key={`dot-${i}-${j}`}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: primary,
                        opacity: ((i + j) % 3 === 0) ? 0.08 : 0.03,
                        width: ((i + j) % 3 === 0) ? 4 : 2,
                        height: ((i + j) % 3 === 0) ? 4 : 2,
                        left: i * 30,
                        top: j * 30
                      }
                    ]}
                  />
                ))
              ))}
            </View>
          </View>
        );
        
      case 'habits':
        return (
          <View style={styles.container}>
            {/* Diagonal stripes */}
            {Array.from({ length: 10 }).map((_, i) => (
              <View 
                key={`stripe-${i}`}
                style={[
                  styles.stripe,
                  {
                    backgroundColor: i % 2 === 0 ? primary : secondary,
                    opacity: 0.08,
                    transform: [
                      { rotate: '45deg' },
                      { translateY: (i * width * 0.2) - (width * 0.6) }
                    ],
                    width: width * 2,
                    height: 15 + (i * 5),
                    left: -width / 2
                  }
                ]}
              />
            ))}
          </View>
        );
        
      case 'profile':
        return (
          <View style={styles.container}>
            {/* Radial gradient simulation */}
            <View style={styles.radialContainer}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View 
                  key={`radial-${i}`}
                  style={[
                    styles.radial,
                    {
                      backgroundColor: primary,
                      opacity: 0.06 - (i * 0.01),
                      width: 100 + (i * 100),
                      height: 100 + (i * 100),
                      borderRadius: 50 + (i * 50),
                    }
                  ]}
                />
              ))}
            </View>
          </View>
        );
        
      default:
        return (
          <View style={styles.container}>
            {/* Default subtle pattern */}
            {Array.from({ length: 5 }).map((_, i) => (
              <View 
                key={`default-${i}`}
                style={[
                  styles.defaultShape,
                  {
                    top: Math.random() * height * 0.8,
                    left: Math.random() * width * 0.8,
                    width: 100 + (Math.random() * 150),
                    height: 100 + (Math.random() * 150),
                    backgroundColor: primary,
                    opacity: 0.03,
                    transform: [
                      { rotate: `${Math.random() * 90}deg` },
                      { scale: 0.5 + (Math.random() * 1) }
                    ]
                  }
                ]}
              />
            ))}
          </View>
        );
    }
  }, [pageName, width, height, theme.dark]);
  
  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {renderBackground}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: -1
  },
  wave: {
    position: 'absolute',
    borderRadius: 50,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
  },
  dotContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dot: {
    position: 'absolute',
    borderRadius: 2,
  },
  stripe: {
    position: 'absolute',
  },
  radialContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radial: {
    position: 'absolute',
  },
  defaultShape: {
    position: 'absolute',
    borderRadius: 20,
  }
});

export default PageBackground; 
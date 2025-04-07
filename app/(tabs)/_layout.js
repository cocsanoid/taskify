import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme, Platform, StyleSheet, View, Pressable, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { PaperProvider, MD3LightTheme, MD3DarkTheme, Text, useTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ensureRussianLanguage } from '../../utils/i18n';
import { Colors } from '../../constants/Colors';
import { useTheme as useCustomTheme } from '../context/ThemeContext';

// Responsive layout breakpoints
const TABLET_BREAKPOINT = 768;
const DESKTOP_BREAKPOINT = 1024;

// Define themes inline instead of importing
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6a0dad', // Deep purple
    secondary: '#9370db', // Medium purple
    tertiary: '#b19cd9', // Light purple
    error: '#ef233c',
    background: '#f8f9fa',
    surface: '#ffffff',
    buttonBackground: 'linear-gradient(to right, #6a0dad, #9370db)',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#9370db', // Medium purple
    secondary: '#b19cd9', // Light purple
    tertiary: '#d8bfd8', // Thistle purple
    error: '#ff5a5f',
    background: '#121212', // Very dark background
    surface: '#1e1e1e',
    buttonBackground: 'linear-gradient(to right, #2d1846, #6a0dad)', // Dark purple gradient
  },
};

// Custom Side Tabs for web platform
function CustomSideTabs({ navigation, state, descriptors, theme }) {
  const [hoverIndex, setHoverIndex] = useState(-1);
  
  // Get tab colors from theme
  const getTabColors = (routeName) => {
    const tabKey = `${routeName}Tab`;
    const themeColors = theme.dark ? Colors.dark : Colors.light;
    
    // First try to get the specific tab colors
    if (themeColors[tabKey] && typeof themeColors[tabKey] === 'object') {
      return themeColors[tabKey];
    }
    
    // Fallback to home tab colors
    if (themeColors.homeTab && typeof themeColors.homeTab === 'object') {
      return themeColors.homeTab;
    }
    
    // Final fallback to basic colors
    return {
      primary: themeColors.primary || '#7e41d4',
      secondary: themeColors.secondary || '#3498db',
      gradient: [themeColors.primary || '#7e41d4', themeColors.secondary || '#3498db'],
      cardBg: themeColors.surface || '#ffffff'
    };
  };
  
  return (
    <View style={[
      styles.sideTabContainer,
      { backgroundColor: theme.colors.surface }
    ]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title || route.name;
        
        // Get tab-specific colors
        const tabColors = getTabColors(route.name) || 
          (theme.dark ? Colors.dark.homeTab : Colors.light.homeTab);
        
        const isFocused = state.index === index;
        const icon = options.tabBarIcon ? options.tabBarIcon({
          color: isFocused ? tabColors.primary : '#777',
          size: 24,
        }) : null;
        
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onHoverIn={() => setHoverIndex(index)}
            onHoverOut={() => setHoverIndex(-1)}
            style={[
              styles.sideTabItem,
              isFocused && [
                styles.sideTabItemActive,
                { 
                  borderLeftColor: tabColors.primary || '#7e41d4',
                  backgroundColor: theme.dark 
                    ? `rgba(${hexToRgb(tabColors.primary || '#7e41d4')}, 0.1)` 
                    : `rgba(${hexToRgb(tabColors.primary || '#7e41d4')}, 0.15)`
                }
              ],
              hoverIndex === index && !isFocused && [
                styles.sideTabItemHover,
                { backgroundColor: `rgba(${hexToRgb(tabColors.primary || '#7e41d4')}, 0.05)` }
              ]
            ]}
          >
            {/* Tab background pattern */}
            {isFocused && (
              <View style={styles.tabPattern}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <View 
                    key={i}
                    style={[
                      styles.patternCircle,
                      { 
                        backgroundColor: tabColors.primary,
                        opacity: 0.03 + (i * 0.02),
                        right: i * 15 - 5,
                        top: i * 15 - 5,
                        width: 30 + (i * 10),
                        height: 30 + (i * 10),
                      }
                    ]}
                  />
                ))}
              </View>
            )}
            
            <View style={styles.sideTabContent}>
              {icon !== null ? (
                <View style={[
                  styles.iconWrapper,
                  isFocused && { backgroundColor: `rgba(${hexToRgb(tabColors.primary || '#7e41d4')}, 0.1)` }
                ]}>
                  {icon}
                </View>
              ) : null}
              <Text 
                style={[
                  styles.sideTabLabel,
                  { color: isFocused ? tabColors.primary : '#777', backgroundColor: 'transparent' },
                  hoverIndex === index && !isFocused && { color: tabColors.primary }
                ]}
              >
                {label}
              </Text>
            </View>
            
            {(isFocused || hoverIndex === index) && (
              <View 
                style={[
                  styles.glowEffect,
                  { 
                    backgroundColor: tabColors.primary,
                    opacity: isFocused ? 0.15 : 0.05
                  }
                ]} 
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// Helper function to convert hex to rgb
function hexToRgb(hex) {
  // Handle invalid or undefined hex values
  if (!hex || typeof hex !== 'string') {
    console.warn('Invalid hex color provided to hexToRgb:', hex);
    return '0, 0, 0'; // Default to black if invalid
  }

  // Remove # if present
  hex = hex.replace('#', '');
  
  // Ensure we have a valid hex string
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    console.warn('Invalid hex format provided to hexToRgb:', hex);
    return '0, 0, 0'; // Default to black if invalid format
  }
  
  try {
    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Check for NaN values
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      console.warn('Failed to parse hex color in hexToRgb:', hex);
      return '0, 0, 0'; // Default to black
    }
    
    return `${r}, ${g}, ${b}`;
  } catch (error) {
    console.error('Error in hexToRgb:', error);
    return '0, 0, 0'; // Default to black if any error occurs
  }
}

// Custom Bottom Tabs component with more adaptability
function CustomBottomTabs({ navigation, state, descriptors, theme }) {
  const insets = useSafeAreaInsets();
  
  // Get tab colors from theme
  const getTabColors = (routeName) => {
    const tabKey = `${routeName}Tab`;
    const themeColors = theme.dark ? Colors.dark : Colors.light;
    
    // First try to get the specific tab colors
    if (themeColors[tabKey] && typeof themeColors[tabKey] === 'object') {
      return themeColors[tabKey];
    }
    
    // Fallback to home tab colors
    if (themeColors.homeTab && typeof themeColors.homeTab === 'object') {
      return themeColors.homeTab;
    }
    
    // Final fallback to basic colors
    return {
      primary: themeColors.primary || '#7e41d4',
      secondary: themeColors.secondary || '#3498db',
      gradient: [themeColors.primary || '#7e41d4', themeColors.secondary || '#3498db'],
      cardBg: themeColors.surface || '#ffffff'
    };
  };
  
  return (
    <View style={[
      styles.bottomTabContainer,
      { 
        backgroundColor: theme.colors.surface,
        paddingBottom: Math.max(insets.bottom, 8), // Ensure safe area on devices with notches
        borderTopColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        ...(Platform.OS === 'web' 
          ? {
              boxShadow: '0px -3px 3px rgba(0,0,0,0.1)'
            } 
          : {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 10
            }
        ),
      }
    ]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title || route.name;
        
        // Get tab-specific colors
        const tabColors = getTabColors(route.name) || 
          (theme.dark ? Colors.dark.homeTab : Colors.light.homeTab);
        
        const isFocused = state.index === index;
        const icon = options.tabBarIcon ? options.tabBarIcon({
          color: isFocused ? tabColors.primary : '#777',
          size: 24,
        }) : null;
        
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            android_ripple={{ color: `rgba(${hexToRgb(tabColors.primary || '#7e41d4')}, 0.1)`, borderless: true }}
            style={[
              styles.bottomTabItem,
              isFocused && { 
                backgroundColor: theme.dark 
                  ? `rgba(${hexToRgb(tabColors.primary || '#7e41d4')}, 0.07)` 
                  : `rgba(${hexToRgb(tabColors.primary || '#7e41d4')}, 0.1)`
              }
            ]}
          >
            {/* Tab background pattern for focused state */}
            {isFocused && (
              <View style={styles.tabPatternBottom}>
                <View style={[
                  styles.patternBar,
                  { backgroundColor: tabColors.primary, opacity: 0.1 }
                ]} />
                {Array.from({ length: 2 }).map((_, i) => (
                  <View 
                    key={i}
                    style={[
                      styles.patternDot,
                      { 
                        backgroundColor: tabColors.primary,
                        opacity: 0.15,
                        left: 10 + (i * 20),
                        top: 10
                      }
                    ]}
                  />
                ))}
              </View>
            )}
            
            <View style={styles.bottomTabContent}>
              {/* Icon with selected indicator */}
              <View style={styles.iconContainer}>
                {icon !== null ? icon : null}
                {isFocused && (
                  <View 
                    style={[
                      styles.tabIndicatorDot,
                      { backgroundColor: tabColors.primary }
                    ]} 
                  />
                )}
              </View>
              
              {/* Only show label when focused */}
              {isFocused && (
                <Text 
                  style={[
                    styles.bottomTabLabel,
                    { color: tabColors.primary, backgroundColor: 'transparent' }
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// Tab icons setup
function TabBarIcon(props) {
  const { name, color, family = 'MaterialCommunityIcons', size = 28 } = props;
  if (family === 'FontAwesome5') {
    return <FontAwesome5 name={name} size={size} color={color} />;
  }
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

export default function TabsLayout() {
  const { t, i18n } = useTranslation();
  const systemColorScheme = useColorScheme();
  const { isDarkMode } = useCustomTheme();
  const [loaded, setLoaded] = useState(true);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  
  // Set Russian as the only language
  useEffect(() => {
    ensureRussianLanguage();
  }, []);
  
  // Update dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions(Dimensions.get('window'));
    };
    
    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => {
      subscription.remove();
    };
  }, []);
  
  // Determine device type based on dimensions and platform
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && dimensions.width >= DESKTOP_BREAKPOINT;
  const isTablet = isWeb && dimensions.width >= TABLET_BREAKPOINT && dimensions.width < DESKTOP_BREAKPOINT;
  const isMobile = !isWeb || dimensions.width < TABLET_BREAKPOINT;
  
  // Use side navigation for desktop web, bottom tabs for mobile and tablet
  const useSideNav = isDesktop;
  
  // Create theme object
  const theme = {
    ...(isDarkMode ? darkTheme : lightTheme),
    dark: isDarkMode, // Explicitly set dark property for theme checking
    colors: {
      ...(isDarkMode ? darkTheme.colors : lightTheme.colors),
      // Ensure tab colors are available
      homeTab: isDarkMode ? Colors.dark.homeTab : Colors.light.homeTab,
      tasksTab: isDarkMode ? Colors.dark.tasksTab : Colors.light.tasksTab,
      calendarTab: isDarkMode ? Colors.dark.calendarTab : Colors.light.calendarTab,
      notesTab: isDarkMode ? Colors.dark.notesTab : Colors.light.notesTab,
      habitsTab: isDarkMode ? Colors.dark.habitsTab : Colors.light.habitsTab,
      profileTab: isDarkMode ? Colors.dark.profileTab : Colors.light.profileTab,
    },
    responsive: {
      isDesktop,
      isTablet,
      isMobile,
      dimensions: {
        width: dimensions.width,
        height: dimensions.height
      },
      breakpoints: {
        tablet: TABLET_BREAKPOINT,
        desktop: DESKTOP_BREAKPOINT
      }
    }
  };
  
  if (!loaded) {
    return null; // Show nothing until theme is loaded
  }

  if (useSideNav) {
    return (
      <PaperProvider theme={theme}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#6a0dad',
            tabBarInactiveTintColor: isDarkMode ? '#999' : '#666',
            tabBarStyle: {
              backgroundColor: theme.colors.surface,
              borderTopColor: isDarkMode ? '#333' : '#e0e0e0',
              height: 60,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
              marginBottom: 5,
            },
            contentStyle: {
              marginLeft: 220, // Add margin equal to side menu width
              paddingLeft: 30, // Increase padding from 20 to 30px
            },
          }}
          tabBar={props => <CustomSideTabs {...props} theme={theme} />}
        >
          <Tabs.Screen
            name="home"
            options={{
              title: t('home.title'),
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="index"
            options={{
              title: t('tasks.title'),
              tabBarIcon: ({ color }) => <TabBarIcon name="format-list-checks" color={color} />,
            }}
          />
          <Tabs.Screen
            name="habits"
            options={{
              title: t('habits.title'),
              tabBarIcon: ({ color }) => <TabBarIcon name="repeat" color={color} />,
            }}
          />
          <Tabs.Screen
            name="calendar"
            options={{
              title: t('calendar.title'),
              tabBarIcon: ({ color }) => <TabBarIcon name="calendar-month" color={color} />,
            }}
          />
          <Tabs.Screen
            name="notes"
            options={{
              title: t('notes.title'),
              tabBarIcon: ({ color }) => <TabBarIcon name="note-text" color={color} />,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: t('profile.title'),
              tabBarIcon: ({ color }) => <TabBarIcon name="account" color={color} />,
            }}
          />
        </Tabs>
      </PaperProvider>
    );
  }

  // Mobile/Tablet layout with custom bottom tabs
  return (
    <PaperProvider theme={theme}>
      <Tabs
        screenOptions={{
          headerShown: false,
          contentStyle: {
            marginLeft: 0, // Ensure no margin on mobile
            marginRight: 0, // Ensure no margin on right side
            paddingHorizontal: 0, // Reset any horizontal padding
            paddingLeft: 0, // Explicitly set left padding to 0
            paddingRight: 0, // Explicitly set right padding to 0
          },
          tabBarActiveTintColor: '#6a0dad',
          tabBarInactiveTintColor: isDarkMode ? '#999' : '#666',
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: isDarkMode ? '#333' : '#e0e0e0',
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginBottom: 5,
          },
        }}
        tabBar={props => <CustomBottomTabs {...props} theme={theme} />}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: t('home.title'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: t('tasks.title'),
            tabBarIcon: ({ color }) => <TabBarIcon name="format-list-checks" color={color} />,
          }}
        />
        <Tabs.Screen
          name="habits"
          options={{
            title: t('habits.title'),
            tabBarIcon: ({ color }) => <TabBarIcon name="repeat" color={color} />,
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: t('calendar.title'),
            tabBarIcon: ({ color }) => <TabBarIcon name="calendar-month" color={color} />,
          }}
        />
        <Tabs.Screen
          name="notes"
          options={{
            title: t('notes.title'),
            tabBarIcon: ({ color }) => <TabBarIcon name="note-text" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('profile.title'),
            tabBarIcon: ({ color }) => <TabBarIcon name="account" color={color} />,
          }}
        />
      </Tabs>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  // Side navigation styles
  sideTabContainer: {
    width: 220,
    height: '100vh',
    position: 'fixed',
    left: 0,
    top: 0,
    paddingTop: 60,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.1)',
    zIndex: 1000,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  sideTabItem: {
    padding: 15,
    paddingLeft: 25,
    position: 'relative',
    overflow: 'hidden',
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  sideTabItemActive: {
    backgroundColor: 'rgba(106, 13, 173, 0.05)',
  },
  sideTabItemHover: {
    backgroundColor: 'rgba(106, 13, 173, 0.02)',
  },
  sideTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 5,
  },
  sideTabLabel: {
    marginLeft: 14,
    fontSize: 16,
    fontWeight: '500',
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 4,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1,
  },
  patternCircle: {
    position: 'absolute',
    borderRadius: 50,
  },
  
  // Bottom navigation styles
  bottomTabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 80 : 60,
  },
  bottomTabItem: {
    flex: 1,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 2,
  },
  bottomTabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 5,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabIndicatorDot: {
    position: 'absolute',
    bottom: -8,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  bottomTabLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  tabPatternBottom: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  patternBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  patternDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
}); 
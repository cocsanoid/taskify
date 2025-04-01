import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme, Platform, StyleSheet, View, Pressable, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { PaperProvider, MD3LightTheme, MD3DarkTheme, Text, useTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ensureRussianLanguage } from '../../utils/i18n';

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
  
  return (
    <View style={[
      styles.sideTabContainer,
      { backgroundColor: theme.colors.surface }
    ]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title || route.name;
        
        const isFocused = state.index === index;
        const icon = options.tabBarIcon ? options.tabBarIcon({
          color: isFocused ? theme.colors.primary : '#777',
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
                  borderLeftColor: theme.colors.primary,
                  backgroundColor: theme.dark ? 'rgba(106, 13, 173, 0.05)' : 'rgba(106, 13, 173, 0.1)'
                }
              ],
              hoverIndex === index && !isFocused && styles.sideTabItemHover
            ]}
          >
            <View style={styles.sideTabContent}>
              {icon !== null ? icon : null}
              <Text 
                style={[
                  styles.sideTabLabel,
                  { color: isFocused ? theme.colors.primary : '#777' },
                  hoverIndex === index && !isFocused && { color: theme.colors.primary }
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
                    backgroundColor: theme.colors.primary,
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

// Custom Bottom Tabs component with more adaptability
function CustomBottomTabs({ navigation, state, descriptors, theme }) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[
      styles.bottomTabContainer,
      { 
        backgroundColor: theme.colors.surface,
        paddingBottom: Math.max(insets.bottom, 8), // Ensure safe area on devices with notches
        borderTopColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 10
      }
    ]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title || route.name;
        
        const isFocused = state.index === index;
        const icon = options.tabBarIcon ? options.tabBarIcon({
          color: isFocused ? theme.colors.primary : '#777',
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
            android_ripple={{ color: 'rgba(106, 13, 173, 0.1)', borderless: true }}
            style={styles.bottomTabItem}
          >
            <View style={styles.bottomTabContent}>
              {icon !== null ? icon : null}
              <Text 
                style={[
                  styles.bottomTabLabel,
                  { color: isFocused ? theme.colors.primary : '#777' }
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
            {isFocused && (
              <View 
                style={[
                  styles.bottomTabIndicator,
                  { backgroundColor: theme.colors.primary }
                ]} 
              />
            )}
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
  const [darkMode, setDarkMode] = useState(systemColorScheme === 'dark');
  const [loaded, setLoaded] = useState(false);
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
  
  useEffect(() => {
    // Load saved theme preference
    const loadThemePreference = async () => {
      try {
        const savedDarkMode = await AsyncStorage.getItem('darkMode');
        if (savedDarkMode !== null) {
          setDarkMode(JSON.parse(savedDarkMode));
        } else {
          setDarkMode(systemColorScheme === 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
        setDarkMode(systemColorScheme === 'dark');
      } finally {
        setLoaded(true);
      }
    };
    
    loadThemePreference();
  }, [systemColorScheme]);
  
  // Listen for theme changes from other components
  useEffect(() => {
    const checkTheme = async () => {
      try {
        const savedDarkMode = await AsyncStorage.getItem('darkMode');
        if (savedDarkMode !== null) {
          const newDarkMode = JSON.parse(savedDarkMode);
          if (newDarkMode !== darkMode) {
            console.log('Tab layout theme changed to:', newDarkMode ? 'dark' : 'light');
            setDarkMode(newDarkMode);
            
            // Force a re-render on theme change
            if (Platform.OS === 'ios' || Platform.OS === 'android') {
              setLoaded(false);
              setTimeout(() => setLoaded(true), 50);
            }
          }
        }
        
        // Check for forced theme updates
        await AsyncStorage.getItem('themeUpdateTimestamp');
      } catch (error) {
        console.error('Failed to check theme preference:', error);
        setDarkMode(systemColorScheme === 'dark');
      }
    };
    
    // Run immediately
    checkTheme();
    
    // Check frequently on mobile
    const checkInterval = Platform.OS === 'web' ? 1000 : 500;
    const intervalId = setInterval(checkTheme, checkInterval);
    return () => clearInterval(intervalId);
  }, [darkMode, systemColorScheme]);
  
  const theme = {
    ...(darkMode ? darkTheme : lightTheme),
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
            tabBarInactiveTintColor: darkMode ? '#999' : '#666',
            tabBarStyle: {
              backgroundColor: theme.colors.surface,
              borderTopColor: darkMode ? '#333' : '#e0e0e0',
              height: 60,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
              marginBottom: 5,
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
            paddingHorizontal: 0, // Reset any horizontal padding
          },
          tabBarActiveTintColor: '#6a0dad',
          tabBarInactiveTintColor: darkMode ? '#999' : '#666',
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: darkMode ? '#333' : '#e0e0e0',
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
    height: '100vh', // Use viewport height for full screen height
    position: 'fixed', // Change to fixed for proper desktop positioning
    left: 0,
    top: 0,
    paddingTop: 60,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.1)',
    zIndex: 1000, // Increase z-index to ensure it stays on top
    overflow: 'auto', // Add scrolling for smaller screens
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
  
  // Bottom navigation styles
  bottomTabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 80 : 60, // Proper height for different platforms
  },
  bottomTabItem: {
    flex: 1,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bottomTabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomTabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  bottomTabIndicator: {
    height: 3,
    width: '50%',
    position: 'absolute',
    bottom: 0,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
}); 
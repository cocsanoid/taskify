import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';
import { useColorScheme, Dimensions, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import i18n, { ensureRussianLanguage } from '../utils/i18n';

// Responsive layout breakpoints - ensure these match the values in (tabs)/_layout.js
const TABLET_BREAKPOINT = 768;
const DESKTOP_BREAKPOINT = 1024;

// Get initial dimensions
const initialDimensions = Dimensions.get('window');
const initialIsDesktop = Platform.OS === 'web' && initialDimensions.width >= DESKTOP_BREAKPOINT;
const initialIsTablet = Platform.OS === 'web' && initialDimensions.width >= TABLET_BREAKPOINT && initialDimensions.width < DESKTOP_BREAKPOINT;
const initialIsMobile = Platform.OS !== 'web' || initialDimensions.width < TABLET_BREAKPOINT;

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
  // Adding responsive properties
  responsive: {
    isDesktop: initialIsDesktop,
    isTablet: initialIsTablet,
    isMobile: initialIsMobile,
    breakpoints: {
      tablet: TABLET_BREAKPOINT,
      desktop: DESKTOP_BREAKPOINT,
    }
  }
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
  // Adding responsive properties
  responsive: {
    isDesktop: initialIsDesktop,
    isTablet: initialIsTablet,
    isMobile: initialIsMobile,
    breakpoints: {
      tablet: TABLET_BREAKPOINT,
      desktop: DESKTOP_BREAKPOINT,
    }
  }
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Initialize i18n with Russian only
  useEffect(() => {
    // Ensure Russian is set as the language
    ensureRussianLanguage();
  }, []);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  const [darkMode, setDarkMode] = useState(systemColorScheme === 'dark');
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [dimensions, setDimensions] = useState(initialDimensions);
  
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
  
  // Load saved theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedDarkMode = await AsyncStorage.getItem('darkMode');
        if (savedDarkMode !== null) {
          setDarkMode(JSON.parse(savedDarkMode));
        } else {
          setDarkMode(systemColorScheme === 'dark');
        }
      } catch (error) {
        console.log('Failed to load theme preference:', error);
        setDarkMode(systemColorScheme === 'dark');
      } finally {
        setThemeLoaded(true);
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
            console.log('Theme changed to:', newDarkMode ? 'dark' : 'light');
            setDarkMode(newDarkMode);
          }
        }
        
        // Check for forced theme updates (especially for mobile)
        await AsyncStorage.getItem('themeUpdateTimestamp');
      } catch (error) {
        console.log('Error checking theme:', error);
      }
    };
    
    // Check for theme updates every 2 seconds
    const interval = setInterval(checkTheme, 2000);
    return () => clearInterval(interval);
  }, [darkMode]);
  
  // Calculate responsive flags based on current dimensions
  const isDesktop = Platform.OS === 'web' && dimensions.width >= DESKTOP_BREAKPOINT;
  const isTablet = Platform.OS === 'web' && dimensions.width >= TABLET_BREAKPOINT && dimensions.width < DESKTOP_BREAKPOINT;
  const isMobile = Platform.OS !== 'web' || dimensions.width < TABLET_BREAKPOINT;
  
  // Update theme with current responsive values
  const responsiveTheme = darkMode ? 
    {
      ...darkTheme,
      responsive: {
        ...darkTheme.responsive,
        isDesktop,
        isTablet,
        isMobile
      }
    } : 
    {
      ...lightTheme,
      responsive: {
        ...lightTheme.responsive,
        isDesktop,
        isTablet,
        isMobile
      }
    };
  
  // Navigation theme
  const theme = darkMode ? DarkTheme : DefaultTheme;
  
  if (!themeLoaded) {
    return null;
  }
  
  return (
    <SafeAreaProvider>
      <ThemeProvider value={theme}>
        <PaperProvider theme={responsiveTheme}>
          <StatusBar style={darkMode ? 'light' : 'dark'} />
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="notes/[id]"
              options={{
                presentation: 'modal',
                title: 'Note Details',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="tasks/[id]"
              options={{
                presentation: 'modal',
                title: 'Task Details',
                headerShown: false,
              }}
            />
          </Stack>
        </PaperProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

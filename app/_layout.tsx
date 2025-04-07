import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
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
import { ThemeProvider, useTheme } from '../app/context/ThemeContext';
import { Colors } from '../constants/Colors';

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
    primary: Colors.light.primary, 
    secondary: Colors.light.secondary,
    tertiary: Colors.light.accent,
    error: Colors.light.error,
    background: Colors.light.background,
    surface: Colors.light.surface,
    surfaceVariant: Colors.light.surfaceVariant,
    onSurface: Colors.light.text,
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
    primary: Colors.dark.primary,
    secondary: Colors.dark.secondary,
    tertiary: Colors.dark.accent,
    error: Colors.dark.error,
    background: Colors.dark.background,
    surface: Colors.dark.surface,
    surfaceVariant: Colors.dark.surfaceVariant,
    onSurface: Colors.dark.text,
    buttonBackground: `linear-gradient(to right, ${Colors.dark.primary}, ${Colors.light.secondary})`,
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
  
  // Calculate responsive flags based on current dimensions
  const isDesktop = Platform.OS === 'web' && dimensions.width >= DESKTOP_BREAKPOINT;
  const isTablet = Platform.OS === 'web' && dimensions.width >= TABLET_BREAKPOINT && dimensions.width < DESKTOP_BREAKPOINT;
  const isMobile = Platform.OS !== 'web' || dimensions.width < TABLET_BREAKPOINT;
  
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedContent 
          dimensions={dimensions}
          isDesktop={isDesktop}
          isTablet={isTablet}
          isMobile={isMobile}
        />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// Define type for ThemedContent props
interface ThemedContentProps {
  dimensions: {
    width: number;
    height: number;
  };
  isDesktop: boolean;
  isTablet: boolean;
  isMobile: boolean;
}

function ThemedContent({ dimensions, isDesktop, isTablet, isMobile }: ThemedContentProps) {
  const { isDarkMode } = useTheme();
  
  // Update theme with current responsive values
  const responsiveTheme = isDarkMode ? 
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
  const theme = isDarkMode ? DarkTheme : DefaultTheme;
  
  return (
    <NavigationThemeProvider value={theme}>
      <PaperProvider theme={responsiveTheme}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
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
          <Stack.Screen name="add-task" options={{ headerShown: false }} />
          <Stack.Screen name="edit-task" options={{ headerShown: false }} />
          <Stack.Screen 
            name="add-note" 
            options={{ 
              headerShown: false,
              presentation: 'modal',
              animation: 'slide_from_bottom',
              contentStyle: { backgroundColor: 'transparent' }
            }} 
          />
        </Stack>
      </PaperProvider>
    </NavigationThemeProvider>
  );
}

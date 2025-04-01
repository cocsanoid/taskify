import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ensureRussianLanguage } from '../utils/i18n';

export default function AuthLayout() {
  // Initialize Russian as the default language
  useEffect(() => {
    // Ensure Russian is set
    ensureRussianLanguage();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ title: 'Login', headerShown: false }} />
        <Stack.Screen name="register" options={{ title: 'Register', headerShown: false }} />
      </Stack>
    </>
  );
} 
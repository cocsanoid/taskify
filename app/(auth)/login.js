import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, ImageBackground, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { TextInput, Button, Headline, Surface } from 'react-native-paper';
import { router } from 'expo-router';
import { auth, loginUser } from '../utils/_firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ensureRussianLanguage } from '../utils/i18n';

export default function LoginScreen() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Force Russian as the only language
  useEffect(() => {
    // Ensure Russian is set
    ensureRussianLanguage();
  }, []);

  const handleLogin = async () => {
    // Reset any previous error messages
    setErrorMessage('');
    
    if (!email || !password) {
      setErrorMessage(t('auth.fillAllFields'));
      return;
    }

    try {
      setLoading(true);
      await loginUser(email, password);
      // After successful login, user will be redirected automatically
      router.replace('/(tabs)/home');
    } catch (error) {
      console.log('Login error:', error.code, error.message);
      
      // Show specific error messages based on error code
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
        // For non-existent users
        setErrorMessage(t('auth.incorrectCredentials')); // "Неверный email или пароль"
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        // For existing users with wrong password
        setErrorMessage(t('auth.incorrectCredentials')); // "Неверный email или пароль"
      } else {
        // Other errors
        setErrorMessage(t('auth.loginFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#121212', '#2d1846', '#3a1c5a']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeContainer}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.logoContainer}>
            <Ionicons name="list-circle" size={80} color="#9370db" />
            <Headline style={styles.title}>{t('auth.welcomeMessage')}</Headline>
            <Text style={styles.subtitle}>{t('auth.appSlogan')}</Text>
          </View>
        
          <Surface style={[styles.surface, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]}>
            <TextInput
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              left={<TextInput.Icon icon="email" />}
              theme={{ colors: { primary: '#6a0dad', text: '#000000', placeholder: '#555555', onSurfaceVariant: '#000000' } }}
              textColor="#000000"
            />
            
            <TextInput
              label={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              style={styles.input}
              secureTextEntry={secureTextEntry}
              right={
                <TextInput.Icon 
                  icon={secureTextEntry ? "eye" : "eye-off"}
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                />
              }
              left={<TextInput.Icon icon="lock" />}
              theme={{ colors: { primary: '#6a0dad', text: '#000000', placeholder: '#555555', onSurfaceVariant: '#000000' } }}
              textColor="#000000"
            />
            
            {errorMessage ? (
              <Text style={styles.errorMessage}>{errorMessage}</Text>
            ) : null}
            
            <Button 
              mode="contained" 
              onPress={handleLogin} 
              loading={loading}
              disabled={loading}
              style={styles.button}
              labelStyle={styles.buttonText}
              contentStyle={styles.buttonContent}
            >
              {t('auth.login')}
            </Button>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('auth.noAccount')}</Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.link}>{t('auth.signUp')}</Text>
              </TouchableOpacity>
            </View>
          </Surface>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeContainer: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  surface: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#b19cd9',
    marginTop: 5,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#000000',
  },
  button: {
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: '#6a0dad',
  },
  buttonText: {
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonContent: {
    height: 48,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    marginRight: 5,
    color: '#000000',
  },
  link: {
    fontWeight: 'bold',
    color: '#6a0dad',
  },
  errorMessage: {
    color: '#d32f2f',
    marginBottom: 10,
    textAlign: 'center',
  }
}); 
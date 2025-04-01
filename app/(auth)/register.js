import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView } from 'react-native';
import { TextInput, Button, Headline, Surface } from 'react-native-paper';
import { router } from 'expo-router';
import { auth, registerUser } from '../utils/_firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ensureRussianLanguage } from '../utils/i18n';

export default function RegisterScreen() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Force Russian as the only language
  useEffect(() => {
    // Ensure Russian is set
    ensureRussianLanguage();
  }, []);
  
  const handleRegister = async () => {
    // Reset any previous error message
    setErrorMessage('');
    
    if (!email || !password || !confirmPassword) {
      setErrorMessage(t('auth.fillAllFields'));
      return;
    }
    
    if (password !== confirmPassword) {
      setErrorMessage(t('auth.passwordsDoNotMatch'));
      return;
    }
    
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    
    try {
      setLoading(true);
      await registerUser(email, password);
      // After successful registration, user will be redirected automatically
      router.replace('/(tabs)');
    } catch (error) {
      console.log('Registration error:', error.code, error.message);
      
      // Check specifically for email-already-in-use error
      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage(t('auth.invalidCredentials'));
      } else {
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
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.logoContainer}>
              <Ionicons name="person-add" size={80} color="#9370db" />
              <Headline style={styles.title}>{t('auth.register')}</Headline>
              <Text style={styles.subtitle}>{t('auth.welcomeMessage')}</Text>
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
              
              <TextInput
                label={t('auth.confirmPassword')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="outlined"
                style={styles.input}
                secureTextEntry={secureConfirmTextEntry}
                right={
                  <TextInput.Icon 
                    icon={secureConfirmTextEntry ? "eye" : "eye-off"}
                    onPress={() => setSecureConfirmTextEntry(!secureConfirmTextEntry)}
                  />
                }
                left={<TextInput.Icon icon="lock-check" />}
                theme={{ colors: { primary: '#6a0dad', text: '#000000', placeholder: '#555555', onSurfaceVariant: '#000000' } }}
                textColor="#000000"
              />
              
              {errorMessage ? (
                <Text style={styles.errorMessage}>{errorMessage}</Text>
              ) : null}
              
              <Button 
                mode="contained" 
                onPress={handleRegister} 
                loading={loading}
                disabled={loading}
                style={styles.button}
                labelStyle={styles.buttonText}
                contentStyle={styles.buttonContent}
              >
                {t('auth.register')}
              </Button>
              
              <View style={styles.footer}>
                <Text style={styles.footerText}>{t('auth.haveAccount')}</Text>
                <TouchableOpacity onPress={() => router.push('/login')}>
                  <Text style={styles.link}>{t('auth.signIn')}</Text>
                </TouchableOpacity>
              </View>
            </Surface>
          </ScrollView>
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
  },
  scrollViewContent: {
    flexGrow: 1,
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
    alignSelf: 'stretch',
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
    color: '#ff3b30',
    marginBottom: 10,
    textAlign: 'center',
  }
}); 
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, ImageBackground, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { TextInput, Button, Headline, Surface } from 'react-native-paper';
import { router } from 'expo-router';
import { auth, loginUser, loginAsGuest } from '../utils/_firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ensureRussianLanguage } from '../utils/i18n';
import { useTheme } from '../../app/context/ThemeContext';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat } from 'react-native-reanimated';

// Create diagonal stripes component
const DiagonalStripes = ({ colors }) => {
  const stripeCount = 12;
  const animatedOpacity = useSharedValue(0.5);
  
  useEffect(() => {
    animatedOpacity.value = withRepeat(
      withTiming(0.8, { duration: 3000 }),
      -1,
      true
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: animatedOpacity.value,
    };
  });
  
  return (
    <View style={styles.stripesContainer}>
      {Array.from({ length: stripeCount }).map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.diagonalStripe,
            {
              backgroundColor: colors[index % colors.length],
              top: `${(index * 100) / stripeCount}%`,
            },
            animatedStyle,
          ]}
        />
      ))}
    </View>
  );
};

export default function LoginScreen() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const theme = useTheme();
  const windowWidth = Dimensions.get('window').width;
  const isMobile = windowWidth < 768;

  // Stripe colors
  const stripeColors = ['#7e41d4', '#3498db', '#9b59b6', '#5e20aa', '#8a2be2'];

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

  const handleGuestLogin = async () => {
    try {
      setLoading(true);
      const guestUser = await loginAsGuest();
      console.log('Guest login successful', guestUser);
      
      // Check if this is an offline guest user
      if (guestUser._isOfflineGuest) {
        console.log('Using offline guest mode');
      }
      
      // Navigate to the main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Guest login error:', error);
      Alert.alert(
        t('auth.error'), 
        t('auth.guestLoginFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background with diagonal stripes */}
      <LinearGradient
        colors={['#121212', '#1a1040', '#2d1846']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Animated diagonal stripes */}
      <DiagonalStripes colors={stripeColors} />
      
      <SafeAreaView style={styles.safeContainer}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.logoContainer}>
            <Animated.View style={styles.logoCircle}>
              <Ionicons name="list-circle" size={80} color="#ffffff" />
            </Animated.View>
            <Headline style={styles.title}>{t('auth.welcomeMessage')}</Headline>
            <Text style={styles.subtitle}>{t('auth.appSlogan')}</Text>
          </View>
        
          <Surface style={[
            styles.surface, 
            { 
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              width: isMobile ? '100%' : '80%',
              maxWidth: 450
            }
          ]}>
            <TextInput
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              left={<TextInput.Icon icon="email" />}
              theme={{ colors: { primary: '#7e41d4', text: '#000000', placeholder: '#555555', onSurfaceVariant: '#000000' } }}
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
              theme={{ colors: { primary: '#7e41d4', text: '#000000', placeholder: '#555555', onSurfaceVariant: '#000000' } }}
              textColor="#000000"
            />
            
            {errorMessage ? (
              <Text style={styles.errorMessage}>{errorMessage}</Text>
            ) : null}
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#7e41d4' }]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.buttonText}>{loading ? t('common.loading') : 'Вход'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.guestButton, { backgroundColor: '#3498db' }]}
                onPress={handleGuestLogin}
                disabled={loading}
              >
                <Text style={styles.guestButtonText}>Войти как гость</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('auth.noAccount')}</Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.link}>{t('auth.signUp')}</Text>
              </TouchableOpacity>
            </View>
          </Surface>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stripesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  diagonalStripe: {
    position: 'absolute',
    left: '-100%',
    width: '200%',
    height: 40,
    transform: [{ rotate: '-25deg' }],
  },
  safeContainer: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(126, 65, 212, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
  },
  surface: {
    padding: 24,
    borderRadius: 16,
    elevation: 8,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
    color: '#ffffff',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#b19cd9',
    marginTop: 8,
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#000000',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginTop: 24,
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    elevation: 3,
    boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.2)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  guestButton: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 3,
    boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.2)',
  },
  guestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
    color: '#7e41d4',
    fontWeight: 'bold',
  },
  errorMessage: {
    color: '#ff3b30',
    marginBottom: 10,
    textAlign: 'center',
  },
}); 
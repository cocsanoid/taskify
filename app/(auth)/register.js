import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { TextInput, Button, Headline, Surface } from 'react-native-paper';
import { router } from 'expo-router';
import { auth, registerUser } from '../utils/_firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ensureRussianLanguage } from '../utils/i18n';
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

export default function RegisterScreen() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const windowWidth = Dimensions.get('window').width;
  const isMobile = windowWidth < 768;
  
  // Stripe colors
  const stripeColors = ['#7e41d4', '#3498db', '#9b59b6', '#5e20aa', '#8a2be2'];
  
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
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.logoContainer}>
              <Animated.View style={styles.logoCircle}>
                <Ionicons name="person-add" size={70} color="#ffffff" />
              </Animated.View>
              <Headline style={styles.title}>{t('auth.register')}</Headline>
              <Text style={styles.subtitle}>{t('auth.welcomeMessage')}</Text>
            </View>
          
            <Surface style={[
              styles.surface, 
              { 
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                width: isMobile ? '100%' : '80%',
                maxWidth: 450,
                alignSelf: 'center'
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
                theme={{ colors: { primary: '#7e41d4', text: '#000000', placeholder: '#555555', onSurfaceVariant: '#000000' } }}
                textColor="#000000"
              />
              
              {errorMessage ? (
                <Text style={styles.errorMessage}>{errorMessage}</Text>
              ) : null}
              
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#7e41d4' }]}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? t('common.loading') : t('auth.register')}
                </Text>
              </TouchableOpacity>
              
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
  buttonContent: {
    height: 50,
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
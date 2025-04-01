import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, Platform, Dimensions } from 'react-native';
import { Appbar, Card, Title, Button, Text, useTheme, Switch } from 'react-native-paper';
import { router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { auth, db, updateUserPreferences, getUserPreferences } from '../utils/_firebase';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const currentTheme = useTheme();
  const systemColorScheme = useColorScheme();
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const isDesktop = Platform.OS === 'web' && dimensions.width >= 1024;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/(auth)/login');
      } else {
        setUser(user);
        
        // Load user preferences
        try {
          const preferences = await getUserPreferences(user.uid);
          if (preferences) {
            // If theme preference exists, use it; otherwise use system default
            const savedTheme = preferences.darkMode;
            if (savedTheme !== undefined) {
              setDarkMode(savedTheme);
            } else {
              setDarkMode(systemColorScheme === 'dark');
            }
          } else {
            // No preferences yet, use system theme
            setDarkMode(systemColorScheme === 'dark');
          }
        } catch (error) {
          console.error('Error loading preferences:', error);
          // Use system theme as fallback
          setDarkMode(systemColorScheme === 'dark');
        }
        
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Save theme mode to AsyncStorage when it changes
    if (user && !loading) {
      AsyncStorage.setItem('darkMode', JSON.stringify(darkMode))
        .catch(error => console.error('Error saving theme preference:', error));
      
      // Update theme in Firebase
      updateUserPreferences(user.uid, { darkMode })
        .catch(error => console.error('Error updating theme preference in Firebase:', error));
    }
  }, [darkMode, user, loading]);

  // Listen for dimension changes
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions(Dimensions.get('window'));
    };
    
    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => {
      subscription.remove();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const toggleTheme = (value) => {
    setDarkMode(value);
    
    // Save immediately to AsyncStorage for faster theme switching across app
    AsyncStorage.setItem('darkMode', JSON.stringify(value))
      .catch(error => console.error('Error saving theme preference:', error));
    
    // Force theme update in parent layout component
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      // Additional step for mobile platforms
      setTimeout(() => {
        // This forces a re-render across components listening for theme changes
        AsyncStorage.setItem('themeUpdateTimestamp', Date.now().toString());
      }, 100);
    }
  };

  if (!user || loading) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
        <Appbar.Header>
          <Appbar.Content title={t('profile.title')} />
        </Appbar.Header>
        <View style={styles.centered}>
          <Text style={{ color: currentTheme.colors.onBackground }}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <Appbar.Header>
        <Appbar.Content title={t('profile.title')} />
      </Appbar.Header>

      <View style={[styles.content, isDesktop && styles.desktopContent]}>
        <Card style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.title, { color: currentTheme.colors.onSurface }]}>{t('profile.userProfile')}</Title>
            <Text style={[styles.email, { color: currentTheme.colors.onSurface }]}>{t('profile.email')} {user.email}</Text>
            {user.metadata ? (
              <>
                <Text style={[styles.detail, { color: currentTheme.colors.onSurface }]}>
                  {t('auth.accountCreatedOn')} {new Date(user.metadata.creationTime).toLocaleDateString('ru-RU')}
                </Text>
                <Text style={[styles.detail, { color: currentTheme.colors.onSurface }]}>
                  {t('auth.lastSignIn')} {new Date(user.metadata.lastSignInTime).toLocaleDateString('ru-RU')}
                </Text>
              </>
            ) : null}
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.title, { color: currentTheme.colors.onSurface }]}>{t('profile.preferences')}</Title>
            
            <View style={[styles.preferenceRow, { borderBottomColor: currentTheme.dark ? 'rgba(255,255,255,0.1)' : '#e0e0e0' }]}>
              <Text style={[styles.preferenceText, { color: currentTheme.colors.onSurface }]}>{t('profile.darkMode')}</Text>
              <Switch
                value={darkMode}
                onValueChange={toggleTheme}
                color={currentTheme.colors.primary}
              />
            </View>
          </Card.Content>
        </Card>

        <Button 
          mode="contained" 
          onPress={handleLogout}
          style={[styles.button, { backgroundColor: currentTheme.colors.error }]}
        >
          {t('auth.logout')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    marginLeft: 0,
    marginRight: 0,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 120 : 100, // Extra padding for bottom tabs
  },
  desktopContent: {
    maxWidth: 800,
    alignSelf: 'center',
    paddingHorizontal: 32,
  },
  card: {
    marginBottom: 20,
    width: '100%',
  },
  title: {
    fontSize: 20,
    marginBottom: 16,
  },
  email: {
    fontSize: 16,
    marginBottom: 12,
  },
  detail: {
    marginBottom: 8,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  preferenceText: {
    fontSize: 16,
  },
  button: {
    marginTop: 20,
  },
}); 
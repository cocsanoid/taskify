import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  Platform, 
  Dimensions,
  Alert,
  TouchableOpacity,
  useColorScheme
} from 'react-native';
import { 
  Appbar, 
  Text, 
  Card, 
  IconButton, 
  FAB, 
  Dialog, 
  Portal, 
  Button, 
  TextInput,
  Divider,
  Surface,
  useTheme,
  ActivityIndicator
} from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { auth, db } from '../utils/_firebase';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, where, increment, Timestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TabAppBar from '../components/TabAppBar';
import PageBackground from '../../components/PageBackground';
import TabBackground from '../components/TabBackground';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import ThemeAwareView from '../components/ThemeAwareView';

export default function HabitsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isDarkMode } = useCustomTheme();
  const systemColorScheme = useColorScheme();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [lastUpdated, setLastUpdated] = useState('0');

  // Create fallback colors in case theme.colors.habitsTab is undefined
  const habitsTabColors = useMemo(() => theme.colors.habitsTab || {
    primary: theme.colors.primary,
    secondary: theme.colors.secondary
  }, [theme.colors]);

  // Add responsive state
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const isDesktop = Platform.OS === 'web' && dimensions.width >= 1024;
  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  
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

  useEffect(() => {
    loadHabits();
    
    // Set up polling to check for changes in habits
    const checkForUpdates = async () => {
      try {
        const lastUpdatedTimestamp = await AsyncStorage.getItem('habitsLastUpdated');
        if (lastUpdatedTimestamp && lastUpdatedTimestamp !== lastUpdated) {
          setLastUpdated(lastUpdatedTimestamp);
          loadHabits();
        }
      } catch (error) {
        console.error('Error checking for habit updates:', error);
      }
    };
    
    const intervalId = setInterval(checkForUpdates, 1000);
    return () => clearInterval(intervalId);
  }, [lastUpdated]);

  const handleMenuOpen = () => {
    // Handle menu open action
    console.log('Habits menu opened');
  };

  const loadHabits = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      
      // Check if user is logged in before querying
      if (!userId) {
        console.log('User not authenticated, skipping habits loading');
        setHabits([]);
        return;
      }
      
      const habitsRef = collection(db, 'habits');
      const q = query(habitsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const loadedHabits = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setHabits(loadedHabits);
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const addHabit = async () => {
    if (!newHabitTitle.trim()) return;
    
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      
      // Check if user is logged in
      if (!userId) {
        console.error('Cannot add habit: User not authenticated');
        return;
      }
      
      const habitsRef = collection(db, 'habits');
      await addDoc(habitsRef, {
        title: newHabitTitle.trim(),
        userId: userId,
        streak: 0,
        lastCompleted: null,
        createdAt: Timestamp.now()
      });
      
      // Notify other components about the change
      await AsyncStorage.setItem('habitsLastUpdated', Date.now().toString());
      
      setNewHabitTitle('');
      setDialogVisible(false);
      loadHabits();
    } catch (error) {
      console.error('Error adding habit:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeHabit = async (habitId) => {
    try {
      const habitRef = doc(db, 'habits', habitId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      await updateDoc(habitRef, {
        lastCompleted: Timestamp.fromDate(today),
        streak: increment(1)
      });
      
      // Update local state
      setHabits(habits.map(habit => 
        habit.id === habitId 
          ? { ...habit, lastCompleted: Timestamp.fromDate(today), streak: habit.streak + 1 }
          : habit
      ));
      
      // Notify other components about the change
      await AsyncStorage.setItem('habitsLastUpdated', Date.now().toString());
    } catch (error) {
      console.error('Error completing habit:', error);
    }
  };

  const deleteHabit = async (habitId) => {
    try {
      await deleteDoc(doc(db, 'habits', habitId));
      
      // Update local state
      setHabits(habits.filter(habit => habit.id !== habitId));
      
      // Notify other components about the change
      await AsyncStorage.setItem('habitsLastUpdated', Date.now().toString());
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  const confirmDeleteHabit = (habit) => {
    if (Platform.OS === 'web') {
      if (window.confirm(t('habits.confirmDelete'))) {
        deleteHabit(habit.id);
      }
    } else {
      Alert.alert(
        t('habits.deleteHabit'),
        t('habits.confirmDeleteMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.delete'), onPress: () => deleteHabit(habit.id), style: 'destructive' }
        ]
      );
    }
  };

  const renderHabitItem = ({ item }) => {
    const isCompletedToday = item.lastCompleted ? 
      new Date(item.lastCompleted.seconds * 1000).toDateString() === new Date().toDateString() : 
      false;
    
    return (
      <Card 
        style={[
          styles.habitCard, 
          { 
            backgroundColor: theme.colors.surface,
            width: '100%',
            alignSelf: 'center',
            borderLeftWidth: 4,
            borderLeftColor: isCompletedToday ? '#4CAF50' : habitsTabColors.primary,
          }
        ]}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.habitHeader}>
            <Text style={[styles.habitTitle, { color: theme.colors.onSurface }]}>
              {item.title}
            </Text>
            <View style={styles.streakContainer}>
              <IconButton 
                icon="flash" 
                size={20} 
                iconColor={habitsTabColors.primary} 
                style={{ margin: 0 }}
              />
              <Text style={[styles.streakText, { color: habitsTabColors.primary }]}>
                {item.streak} {t('habits.streak')}
              </Text>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.habitActions}>
            <Button
              mode={isCompletedToday ? "contained" : "outlined"}
              onPress={() => completeHabit(item.id)}
              icon="check"
              disabled={isCompletedToday}
              style={styles.completeButton}
              buttonColor={isCompletedToday ? habitsTabColors.primary : undefined}
            >
              {isCompletedToday ? t('habits.completed') : t('habits.markComplete')}
            </Button>
            
            <IconButton
              icon="delete"
              size={24}
              onPress={() => confirmDeleteHabit(item)}
              iconColor={theme.colors.error}
              style={{ margin: 0 }}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  // Optimize text input handler
  const handleHabitTitleChange = useCallback((text) => {
    setNewHabitTitle(text);
  }, []);

  return (
    <ThemeAwareView tabName="habits">
      <TabAppBar title={t('habits.title')} tabName="habits" />
      <View style={styles.container}>
        <PageBackground pageName="habits" />
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        {loading && habits.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={habitsTabColors.primary} />
          </View>
        ) : habits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              {t('habits.noHabits')}
            </Text>
            <Button 
              mode="contained" 
              onPress={() => setDialogVisible(true)}
              icon="plus"
              style={styles.emptyButton}
              buttonColor={habitsTabColors.primary}
            >
              {t('habits.addFirst')}
            </Button>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <FlatList
              data={habits}
              renderItem={renderHabitItem}
              keyExtractor={item => item.id}
              contentContainerStyle={[
                styles.list,
                isDesktop && styles.desktopList
              ]}
              refreshing={loading}
              onRefresh={loadHabits}
            />
          </View>
        )}
        
        {habits.length > 0 && (
          <FAB
            icon="plus"
            style={[styles.fab, { backgroundColor: '#FF69B4' }]}
            onPress={() => setDialogVisible(true)}
            color="#fff"
            label={t('habits.addNew')}
          />
        )}
        
        <Portal>
          <Dialog 
            visible={dialogVisible} 
            onDismiss={() => setDialogVisible(false)}
            style={{ backgroundColor: theme.colors.surface }}
          >
            <Dialog.Title>{t('habits.addNewHabit')}</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label={t('habits.habitTitle')}
                value={newHabitTitle}
                onChangeText={handleHabitTitleChange}
                mode="outlined"
                style={{ marginBottom: 10 }}
                maxLength={50}
                autoFocus
                selectTextOnFocus
                returnKeyType="done"
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDialogVisible(false)}>{t('common.cancel')}</Button>
              <Button onPress={addHabit}>{t('common.add')}</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </ThemeAwareView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    marginTop: 8,
  },
  listContainer: {
    flex: 1,
    width: '100%',
  },
  list: {
    padding: 16,
    paddingLeft: 16,
    paddingRight: 16,
  },
  desktopList: {
    maxWidth: 1000,
    alignSelf: 'center',
    paddingHorizontal: 50,
  },
  habitCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 8,
    ...(Platform.OS === 'web' 
      ? {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
        } 
      : {
          // Native shadow properties for Android/iOS
          elevation: 2,
        }
    ),
  },
  cardContent: {
    padding: 8,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  habitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  streakText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 8,
  },
  habitActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  completeButton: {
    flex: 1,
    marginRight: 8,
    borderRadius: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  dialogInput: {
    marginTop: 8,
  },
}); 
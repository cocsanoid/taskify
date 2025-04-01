import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { 
  Card, 
  Text, 
  Appbar, 
  ActivityIndicator, 
  List, 
  Divider, 
  Badge,
  Checkbox,
  Button,
  useTheme,
  IconButton
} from 'react-native-paper';
import { router } from 'expo-router';
import { auth, getTasks, updateTask } from '../utils/_firebase';
import { StatusBar } from 'expo-status-bar';
import { format, startOfWeek, addDays, isSameDay, isToday, isTomorrow, isPast, isAfter } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { ru, enUS } from 'date-fns/locale';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('0');

  // Add responsive state
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const isDesktop = Platform.OS === 'web' && dimensions.width >= 1024;
  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  
  // Get current locale for date formatting
  const currentLocale = i18n.language === 'ru' ? ru : enUS;
  
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
    fetchTasks();
    
    // Set up polling to check for changes in tasks from other screens
    const checkForUpdates = async () => {
      try {
        const lastUpdatedTimestamp = await AsyncStorage.getItem('tasksLastUpdated');
        if (lastUpdatedTimestamp && lastUpdatedTimestamp !== lastUpdated) {
          setLastUpdated(lastUpdatedTimestamp);
          fetchTasks();
        }
      } catch (error) {
        console.error('Error checking for task updates:', error);
      }
    };
    
    const intervalId = setInterval(checkForUpdates, 1000);
    return () => clearInterval(intervalId);
  }, [lastUpdated]);

  useEffect(() => {
    if (!tasks.length) return;

    // Filter tasks for the selected date
    const tasksForDate = tasks.filter(task => {
      if (!task.dueDate) return false;
      
      const taskDueDate = task.dueDate instanceof Date 
        ? task.dueDate 
        : new Date(task.dueDate);
      
      return isSameDay(taskDueDate, selectedDate);
    });
    
    setFilteredTasks(tasksForDate);

    // Get upcoming tasks for next 7 days, sorted by due date
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const upcoming = tasks
      .filter(task => {
        if (!task.dueDate || task.completed) return false;
        
        const taskDueDate = task.dueDate instanceof Date 
          ? task.dueDate 
          : new Date(task.dueDate);
          
        // Only include tasks due today or in the future
        return !isPast(taskDueDate) || isToday(taskDueDate);
      })
      .sort((a, b) => {
        const aDate = a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate);
        const bDate = b.dueDate instanceof Date ? b.dueDate : new Date(b.dueDate);
        return aDate - bDate;
      });
      
    setUpcomingTasks(upcoming);
  }, [tasks, selectedDate]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) {
        router.replace('/(auth)/login');
        return;
      }
      
      const fetchedTasks = await getTasks(userId);
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const toggleTaskCompleted = async (taskId, completed) => {
    try {
      await updateTask(taskId, { completed: !completed });
      // Update the local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, completed: !completed } : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // This function is now for display only, not for toggling completion
  const renderTaskCompletion = (task) => (
    <View style={{ width: 40 }} />
  );

  const formatDueDate = (dueDate) => {
    if (!dueDate) return null;
    
    const date = dueDate instanceof Date ? dueDate : new Date(dueDate);
    // Check if date is valid
    if (isNaN(date.getTime())) return null;
    
    if (isToday(date)) return { text: t('tasks.today'), color: theme.colors.primary };
    if (isTomorrow(date)) return { text: t('tasks.tomorrow'), color: theme.colors.secondary };
    if (isPast(date)) return { text: t('tasks.pastDue'), color: theme.colors.error };
    
    // Return formatted date for other days
    return { 
      text: format(date, 'MMM d', { locale: currentLocale }), 
      color: theme.colors.tertiary
    };
  };

  const renderWeekCalendar = () => {
    const startDate = startOfWeek(new Date(), { weekStartsOn: 1 }); // Start from Monday
    const weekDays = [];
    
    for (let i = 0; i < 7; i++) {
      const date = addDays(startDate, i);
      weekDays.push(date);
    }

    return (
      <Card style={[styles.calendarCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>{t('tasks.thisWeek')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.weekContainer}>
              {weekDays.map((date, index) => {
                const isSelected = isSameDay(date, selectedDate);
                const isCurrentDay = isToday(date);
                
                // Check if there are tasks for this day
                const hasTask = tasks.some(task => {
                  if (!task.dueDate) return false;
                  const taskDate = task.dueDate instanceof Date 
                    ? task.dueDate 
                    : new Date(task.dueDate);
                  return isSameDay(taskDate, date);
                });
                
                return (
                  <Button
                    key={index}
                    mode={isSelected ? "contained" : "outlined"}
                    onPress={() => handleDateSelect(date)}
                    labelStyle={[
                      styles.dayLabel,
                      isCurrentDay && !isSelected && { color: theme.colors.primary }
                    ]}
                    style={[
                      styles.dayButton,
                      isSelected && { backgroundColor: theme.colors.primary }
                    ]}
                  >
                    <Text style={[
                      styles.dayText,
                      isSelected && { color: 'white' },
                      !isSelected && isCurrentDay && { color: theme.colors.primary }
                    ]}>
                      {isMobile 
                        ? format(date, 'EEEE', { locale: currentLocale }) 
                        : format(date, 'EEE', { locale: currentLocale })}
                    </Text>
                    <Text style={[
                      styles.dateText,
                      isSelected && { color: 'white' },
                      !isSelected && isCurrentDay && { color: theme.colors.primary }
                    ]}>
                      {format(date, 'd', { locale: currentLocale })}
                    </Text>
                    {hasTask && !isSelected && (
                      <View 
                        style={[
                          styles.taskDot,
                          { backgroundColor: isCurrentDay ? theme.colors.primary : theme.colors.tertiary }
                        ]} 
                      />
                    )}
                  </Button>
                );
              })}
            </View>
          </ScrollView>
        </Card.Content>
      </Card>
    );
  };

  const renderDayTasks = () => {
    if (filteredTasks.length === 0) {
      return (
        <Card style={[styles.noTasksCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.centeredContent}>
            <Text style={{ color: theme.colors.onSurface }}>
              {t('tasks.noTasksFor', { date: format(selectedDate, 'EEEE, MMMM d', { locale: currentLocale }) })}
            </Text>
          </Card.Content>
        </Card>
      );
    }

    return (
      <Card style={[styles.tasksCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {isToday(selectedDate) 
              ? t('tasks.todaysTasks')
              : t('tasks.tasksFor', { date: format(selectedDate, 'EEEE, MMMM d', { locale: currentLocale }) })}
          </Text>
          <View>
            {filteredTasks.map((task) => (
              <List.Item
                key={task.id}
                title={task.title}
                description={task.description}
                left={() => renderTaskCompletion(task)}
                right={() => {
                  const dueDate = formatDueDate(task.dueDate);
                  return dueDate ? (
                    <View style={styles.dueDateContainer}>
                      <Text style={{ color: dueDate.color }}>{dueDate.text}</Text>
                    </View>
                  ) : null;
                }}
                style={[
                  styles.taskItem,
                  task.completed ? styles.completedTask : null,
                  { backgroundColor: theme.colors.surface }
                ]}
                titleStyle={task.completed ? styles.completedTaskText : null}
                descriptionStyle={task.completed ? styles.completedTaskText : null}
              />
            ))}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderUpcomingTasks = () => {
    if (upcomingTasks.length === 0) {
      return (
        <Card style={[styles.noTasksCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.centeredContent}>
            <Text style={{ color: theme.colors.onSurface }}>Нет предстоящих задач</Text>
          </Card.Content>
        </Card>
      );
    }

    return (
      <Card style={[styles.tasksCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Предстоящие задачи
          </Text>
          {loading ? (
            <ActivityIndicator animating={true} color={theme.colors.primary} />
          ) : upcomingTasks.length > 0 ? (
            upcomingTasks.slice(0, 5).map(task => {
              const dueDate = formatDueDate(task.dueDate);
              return (
                <List.Item
                  key={task.id}
                  title={task.title}
                  description={task.description}
                  left={() => renderTaskCompletion(task)}
                  right={() => (
                    dueDate ? (
                      <View style={styles.dueDateContainer}>
                        <Text style={{ color: dueDate.color }}>{dueDate.text}</Text>
                      </View>
                    ) : null
                  )}
                  style={[
                    styles.taskItem,
                    { backgroundColor: theme.colors.surface }
                  ]}
                />
              );
            })
          ) : (
            <Card style={[styles.noTasksCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={styles.centeredContent}>
                <Text style={{ color: theme.colors.onSurface }}>Нет предстоящих задач</Text>
              </Card.Content>
            </Card>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={[
      styles.container, 
      { backgroundColor: theme.colors.background }
    ]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Appbar.Header 
        elevated
        style={{ 
          backgroundColor: theme.dark ? '#000000' : '#FFFFFF',
        }}
      >
        <Appbar.Content 
          title="Моя панель" 
          titleStyle={{ 
            color: theme.dark ? '#FFFFFF' : '#000000' 
          }} 
        />
        <Appbar.Action 
          icon="refresh" 
          color={theme.dark ? '#FFFFFF' : '#000000'} 
        />
      </Appbar.Header>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContainer,
            { backgroundColor: theme.colors.background },
            // Add additional padding on desktop
            isDesktop && styles.desktopScrollContainer
          ]}
          showsVerticalScrollIndicator={false}
        >
          {renderWeekCalendar()}
          {renderDayTasks()}
          {renderUpcomingTasks()}
          
          {/* Spacer for bottom nav */}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%', // Ensure full width
    marginLeft: 0, // Reset any margins
    marginRight: 0,
  },
  scrollContainer: {
    paddingHorizontal: 16, // Add consistent horizontal padding
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100, // Extra padding for bottom tabs
    alignItems: 'stretch', // Ensure content stretches full width
    width: '100%',
  },
  desktopScrollContainer: {
    maxWidth: 1200, // Limit width on large screens
    alignSelf: 'center', // Center content on large screens
    paddingHorizontal: 32, // More padding on desktop
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tasksContainer: {
    flex: 1, 
    width: '100%', // Ensure full width
  },
  calendarCard: {
    marginBottom: 16,
    width: '100%', // Ensure full width
    marginLeft: 0, // Reset any margins
    marginRight: 0,
  },
  card: {
    marginBottom: 16,
    width: '100%', // Ensure full width
    marginLeft: 0, // Reset any margins
    marginRight: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dayButton: {
    marginRight: 8,
    width: Platform.OS === 'ios' || Platform.OS === 'android' ? 100 : 64,
    height: 80,
    justifyContent: 'center',
  },
  dayLabel: {
    fontSize: 12,
  },
  dayText: {
    fontSize: 12,
    textAlign: 'center',
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  taskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  centeredContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  badge: {
    alignSelf: 'center',
  },
  tasksCard: {
    marginBottom: 16,
    elevation: 2,
  },
  noTasksCard: {
    marginBottom: 16,
    elevation: 2,
    minHeight: 100,
  },
  taskMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskItem: {
    padding: 16,
  },
  completedTask: {
    opacity: 0.7,
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  infoCard: {
    margin: 16,
    marginTop: 16,
    marginBottom: 8,
  },
}); 
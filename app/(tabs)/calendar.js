import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Platform, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Appbar, Text, List, Divider, ActivityIndicator, FAB, useTheme, Chip } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { router } from 'expo-router';
import { auth, getTasks } from '../utils/_firebase';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export default function CalendarScreen() {
  // Initialize with UTC date at noon
  const today = new Date();
  const initialDate = new Date(Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    12, 0, 0, 0
  ));
  
  const [selectedDate, setSelectedDate] = useState(initialDate.toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState({});
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme(); // Get theme from React-Native-Paper
  const [themeVersion, setThemeVersion] = useState(0); // Track theme version for forcing re-renders
  
  // Add responsive state
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const isDesktop = Platform.OS === 'web' && dimensions.width >= 1024;
  
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

  // Monitor theme changes directly from AsyncStorage
  useFocusEffect(
    useCallback(() => {
      // Increment theme version to force a re-render when screen comes into focus
      setThemeVersion(v => v + 1);
      
      let lastTheme = null;
      const checkThemeChanges = async () => {
        try {
          // Check for actual theme changes
          const savedDarkMode = await AsyncStorage.getItem('darkMode');
          if (savedDarkMode !== null && savedDarkMode !== lastTheme) {
            lastTheme = savedDarkMode;
            setThemeVersion(v => v + 1);
          }
        } catch (error) {
          console.error('Failed to check theme:', error);
        }
      };
      
      // Check immediately
      checkThemeChanges();
      
      // Use a more reasonable interval to reduce constant re-renders
      const interval = setInterval(checkThemeChanges, 1000);
      return () => clearInterval(interval);
    }, [])
  );

  // Update when theme object changes, but throttle it
  const prevThemeRef = React.useRef(null);
  useEffect(() => {
    // Only update if the theme dark mode value has actually changed
    if (prevThemeRef.current !== theme.dark) {
      prevThemeRef.current = theme.dark;
      setThemeVersion(v => v + 1);
      fetchTasks();
    }
  }, [theme]);

  // Use useFocusEffect to refresh tasks when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [])
  );

  useEffect(() => {
    // Filter tasks for the selected date
    if (selectedDate && tasks.length > 0) {
      const tasksForDate = tasks.filter(task => {
        if (!task.dueDate) return false;
        
        // Convert firebase timestamp to UTC date string
        const taskDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
        const taskUTCDate = new Date(Date.UTC(
          taskDate.getFullYear(),
          taskDate.getMonth(),
          taskDate.getDate(),
          12, 0, 0, 0
        ));
        const taskDateStr = taskUTCDate.toISOString().split('T')[0];
        
        return taskDateStr === selectedDate;
      });
      
      setFilteredTasks(tasksForDate);
    } else {
      setFilteredTasks([]);
    }
  }, [selectedDate, tasks]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      
      const fetchedTasks = await getTasks(userId);
      setTasks(fetchedTasks);
      
      // Create marked dates object for calendar
      const dates = {};
      fetchedTasks.forEach(task => {
        if (task.dueDate) {
          const taskDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
          const taskUTCDate = new Date(Date.UTC(
            taskDate.getFullYear(),
            taskDate.getMonth(),
            taskDate.getDate(),
            12, 0, 0, 0
          ));
          const dateStr = taskUTCDate.toISOString().split('T')[0];
          
          dates[dateStr] = { 
            marked: true, 
            dotColor: theme.colors.primary,
          };
        }
      });
      
      // Mark selected date
      if (selectedDate) {
        dates[selectedDate] = {
          ...dates[selectedDate],
          selected: true,
          selectedColor: theme.colors.primary,
        };
      }
      
      setMarkedDates(dates);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDayPress = (day) => {
    // Update selected date
    const newSelectedDate = day.dateString;
    setSelectedDate(newSelectedDate);
    
    // Update marked dates to show selection
    const updatedMarkedDates = { ...markedDates };
    
    // Remove selection from previously selected date
    Object.keys(updatedMarkedDates).forEach(dateString => {
      if (updatedMarkedDates[dateString].selected) {
        updatedMarkedDates[dateString] = {
          ...updatedMarkedDates[dateString],
          selected: false,
        };
      }
    });
    
    // Mark new selected date
    updatedMarkedDates[newSelectedDate] = {
      ...updatedMarkedDates[newSelectedDate],
      selected: true,
      selectedColor: theme.colors.primary,
    };
    
    setMarkedDates(updatedMarkedDates);
  };

  const renderTaskItem = ({ item }) => {
    // Определение цвета категории
    const getCategoryColor = (category) => {
      if (!category || category === 'noCategory') return theme.colors.primary;
      
      switch(category) {
        case 'work': return '#4285F4';
        case 'personal': return '#EA4335';
        case 'shopping': return '#FBBC05';
        case 'health': return '#34A853';
        case 'education': return '#9C27B0';
        case 'finance': return '#00BCD4';
        case 'other': return '#607D8B';
        default: return theme.colors.primary;
      }
    };
    
    // Получение названия категории
    const getCategoryName = (category) => {
      if (!category || category === 'noCategory') return '';
      
      const categories = {
        work: 'Работа',
        personal: 'Личное',
        shopping: 'Покупки',
        health: 'Здоровье',
        education: 'Образование',
        finance: 'Финансы',
        other: 'Другое'
      };
      
      return categories[category] || '';
    };
    
    const categoryName = getCategoryName(item.category);
    
    return (
      <List.Item
        title={item.title}
        description={item.description}
        titleStyle={[
          item.completed ? styles.completedText : null,
          { color: theme.colors.onBackground }
        ]}
        descriptionStyle={[
          item.completed ? styles.completedText : null,
          { color: theme.colors.onSurfaceVariant }
        ]}
        left={props => (
          <List.Icon 
            {...props} 
            icon={item.completed ? "check-circle" : "circle-outline"} 
            color={item.completed ? theme.colors.primary : theme.colors.onSurfaceVariant} 
          />
        )}
        right={props => (
          <View style={styles.itemRightContainer}>
            {categoryName ? (
              <Chip 
                mode="flat" 
                style={[styles.categoryChip, { backgroundColor: getCategoryColor(item.category) }]}
                textStyle={{ color: 'white', fontSize: 12 }}
              >
                {categoryName}
              </Chip>
            ) : null}
            {item.priority === 'high' && (
              <View style={[styles.priorityIndicator, { backgroundColor: "#FF5252" }]} />
            )}
          </View>
        )}
        style={[styles.taskItem, { backgroundColor: theme.colors.surface }]}
      />
    );
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: theme.colors.background }
    ]}>
      <Appbar.Header>
        <Appbar.Content title="Calendar" />
      </Appbar.Header>
      
      <View style={[
        styles.calendarContainer,
        isDesktop && styles.desktopCalendarContainer,
        { 
          backgroundColor: theme.dark ? theme.colors.background : '#FFFFFF', 
          borderRadius: 10,
          borderColor: theme.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          margin: 8,
          minHeight: 380 // Add minimum height to prevent layout shifts
        }
      ]}>
<Calendar
  key={`calendar-${themeVersion}`} // Use themeVersion in key to force complete re-render
  onDayPress={handleDayPress}
  markedDates={markedDates}
  theme={{
    // Theme colors with explicit dark mode handling
    calendarBackground: theme.dark ? theme.colors.background : '#FFFFFF',
    backgroundColor: theme.dark ? theme.colors.background : '#FFFFFF',
    monthTextColor: theme.dark ? '#ffffff' : theme.colors.onSurface,
    textSectionTitleColor: theme.dark ? '#ffffff' : theme.colors.onSurface,
    textMonthFontSize: 18,
    dayTextColor: theme.dark ? '#ffffff' : theme.colors.onSurface,
    textDayFontSize: 16,
    textDisabledColor: theme.dark ? '#777777' : '#CCCCCC',
    selectedDayBackgroundColor: theme.colors.primary,
    selectedDayTextColor: '#ffffff',
    todayTextColor: theme.colors.primary,
    arrowColor: theme.colors.primary,
    dotColor: theme.colors.primary,
    
    // Style header with explicit dark theme handling
    'stylesheet.calendar.header': {
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.dark ? theme.colors.background : '#FFFFFF',
        paddingVertical: 12,
        paddingHorizontal: 16,
      },
      monthText: {
        color: theme.dark ? '#ffffff' : theme.colors.onSurface,
        fontSize: 18,
        fontWeight: '600',
      },
      dayHeader: {
        color: theme.dark ? '#ffffff' : theme.colors.onSurface,
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
      },
      arrow: {
        padding: 10,
      },
    },
    
    // Style main calendar with explicit dark theme handling
    'stylesheet.calendar.main': {
      container: {
        backgroundColor: theme.dark ? theme.colors.background : '#FFFFFF',
      },
      week: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: theme.dark ? theme.colors.background : '#FFFFFF',
      }
    },
    
    // Style days with explicit dark theme handling
    'stylesheet.day.basic': {
      base: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
        backgroundColor: theme.dark ? theme.colors.background : 'transparent',
      },
      text: {
        color: theme.dark ? '#ffffff' : theme.colors.onSurface,
        fontWeight: '400',
      },
      today: {
        borderWidth: 1,
        borderColor: theme.colors.primary,
      },
      todayText: {
        color: theme.colors.primary,
        fontWeight: '500',
      },
      selected: {
        backgroundColor: theme.colors.primary,
      },
      selectedText: {
        color: '#FFFFFF',
        fontWeight: '500',
      },
      disabledText: {
        color: theme.dark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
      },
      dot: {
        width: 4,
        height: 4,
        marginTop: 1,
        borderRadius: 2,
        backgroundColor: theme.colors.primary,
      },
    }
  }}
  style={{
    backgroundColor: theme.dark ? theme.colors.background : '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
    width: '100%',
    height: 380 // Set explicit height to prevent shifts
  }}
/>
      </View>
      
      <ScrollView 
        style={[
          styles.tasksScrollView,
          { backgroundColor: theme.colors.background }
        ]}
        contentContainerStyle={[
          styles.tasksContainer,
          isDesktop && styles.desktopTasksContainer,
          { backgroundColor: theme.colors.background }
        ]}
      >
        {loading ? (
          <ActivityIndicator style={styles.loader} size="large" color={theme.colors.primary} />
        ) : (
          <>
            <Text style={[styles.dateTitle, { color: theme.colors.onBackground }]}>
              {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            
            {filteredTasks.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.colors.onBackground }]}>Нет задач на этот день</Text>
            ) : (
              <FlatList
                data={filteredTasks}
                renderItem={renderTaskItem}
                keyExtractor={item => item.id}
                ItemSeparatorComponent={() => <Divider />}
                style={{ backgroundColor: theme.colors.background }}
                contentContainerStyle={{ backgroundColor: theme.colors.background }}
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    marginLeft: 0,
  },
  calendarContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    width: '100%',
  },
  desktopCalendarContainer: {
    maxWidth: 1000,
    alignSelf: 'center',
    paddingHorizontal: 32,
  },
  calendar: {
    width: '100%', // Ensure full width
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'transparent', // This ensures calendar inherits parent background
  },
  tasksScrollView: {
    flex: 1,
    width: '100%',
  },
  tasksContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100, // Extra padding for bottom tabs
  },
  desktopTasksContainer: {
    maxWidth: 1000,
    alignSelf: 'center',
    paddingHorizontal: 32,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 16,
    textAlign: 'center',
  },
  emptyText: {
    padding: 16,
    textAlign: 'center',
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryChip: {
    height: 24,
    marginRight: 8,
  },
  itemRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  taskItem: {
    // Add any additional styles for the task item if needed
  },
}); 
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions, useColorScheme } from 'react-native';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { Card, Text, useTheme, Divider, List, IconButton, ActivityIndicator, FAB } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { auth, getTasks } from '../utils/_firebase';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ru, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import TabBackground from '../components/TabBackground';
import TabAppBar from '../components/TabAppBar';
import PageBackground from '../../components/PageBackground';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import ThemeAwareView from '../components/ThemeAwareView';

// Inject calendar day style to ensure day numbers are visible in both modes
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    /* Dark mode styles */
    .dark-theme .calendar-container {
      background-color: #151515;
    }
    .dark-theme .calendar-container .day-container span {
      color: white !important;
      font-weight: 600 !important;
    }
    .dark-theme .calendar-container div[role="gridcell"] {
      color: white !important;
    }
    .dark-theme .calendar-container .day-text {
      color: white !important;
    }
    
    /* Target RN Calendar day text specifically for dark mode */
    .dark-theme .react-native-calendars .day-container span,
    .dark-theme .react-native-calendars .day span,
    .dark-theme .react-native-calendars span.day {
      color: white !important;
    }
    
    /* Specific implementation details of react-native-calendars in dark mode */
    .dark-theme .calendar .day-text {
      color: white !important;
    }
    .dark-theme .calendar .day {
      color: white !important;
    }

    /* Light mode styles */
    .light-theme .calendar-container {
      background-color: white;
    }
    .light-theme .calendar-container .day-container span {
      color: #333 !important;
      font-weight: 600 !important;
    }
    .light-theme .calendar-container div[role="gridcell"] {
      color: #333 !important;
    }
    .light-theme .calendar-container .day-text {
      color: #333 !important;
    }
    
    /* Target RN Calendar day text specifically for light mode */
    .light-theme .react-native-calendars .day-container span,
    .light-theme .react-native-calendars .day span,
    .light-theme .react-native-calendars span.day {
      color: #333 !important;
    }
    
    /* Specific implementation details of react-native-calendars in light mode */
    .light-theme .calendar .day-text {
      color: #333 !important;
    }
    .light-theme .calendar .day {
      color: #333 !important;
    }
  `;
  document.head.append(style);
}

export default function CalendarScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { isDarkMode } = useCustomTheme();
  const systemColorScheme = useColorScheme();
  const [selected, setSelected] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDateTasks, setSelectedDateTasks] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('0');
  const [menuVisible, setMenuVisible] = useState(false);
  const [themeTimestamp, setThemeTimestamp] = useState('0');
  
  // Get current locale for date formatting
  const currentLocale = i18n.language === 'ru' ? ru : enUS;

  // Create fallback colors in case theme.colors.calendarTab is undefined
  const calendarTabColors = useMemo(() => theme.colors.calendarTab || {
    primary: theme.colors.primary,
    secondary: theme.colors.secondary
  }, [theme.colors]);

  // Breakpoints for responsive layouts
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const isDesktop = Platform.OS === 'web' && dimensions.width >= 1024;
  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android' || dimensions.width < 768;
  
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
  
  // Apply calendar styles for dark mode
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Add theme class to document body
      document.body.classList.remove('dark-theme', 'light-theme');
      document.body.classList.add(isDarkMode ? 'dark-theme' : 'light-theme');
      
      // Wait for DOM to be ready
      setTimeout(() => {
        try {
          // Apply appropriate theme class to calendar container
          const calendarContainers = document.querySelectorAll('.calendar-container');
          calendarContainers.forEach(container => {
            container.classList.remove('dark-theme', 'light-theme');
            container.classList.add(isDarkMode ? 'dark-theme' : 'light-theme');
          });
          
          // Target calendar days with appropriate theme
          const themeClass = isDarkMode ? '.dark-theme' : '.light-theme';
          const calendarDays = document.querySelectorAll(`${themeClass} .calendar .day span, ${themeClass} .calendar span.day`);
          calendarDays.forEach(day => {
            day.style.color = isDarkMode ? 'white' : '#333';
            day.style.fontWeight = '500';
          });
          
          // Target day text with appropriate theme
          const dayTexts = document.querySelectorAll(`${themeClass} .calendar .day-text`);
          dayTexts.forEach(text => {
            text.style.color = isDarkMode ? 'white' : '#333';
          });
          
          console.log(`Applied ${isDarkMode ? 'dark' : 'light'} mode styles to calendar days`);
        } catch (error) {
          console.error('Error applying calendar styles:', error);
        }
      }, 500);
    }
  }, [isDarkMode]);
  
  // Listen for theme changes from other components
  useEffect(() => {
    const checkForThemeUpdates = async () => {
      try {
        const lastThemeUpdateTimestamp = await AsyncStorage.getItem('themeUpdateTimestamp');
        if (lastThemeUpdateTimestamp && lastThemeUpdateTimestamp !== themeTimestamp) {
          setThemeTimestamp(lastThemeUpdateTimestamp);
          // Refresh the theme by re-applying styles
          if (Platform.OS === 'web' && typeof document !== 'undefined') {
            document.body.classList.remove('dark-theme', 'light-theme');
            document.body.classList.add(isDarkMode ? 'dark-theme' : 'light-theme');
            
            // Apply to calendar containers
            const calendarContainers = document.querySelectorAll('.calendar-container');
            calendarContainers.forEach(container => {
              container.classList.remove('dark-theme', 'light-theme');
              container.classList.add(isDarkMode ? 'dark-theme' : 'light-theme');
            });
            
            // Target calendar days with appropriate theme
            const themeClass = isDarkMode ? '.dark-theme' : '.light-theme';
            const calendarDays = document.querySelectorAll(`${themeClass} .calendar .day span, ${themeClass} .calendar span.day`);
            calendarDays.forEach(day => {
              day.style.color = isDarkMode ? 'white' : '#333';
              day.style.fontWeight = '500';
            });
            
            // Target day text with appropriate theme
            const dayTexts = document.querySelectorAll(`${themeClass} .calendar .day-text`);
            dayTexts.forEach(text => {
              text.style.color = isDarkMode ? 'white' : '#333';
            });
            
            console.log('Calendar theme updated from external change');
          }
        }
      } catch (error) {
        console.error('Error checking for theme updates:', error);
      }
    };
    
    // Check for theme updates every second
    const intervalId = setInterval(checkForThemeUpdates, 1000);
    return () => clearInterval(intervalId);
  }, [isDarkMode, themeTimestamp]);
  
  // Fetch tasks on mount
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
      
      // Process tasks to mark calendar dates
      processTasks(fetchedTasks);
      
      // If there's a selected date, update the tasks for that date
      if (selected) {
        filterTasksForSelectedDate(selected, fetchedTasks);
      } else {
        // Default to today if no date is selected
        const today = format(new Date(), 'yyyy-MM-dd');
        setSelected(today);
        filterTasksForSelectedDate(today, fetchedTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const processTasks = (tasks) => {
    const dates = {};
    
    tasks.forEach(task => {
      if (task.dueDate) {
        const dueDate = task.dueDate instanceof Date 
          ? task.dueDate 
          : new Date(task.dueDate);
        
        const dateStr = format(dueDate, 'yyyy-MM-dd');
        
        // If date already exists in our object, update the dots array
        if (dates[dateStr]) {
          dates[dateStr].dots.push({
            key: task.id,
            color: task.completed ? theme.colors.success : calendarTabColors.primary,
          });
        } else {
          // Otherwise create a new entry
          dates[dateStr] = {
            dots: [{
              key: task.id,
              color: task.completed ? theme.colors.success : calendarTabColors.primary,
            }],
            selected: dateStr === selected,
            selectedColor: calendarTabColors.primary
          };
        }
      }
    });
    
    // If there's a selected date, ensure it's marked as selected
    if (selected) {
      if (dates[selected]) {
        dates[selected].selected = true;
        dates[selected].selectedColor = calendarTabColors.primary;
      } else {
        dates[selected] = {
          selected: true,
          selectedColor: calendarTabColors.primary,
          dots: []
        };
      }
    }
    
    setMarkedDates(dates);
  };
  
  const filterTasksForSelectedDate = (dateStr, tasksList = tasks) => {
    const filtered = tasksList.filter(task => {
      if (!task.dueDate) return false;
      
      const dueDate = task.dueDate instanceof Date 
        ? task.dueDate 
        : new Date(task.dueDate);
      
      const taskDateStr = format(dueDate, 'yyyy-MM-dd');
      return taskDateStr === dateStr;
    });
    
    // Sort tasks: incomplete first, then by creation date
    filtered.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      
      const aDate = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const bDate = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      
      return bDate - aDate;
    });
    
    setSelectedDateTasks(filtered);
  };
  
  const handleDateSelect = (day) => {
    const dateStr = day.dateString;
    setSelected(dateStr);
    
    // Update marked dates
    const updatedMarkedDates = { ...markedDates };
    
    // Deselect the previously selected date
    if (selected && updatedMarkedDates[selected]) {
      updatedMarkedDates[selected] = {
        ...updatedMarkedDates[selected],
        selected: false
      };
    }
    
    // Select the new date
    if (updatedMarkedDates[dateStr]) {
      updatedMarkedDates[dateStr] = {
        ...updatedMarkedDates[dateStr],
        selected: true,
        selectedColor: calendarTabColors.primary
      };
    } else {
      updatedMarkedDates[dateStr] = {
        selected: true,
        selectedColor: calendarTabColors.primary,
        dots: []
      };
    }
    
    setMarkedDates(updatedMarkedDates);
    filterTasksForSelectedDate(dateStr);
  };
  
  const handleOpenMenu = () => {
    setMenuVisible(true);
    console.log('Calendar menu opened');
  };

  const formatDateLabel = (dateStr) => {
    const date = parseISO(dateStr);
    
    if (isToday(date)) {
      return t('calendar.today');
    } else if (isTomorrow(date)) {
      return t('calendar.tomorrow');
    } else {
      return format(date, 'EEEE, d MMMM', { locale: currentLocale });
    }
  };
  
  const renderSelectedDateTasks = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }
    
    if (selectedDateTasks.length === 0) {
      return (
        <Card style={[styles.tasksCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content style={styles.emptyContent}>
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceDisabled }]}>
              {t('calendar.noTasksForDate')}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/add-task')}
              style={[styles.addButton, { backgroundColor: calendarTabColors.primary }]}
            >
              <Text style={styles.addButtonText}>{t('calendar.addTask')}</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>
      );
    }
    
    return (
      <Card style={[styles.tasksCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {formatDateLabel(selected)}
          </Text>
          <ScrollView style={styles.tasksList}>
            {selectedDateTasks.map((task, index) => (
              <React.Fragment key={task.id}>
                <List.Item
                  title={task.title}
                  description={task.description}
                  left={props => (
                    <List.Icon 
                      {...props} 
                      icon={task.completed ? "check-circle" : "circle-outline"} 
                      color={task.completed ? theme.colors.success : calendarTabColors.primary}
                    />
                  )}
                  right={props => (
                    <IconButton
                      icon="chevron-right"
                      size={24}
                      iconColor={theme.colors.onSurfaceVariant}
                      onPress={() => router.push(`/edit-task?id=${task.id}`)}
                    />
                  )}
                  titleStyle={[
                    task.completed && styles.completedText,
                    { color: theme.colors.onSurface }
                  ]}
                  descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                  onPress={() => router.push(`/edit-task?id=${task.id}`)}
                  style={styles.taskItem}
                />
                {index < selectedDateTasks.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </ScrollView>
        </Card.Content>
      </Card>
    );
  };

  // Custom theme for the calendar
  const lightCalendarTheme = {
    backgroundColor: '#FFFFFF',
    calendarBackground: '#FFFFFF',
    textSectionTitleColor: theme.colors.onSurface,
    selectedDayBackgroundColor: calendarTabColors.primary,
    selectedDayTextColor: '#ffffff',
    todayTextColor: calendarTabColors.primary,
    dayTextColor: theme.colors.onSurface,
    textDisabledColor: theme.colors.onSurfaceDisabled,
    dotColor: calendarTabColors.primary,
    selectedDotColor: '#ffffff',
    arrowColor: calendarTabColors.primary,
    monthTextColor: theme.colors.onSurface,
    indicatorColor: calendarTabColors.primary,
    textDayFontWeight: '500',
    textMonthFontWeight: '700',
    textDayHeaderFontWeight: '500',
    textDayFontSize: 16,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 14
  };

  // Dark theme with forced white text for visibility
  const darkCalendarTheme = {
    ...lightCalendarTheme,
    backgroundColor: '#151515',
    calendarBackground: '#151515',
    textSectionTitleColor: '#FFFFFF',
    dayTextColor: '#FFFFFF',
    textDisabledColor: 'rgba(255,255,255,0.4)',
    arrowColor: '#FFFFFF',
    monthTextColor: '#FFFFFF',
    // Override day styles for dark mode
    'stylesheet.day.basic': {
      base: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
      },
      text: {
        color: '#FFFFFF',
        fontWeight: '500',
      },
      today: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: calendarTabColors.primary,
        borderRadius: 16,
      },
      todayText: {
        color: calendarTabColors.primary,
        fontWeight: 'bold',
      },
      selected: {},
      disabled: {},
      disabledText: {
        color: 'rgba(255,255,255,0.4)',
      },
    }
  };

  // Choose theme based on mode
  const calendarTheme = isDarkMode ? darkCalendarTheme : lightCalendarTheme;

  // Custom day component for better visibility in dark mode
  const renderDay = (day, item) => {
    if (!day) return <View style={styles.emptyDay} />;
    
    const isSelected = day.dateString === selected;
    const isToday = day.dateString === format(new Date(), 'yyyy-MM-dd');
    
    return (
      <TouchableOpacity
        onPress={() => handleDateSelect(day)}
        style={[
          styles.dayContainer,
          isSelected && styles.selectedDay,
          isToday && styles.todayDay
        ]}
      >
        <Text style={[
          styles.dayText,
          isDarkMode && styles.darkModeText,
          isSelected && styles.selectedDayText,
          isToday && styles.todayDayText
        ]}>
          {day.day}
        </Text>
        {markedDates[day.dateString]?.dots?.length > 0 && (
          <View style={styles.dotContainer}>
            {markedDates[day.dateString].dots.map((dot, index) => (
              <View 
                key={index} 
                style={[styles.dot, { backgroundColor: dot.color }]} 
              />
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ThemeAwareView tabName="calendar">
      <TabAppBar title={t('calendar.title')} tabName="calendar" />
      <View style={styles.container}>
        <PageBackground pageName="calendar" />
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && styles.desktopContent
          ]}
        >
          <Card 
            style={[
              styles.calendarCard, 
              { backgroundColor: isDarkMode ? '#151515' : '#FFFFFF' }
            ]}
            elevation={4}
          >
            <Card.Content 
              style={[
                styles.calendarContent, 
                { backgroundColor: isDarkMode ? '#151515' : '#FFFFFF' }
              ]}
              className="calendar-container"
            >
              <RNCalendar
                markingType={'multi-dot'}
                markedDates={markedDates}
                onDayPress={handleDateSelect}
                enableSwipeMonths={true}
                theme={calendarTheme}
                style={styles.calendar}
                testID="calendar"
                className="calendar"
                dayComponent={({date, state}) => renderDay(date, state)}
                hideExtraDays={true}
                key={`calendar-${isDarkMode ? 'dark' : 'light'}-${themeTimestamp}`}
              />
            </Card.Content>
          </Card>
          
          {renderSelectedDateTasks()}
          
          <View style={styles.bottomPadding} />
        </ScrollView>
        
        <FAB
          style={[
            styles.fab,
            { backgroundColor: '#00b894' }
          ]}
          icon="plus"
          onPress={() => router.push('/add-task')}
          color="#fff"
          label={t('calendar.addTask')}
        />
      </View>
    </ThemeAwareView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    padding: Platform.OS === 'web' ? 16 : 0,
    paddingLeft: Platform.OS === 'web' ? 16 : 0,
    paddingRight: Platform.OS === 'web' ? 16 : 0,
    paddingBottom: Platform.OS === 'web' ? 100 : 80,
  },
  desktopContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 50,
  },
  calendarCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    marginLeft: Platform.OS === 'web' ? 0 : -16,
    marginRight: Platform.OS === 'web' ? 0 : -16,
    width: Platform.OS === 'web' ? '100%' : 'auto',
  },
  calendarContent: {
    padding: 0,
  },
  calendar: {
    paddingBottom: 10,
  },
  calendarDayStyle: {
    color: '#ffffff',
    fontWeight: '500',
  },
  tasksCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    marginLeft: Platform.OS === 'web' ? 0 : -16,
    marginRight: Platform.OS === 'web' ? 0 : -16,
    width: Platform.OS === 'web' ? '100%' : 'auto',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContent: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  tasksList: {
    maxHeight: 350,
  },
  taskItem: {
    paddingVertical: 8,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  bottomPadding: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyDay: {
    width: 32,
    height: 32,
  },
  dayContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  selectedDay: {
    backgroundColor: '#00b894',
  },
  todayDay: {
    borderWidth: 1,
    borderColor: '#00b894',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  darkModeText: {
    color: '#ffffff',
  },
  selectedDayText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  todayDayText: {
    color: '#00b894',
    fontWeight: 'bold',
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
}); 
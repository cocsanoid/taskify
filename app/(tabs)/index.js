import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput as RNTextInput,
  Modal, 
  TouchableWithoutFeedback, 
  Keyboard, 
  Platform,
  Dimensions,
  useColorScheme
} from 'react-native';
import { 
  Appbar, 
  FAB, 
  Chip, 
  Divider,
  Text, 
  Card, 
  IconButton, 
  Button, 
  TextInput, 
  Checkbox,
  SegmentedButtons,
  useTheme,
  ActivityIndicator,
  Searchbar,
  Menu,
  Provider,
  Switch
} from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { auth, getTasks, addTask, updateTask, deleteTask } from '../utils/_firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { ensureRussianLanguage } from '../../utils/i18n';
import { format, isToday, isTomorrow, isPast, isFuture, compareAsc, startOfToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import PlatformDatePicker from '../components/PlatformDatePicker';
import { router } from 'expo-router';
import TabAppBar from '../components/TabAppBar';
import PageBackground from '../../components/PageBackground';
import TabBackground from '../components/TabBackground';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import ThemeAwareView from '../components/ThemeAwareView';

export default function TasksScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isDarkMode, setDarkMode } = useCustomTheme();
  const systemColorScheme = useColorScheme();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState({
    title: '',
    description: '',
    dueDate: new Date(),
    priority: 'medium',
    completed: false,
    category: 'noCategory'
  });
  const [editMode, setEditMode] = useState(false);
  const [filter, setFilter] = useState('all');
  const [errorMsg, setErrorMsg] = useState(null);
  const [isDesktop, setIsDesktop] = useState(Dimensions.get('window').width >= 768);
  
  // Add responsive state
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  // Поиск задач
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [formCategoryMenuVisible, setFormCategoryMenuVisible] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState('0');
  
  // Check for openAddTaskModal parameter in the URL
  useEffect(() => {
    // Removed the task modal opening code
  }, []);

  // Категории задач
  const categories = [
    { id: 'all', name: t('tasks.all') },
    { id: 'noCategory', name: t('tasks.noCategory') },
    { id: 'work', name: t('tasks.work') },
    { id: 'personal', name: t('tasks.personal') },
    { id: 'shopping', name: t('tasks.shopping') },
    { id: 'health', name: t('tasks.health') },
    { id: 'education', name: t('tasks.education') },
    { id: 'finance', name: t('tasks.finance') },
    { id: 'other', name: t('tasks.other') }
  ];
  
  // Persist the form state between tab switches
  const [formKey] = useState(Date.now().toString());
  
  // Ensure Russian language
  useEffect(() => {
    ensureRussianLanguage();
  }, []);
  
  // Listen for dimension changes
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions(Dimensions.get('window'));
      setIsDesktop(Dimensions.get('window').width >= 768);
    };
    
    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => {
      subscription.remove();
    };
  }, []);

  // Load tasks from Firebase
  useEffect(() => {
    if (!auth.currentUser) return;
    
    const loadTasks = async () => {
      try {
        setLoading(true);
        const userTasks = await getTasks(auth.currentUser.uid);
        
        // Ensure each task has a valid ID
        const validTasks = userTasks.filter(task => {
          if (!task.id) {
            console.error('Task missing ID:', task);
            return false;
          }
          return true;
        });
        
        console.log(`Loaded ${validTasks.length} tasks with valid IDs`);
        setTasks(validTasks);
      } catch (error) {
        console.error('Error loading tasks:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadTasks();
  }, []);

  // Filter tasks based on selected filter
  useEffect(() => {
    if (filter === 'all') {
      setFilteredTasks(tasks);
    } else if (filter === 'active') {
      setFilteredTasks(tasks.filter(task => !task.completed));
    } else if (filter === 'completed') {
      setFilteredTasks(tasks.filter(task => task.completed));
    }
  }, [tasks, filter]);

  // Load tasks when tasksLastUpdated changes
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const lastUpdatedTimestamp = await AsyncStorage.getItem('tasksLastUpdated');
        if (lastUpdatedTimestamp && lastUpdatedTimestamp !== lastUpdated) {
          console.log(`Tasks updated at ${lastUpdatedTimestamp}, refreshing from server...`);
          setLastUpdated(lastUpdatedTimestamp);
          if (auth.currentUser) {
            // Set loading only if it's not already loading
            if (!loading) {
              setLoading(true);
              // Force a fresh load of tasks from the server
              const userTasks = await getTasks(auth.currentUser.uid);
              const validTasks = userTasks.filter(task => task.id);
              
              // Log tasks for debugging
              console.log('Refreshed tasks:', validTasks.length);
              validTasks.forEach(task => {
                console.log(`Task ${task.id}: ${task.title}, priority: ${task.priority}`);
              });
              
              // Update the state with fresh data
              setTasks(validTasks);
              setLoading(false);
            }
          }
        }
      } catch (error) {
        console.error('Error checking for task updates:', error);
        setLoading(false);
      }
    };
    
    checkForUpdates();
    const intervalId = setInterval(checkForUpdates, 1000);
    return () => clearInterval(intervalId);
  }, [lastUpdated, loading]);

  // Фильтруем задачи на основе выбранного фильтра, поиска и категории
  useEffect(() => {
    let result = tasks;
    
    // Фильтр по статусу
    if (filter === 'active') {
      result = result.filter(task => !task.completed);
    } else if (filter === 'completed') {
      result = result.filter(task => task.completed);
    }
    
    // Фильтр по категории
    if (categoryFilter !== 'all') {
      result = result.filter(task => task.category === categoryFilter);
    }
    
    // Фильтр по поисковому запросу
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        task => 
          task.title?.toLowerCase().includes(query) || 
          task.description?.toLowerCase().includes(query)
      );
    }
    
    setFilteredTasks(result);
  }, [tasks, filter, searchQuery, categoryFilter]);

  // Handle Add Task button - now just shows alert
  const handleAddTask = useCallback(() => {
    router.push('/add-task');
  }, []);
  
  // Remove TaskForm component
  const TaskForm = useCallback(() => null, []);

  const handleEditTask = useCallback((task) => {
    router.push(`/edit-task?id=${task.id}`);
  }, []);

  const handleSaveTask = useCallback(async () => {
    if (!currentTask.title) return;
    
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      // Reset time to midnight (00:00:00) if a date is set
      let taskToSave = { ...currentTask };
      if (taskToSave.dueDate) {
        const normalizedDate = new Date(taskToSave.dueDate);
        normalizedDate.setHours(0, 0, 0, 0);
        taskToSave.dueDate = normalizedDate;
      }

      if (editMode) {
        // Update existing task
        await updateTask(taskToSave.id, taskToSave);
        
        // Update state
        setTasks(tasks.map(task => task.id === taskToSave.id ? taskToSave : task));
      } else {
        // Add new task
        const newTask = await addTask(userId, taskToSave);
        setTasks([...tasks, newTask]);
      }
      
      // Add timestamp to AsyncStorage to notify other components of task changes
      await AsyncStorage.setItem('tasksLastUpdated', Date.now().toString());
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  }, [currentTask, editMode, tasks]);

  const handleToggleComplete = async (id, completed) => {
    try {
      // Ensure completed is a boolean value
      const isCompleted = completed === true;
      
      // Set it to the opposite boolean value (not undefined)
      await updateTask(id, { completed: !isCompleted });
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === id ? { ...task, completed: !isCompleted } : task
      ));
      
      // Add timestamp to AsyncStorage to notify other components of task changes
      await AsyncStorage.setItem('tasksLastUpdated', Date.now().toString());
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      console.log('Attempting to delete task with id:', id);
      
      // Check if ID is valid
      if (!id) {
        console.error('Error: Cannot delete task with invalid ID');
        return;
      }
      
      // Find the task in our state to confirm it exists
      const taskToDelete = tasks.find(task => task.id === id);
      if (!taskToDelete) {
        console.error(`Error: Task with ID ${id} not found in current state`);
        return;
      }
      
      // Call the Firebase delete function
      await deleteTask(id);
      
      // Update local state after successful deletion
      console.log(`Task with ID ${id} successfully deleted`);
      setTasks(tasks.filter(task => task.id !== id));
      
      // Add timestamp to AsyncStorage to notify other components of task deletion
      await AsyncStorage.setItem('tasksLastUpdated', Date.now().toString());
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    
    try {
      let jsDate;
      
      // Handle different types of date objects
      if (date instanceof Date) {
        jsDate = date;
      } 
      // Handle Firestore Timestamp - check for seconds and nanoseconds
      else if (date && typeof date === 'object' && 
               'seconds' in date && 'nanoseconds' in date) {
        // Special handling for Firestore Timestamp format
        const seconds = date.seconds;
        const nanoseconds = date.nanoseconds;
        jsDate = new Date(seconds * 1000 + nanoseconds / 1000000);
      }
      // Check if it's a Firestore Timestamp (has toDate method)
      else if (date && typeof date.toDate === 'function') {
        jsDate = date.toDate();
      }
      // Handle string dates or timestamps
      else if (date && (typeof date === 'string' || typeof date === 'number')) {
        jsDate = new Date(date);
      }
      // If it appears to be a Timestamp but without expected methods
      else if (date && typeof date === 'object' && date.toString().includes('Timestamp')) {
        // Try to extract date from stringified version or default to current date
        jsDate = new Date();
      }
      // If none of the above, we can't process this date
      else {
        console.warn('Unrecognized date format in formatDate:', date);
        return '';
      }
      
      // Remove time component from display
      if (isToday(jsDate)) {
        return t('tasks.today');
      } else if (isTomorrow(jsDate)) {
        return t('tasks.tomorrow');
      } else {
        return format(jsDate, 'dd MMMM yyyy');
      }
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return '';
    }
  };
  
  const getPriorityColor = (priority, opacity = 1) => {
    const colors = {
      high: `rgba(235, 64, 52, ${opacity})`,
      medium: `rgba(247, 174, 73, ${opacity})`,
      low: `rgba(69, 170, 242, ${opacity})`
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (completed, opacity = 1) => {
    return completed 
      ? `rgba(92, 184, 92, ${opacity})` 
      : `rgba(140, 140, 140, ${opacity})`;
  };

  const getDueDateColor = (date) => {
    if (!date) return 'rgba(140, 140, 140, 1)';
    
    try {
      let jsDate;
      
      // Handle different types of date objects
      if (date instanceof Date) {
        jsDate = date;
      } 
      // Handle Firestore Timestamp - check for seconds and nanoseconds
      else if (date && typeof date === 'object' && 
               'seconds' in date && 'nanoseconds' in date) {
        // Special handling for Firestore Timestamp format
        const seconds = date.seconds;
        const nanoseconds = date.nanoseconds;
        jsDate = new Date(seconds * 1000 + nanoseconds / 1000000);
      }
      // Check if it's a Firestore Timestamp (has toDate method)
      else if (date && typeof date.toDate === 'function') {
        jsDate = date.toDate();
      }
      // Handle string dates or timestamps
      else if (date && (typeof date === 'string' || typeof date === 'number')) {
        jsDate = new Date(date);
      }
      // If it appears to be a Timestamp but without expected methods
      else if (date && typeof date === 'object' && date.toString().includes('Timestamp')) {
        // Try to extract date from stringified version or default to current date
        jsDate = new Date();
      }
      // If none of the above, we can't determine if it's overdue
      else {
        console.warn('Unrecognized date format in getDueDateColor:', date);
        return 'rgba(140, 140, 140, 1)';
      }
      
      if (isPast(jsDate) && !isToday(jsDate)) {
        return 'rgba(235, 64, 52, 1)'; // Overdue
      }
      return 'rgba(140, 140, 140, 1)'; // Normal
    } catch (error) {
      console.error('Error determining due date color:', error, date);
      return 'rgba(140, 140, 140, 1)';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return t('tasks.high');
      case 'medium': return t('tasks.medium');
      case 'low': return t('tasks.low');
      default: return t('tasks.medium');
    }
  };

  const renderTaskItem = ({ item }) => {
    const isOverdue = item.dueDate && isPast(new Date(item.dueDate)) && !item.completed;
    
    // Get priority color for border
    const getPriorityBorderColor = (priority) => {
      switch(priority) {
        case 'high': return '#F44336'; // Red
        case 'medium': return '#FFC107'; // Yellow
        case 'low': return '#4CAF50'; // Green
        default: return '#FFC107'; // Yellow (default)
      }
    };
    
    // Get priority background color for chip
    const getPriorityBgColor = (priority) => {
      switch(priority) {
        case 'high': return '#F44336'; // Red
        case 'medium': return '#FFC107'; // Yellow
        case 'low': return '#4CAF50'; // Green
        default: return '#FFC107'; // Yellow (default)
      }
    };
    
    // Ensure item has a priority
    const priority = item.priority || 'medium';
    
    return (
      <Card 
        style={[
          styles.taskCard, 
          { 
            backgroundColor: theme.colors.surface,
            // Take up more width on different screen sizes
            width: isDesktop ? '100%' : '100%',
            alignSelf: 'stretch',
            borderLeftWidth: 4,
            borderLeftColor: getPriorityBorderColor(priority)
          },
          isOverdue && styles.overdueTask
        ]}
        onPress={() => handleEditTask(item)}
        contentStyle={{ flexGrow: 1 }}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.taskHeader}>
            <Checkbox
              status={item.completed ? 'checked' : 'unchecked'}
              onPress={() => handleToggleComplete(item.id, item.completed)}
              size={24}
            />
            <Text
              style={[
                styles.taskTitle,
                item.completed && styles.completedText
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {item && item.id ? (
              <IconButton
                icon="delete"
                size={24}
                iconColor={theme.colors.error}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteTask(item.id);
                }}
                style={{ margin: 0 }}
              />
            ) : (
              <View style={{ width: 32, height: 32 }} />
            )}
          </View>
          
          {item.description ? (
            <Text 
              style={[
                styles.taskDescription,
                item.completed && styles.completedText
              ]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          ) : null}
          
          <View style={styles.taskFooter}>
            {renderCategoryBadge(item.category)}
            
            {item.dueDate ? (
              <Text style={[styles.dueDate, { color: getDueDateColor(item.dueDate) }]}>
                {t('tasks.due')} {' '}
                {(() => {
                  try {
                    const date = new Date(item.dueDate);
                    if (isNaN(date.getTime())) {
                      return '';
                    }
                    if (isToday(date)) {
                      return t('tasks.today');
                    }
                    if (isTomorrow(date)) {
                      return t('tasks.tomorrow');
                    }
                    return format(date, 'dd.MM.yyyy', { locale: ru });
                  } catch (error) {
                    console.error('Error formatting date:', error);
                    return '';
                  }
                })()}
              </Text>
            ) : null}
            
            <Chip 
              mode="flat" 
              style={[
                styles.priorityChip,
                { 
                  backgroundColor: getPriorityBgColor(priority),
                  borderRadius: 4 
                }
              ]}
              textStyle={{ 
                color: priority === 'medium' ? '#000' : '#fff', 
                fontWeight: 'bold' 
              }}
            >
              {t(`tasks.${priority}`)}
            </Chip>
          </View>
        </Card.Content>
      </Card>
    );
  };

  // Отображаем меню категорий
  const CategoryMenu = () => (
    <Menu
      visible={categoryMenuVisible}
      onDismiss={() => setCategoryMenuVisible(false)}
      anchor={
        <Button 
          mode="outlined" 
          onPress={() => setCategoryMenuVisible(true)}
          icon="folder"
          style={styles.categoryButton}
          textColor={theme.colors.primary}
        >
          {categories.find(c => c.id === categoryFilter)?.name || t('tasks.all')}
        </Button>
      }
      contentStyle={{ backgroundColor: theme.colors.surface }}
    >
      {categories.map(category => (
        <Menu.Item
          key={category.id}
          title={category.name}
          titleStyle={{ color: theme.colors.onSurface }}
          onPress={() => {
            setCategoryFilter(category.id);
            setCategoryMenuVisible(false);
          }}
        />
      ))}
    </Menu>
  );

  // Рендерим категорию для задачи
  const renderCategoryBadge = (category) => {
    if (!category || category === 'noCategory') return null;
    
    const getCategoryColor = (cat) => {
      switch(cat) {
        case 'work': return '#4285F4';
        case 'personal': return '#EA4335';
        case 'shopping': return '#FBBC05';
        case 'health': return '#34A853';
        case 'education': return '#9C27B0';
        case 'finance': return '#00BCD4';
        case 'other': return '#607D8B';
        default: return '#9E9E9E';
      }
    };
    
    const categoryObj = categories.find(c => c.id === category);
    const name = categoryObj ? categoryObj.name : t('tasks.other');
    
    return (
      <Chip 
        mode="flat" 
        style={[styles.categoryChip, { backgroundColor: getCategoryColor(category) }]}
        textStyle={{ color: 'white' }}
      >
        {name}
      </Chip>
    );
  };

  // Toggle dark mode
  const toggleDarkMode = async () => {
    try {
      const newDarkMode = !isDarkMode;
      setDarkMode(newDarkMode);
      await AsyncStorage.setItem('darkMode', JSON.stringify(newDarkMode));
    } catch (error) {
      console.error('Error toggling dark mode:', error);
    }
  };

  const [menuVisible, setMenuVisible] = useState(false);
  
  const handleOpenMenu = () => {
    setMenuVisible(true);
    console.log('Tasks menu opened');
  };

  // Create fallback colors in case theme.colors.tasksTab is undefined
  const tasksTabColors = useMemo(() => theme.colors.tasksTab || {
    primary: theme.colors.primary,
    secondary: theme.colors.secondary
  }, [theme.colors]);

  return (
    <ThemeAwareView tabName="tasks">
      <TabAppBar title={t('tasks.title')} tabName="tasks" />
      <View style={styles.container}>
        <PageBackground pageName="tasks" />
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder={t('tasks.searchPlaceholder')}
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            iconColor={theme.colors.primary}
            inputStyle={{ color: theme.colors.onBackground }}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            theme={theme}
          />
          <CategoryMenu />
        </View>

        <SegmentedButtons
          value={filter}
          onValueChange={setFilter}
          buttons={[
            { 
              value: 'all', 
              label: t('tasks.all'),
              style: { backgroundColor: filter === 'all' ? theme.colors.primary : theme.colors.surface },
              labelStyle: { color: filter === 'all' ? 'white' : theme.colors.onSurface }
            },
            { 
              value: 'active', 
              label: t('tasks.active'),
              style: { backgroundColor: filter === 'active' ? theme.colors.primary : theme.colors.surface },
              labelStyle: { color: filter === 'active' ? 'white' : theme.colors.onSurface }
            },
            { 
              value: 'completed', 
              label: t('tasks.completed'),
              style: { backgroundColor: filter === 'completed' ? theme.colors.primary : theme.colors.surface },
              labelStyle: { color: filter === 'completed' ? 'white' : theme.colors.onSurface }
            }
          ]}
          style={styles.filterButtons}
        />
        
        <View style={styles.taskListContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
                {t('common.loading')}
              </Text>
            </View>
          ) : (
            <>
              {filteredTasks.length > 0 ? (
                <FlatList
                  data={filteredTasks}
                  renderItem={renderTaskItem}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={[
                    styles.taskList,
                    isDesktop && { alignSelf: 'center', width: '100%' }
                  ]}
                  ListHeaderComponent={
                    <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                      {t('tasks.taskList')}
                    </Text>
                  }
                  ListFooterComponent={<View style={{ height: 50 }} />}
                  numColumns={isDesktop ? 1 : 1}
                  key={isDesktop ? 'desktop' : 'mobile'}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: theme.colors.onBackground }]}>
                    {t('tasks.noTasks')}
                  </Text>
                  <Button 
                    mode="contained" 
                    onPress={handleAddTask}
                    style={styles.addButton}
                  >
                    {t('tasks.addTask')}
                  </Button>
                </View>
              )}
            </>
          )}
        </View>
        
        <FAB
          style={[
            styles.fab,
            { 
              backgroundColor: '#3498db',
              zIndex: 1000 // Ensure high z-index for the FAB
            }
          ]}
          icon="plus"
          onPress={handleAddTask}
          label={t('tasks.addTask')}
          color="#fff"
        />
      </View>
    </ThemeAwareView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0, // Removed padding
    width: '100%',
    maxWidth: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 10,
    width: '100%',
    maxWidth: 1320, // Significantly increased from 1120
    alignSelf: 'center',
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
  },
  categoryButton: {
    minWidth: 120,
  },
  filterButtons: {
    marginHorizontal: 16,
    marginBottom: 8,
    zIndex: 5,
    width: '100%',
    maxWidth: 1288, // Match searchContainer width - horizontal padding
    alignSelf: 'center',
  },
  taskListContainer: {
    flex: 1,
    zIndex: 1,
    alignItems: 'center',
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  taskList: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    width: '100%',
    maxWidth: 1320,
  },
  taskCard: {
    marginBottom: 16,
    marginHorizontal: 4, // Added small horizontal margin
    elevation: 3,
    borderRadius: 12,
    padding: 0, // Removed padding from card to let content control padding
    width: '100%', // Ensure cards take full width of container
  },
  cardContent: {
    padding: 12, // Increased padding in content for better spacing
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 4,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
  taskDescription: {
    fontSize: 14,
    marginLeft: 32,
    marginTop: 4,
    opacity: 0.9, // Slightly higher opacity for better visibility
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6, // Improved opacity for better visibility
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
    paddingVertical: 4,
  },
  dueDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  priorityChip: {
    height: 28,
    paddingHorizontal: 8,
  },
  highPriority: {
    backgroundColor: '#FF5252',
  },
  mediumPriority: {
    backgroundColor: '#FFC107',
  },
  lowPriority: {
    backgroundColor: '#4CAF50',
  },
  categoryChip: {
    height: 28,
    marginRight: 8,
    paddingHorizontal: 8,
  },
  overdueTask: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF5252',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  addButton: {
    marginTop: 10,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000, // Ensure modal is above everything
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    zIndex: 1001, // Higher than modalContainer
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  formContent: {
    padding: 16,
    zIndex: 1002, // Higher than modalContent
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'transparent',
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  priorityButtonText: {
    marginLeft: 4,
    fontSize: 14,
  },
  categoryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  categoryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryButtonText: {
    marginLeft: 4,
    fontSize: 14,
  },
  datePickerContainer: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    zIndex: 1003, // Highest z-index to ensure date picker is always on top
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    gap: 8,
  },
  modalButton: {
    minWidth: 120,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxLabel: {
    marginLeft: 8,
  },
}); 
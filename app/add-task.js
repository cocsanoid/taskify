import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  Modal, 
  TouchableWithoutFeedback, 
  Keyboard, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  IconButton, 
  Portal, 
  Surface,
  RadioButton,
  Checkbox,
  useTheme,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { auth, addTask } from './utils/_firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import WebDatePicker from './components/WebDatePicker';
import PlatformDatePicker from './components/PlatformDatePicker';

export default function AddTaskScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [userTheme, setUserTheme] = useState('light');
  const { width } = Dimensions.get('window');
  const isLargeScreen = width > 768;
  
  // Category dropdown state
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  
  // Form state
  const [task, setTask] = useState({
    title: '',
    description: '',
    dueDate: null,
    category: 'noCategory',
    priority: 'medium'
  });
  
  // Input validation
  const [titleError, setTitleError] = useState('');
  
  // Categories for tasks
  const categories = [
    { id: 'noCategory', name: t('tasks.noCategory'), icon: 'folder-outline' },
    { id: 'work', name: t('tasks.work'), icon: 'briefcase-outline' },
    { id: 'personal', name: t('tasks.personal'), icon: 'account-outline' },
    { id: 'shopping', name: t('tasks.shopping'), icon: 'shopping-outline' },
    { id: 'health', name: t('tasks.health'), icon: 'heart-outline' },
    { id: 'education', name: t('tasks.education'), icon: 'school-outline' },
    { id: 'finance', name: t('tasks.finance'), icon: 'cash-outline' },
    { id: 'other', name: t('tasks.other'), icon: 'dots-horizontal' },
  ];
  
  // Priority options
  const priorities = [
    { value: 'low', label: t('tasks.low'), color: '#4CAF50', icon: 'arrow-down' },
    { value: 'medium', label: t('tasks.medium'), color: '#FFC107', icon: 'equal' },
    { value: 'high', label: t('tasks.high'), color: '#F44336', icon: 'arrow-up' },
  ];

  // Load theme settings
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('darkMode');
        if (savedTheme !== null) {
          setUserTheme(JSON.parse(savedTheme) ? 'dark' : 'light');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };
    
    loadTheme();
  }, []);

  // Handle input changes
  const handleChange = (name, value) => {
    setTask(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when title is entered
    if (name === 'title' && value.trim() && titleError) {
      setTitleError('');
    }
  };

  // Validate form
  const validateForm = () => {
    let isValid = true;
    
    if (!task.title.trim()) {
      setTitleError(t('tasks.enterTitle'));
      isValid = false;
    }
    
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      // Verify user is logged in
      const userId = auth.currentUser?.uid;
      if (!userId) {
        alert(t('errors.loginRequired'));
        router.replace('/(auth)/login');
        return;
      }
      
      // Reset time to midnight if a date is set
      let taskDueDate = null;
      if (task.dueDate) {
        taskDueDate = new Date(task.dueDate);
        taskDueDate.setHours(0, 0, 0, 0);
      }
      
      // Create task in Firebase
      const newTask = await addTask(userId, {
        ...task,
        dueDate: taskDueDate,
      });
      
      // Notify other components about the change
      await AsyncStorage.setItem('tasksLastUpdated', Date.now().toString());
      
      // Close modal and navigate back
      closeModal();
      
    } catch (error) {
      console.error('Error adding task:', error);
      alert(t('errors.addTaskFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Close modal and navigate back
  const closeModal = () => {
    setVisible(false);
    router.replace('/(tabs)');
  };

  // Render category selection
  const renderCategories = () => {
    return (
      <View style={styles.categoriesContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          {t('tasks.category')}
        </Text>
        
        <Surface 
          style={[
            styles.categoryDropdown,
            { 
              borderColor: theme.colors.outline,
              backgroundColor: theme.colors.surfaceVariant 
            }
          ]}
          elevation={1}
        >
          <TouchableWithoutFeedback onPress={() => setCategoryMenuVisible(!categoryMenuVisible)}>
            <View style={styles.categoryDropdownContent}>
              <View style={styles.categorySelected}>
                <IconButton
                  icon={categories.find(c => c.id === task.category)?.icon || 'folder-outline'}
                  size={Platform.OS === 'web' ? 24 : 20}
                  iconColor={theme.colors.primary}
                />
                <Text style={{ color: theme.colors.onSurface, flex: 1 }}>
                  {categories.find(c => c.id === task.category)?.name || t('tasks.noCategory')}
                </Text>
                <IconButton 
                  icon={categoryMenuVisible ? "menu-up" : "menu-down"} 
                  size={Platform.OS === 'web' ? 24 : 20} 
                  iconColor={theme.colors.primary} 
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Surface>
        
        {categoryMenuVisible && (
          <Surface
            style={[
              styles.inlineCategoryList,
              { backgroundColor: theme.colors.surface, marginTop: 4 }
            ]}
            elevation={2}
          >
            <ScrollView 
              style={{ maxHeight: Platform.OS === 'web' ? 200 : 150 }}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              {categories.map(category => (
                <TouchableWithoutFeedback
                  key={category.id}
                  onPress={() => {
                    handleChange('category', category.id);
                    setCategoryMenuVisible(false);
                  }}
                >
                  <Surface
                    style={[
                      styles.categoryListItem,
                      task.category === category.id && [
                        styles.categoryItemSelected,
                        { backgroundColor: theme.colors.primaryContainer }
                      ]
                    ]}
                    elevation={0}
                  >
                    <IconButton
                      icon={category.icon}
                      size={Platform.OS === 'web' ? 24 : 20}
                      iconColor={task.category === category.id 
                        ? theme.colors.primary 
                        : theme.colors.onSurfaceVariant
                      }
                    />
                    <Text
                      style={[
                        styles.categoryLabel,
                        { 
                          color: task.category === category.id 
                            ? theme.colors.primary 
                            : theme.colors.onSurface 
                        }
                      ]}
                    >
                      {category.name}
                    </Text>
                  </Surface>
                </TouchableWithoutFeedback>
              ))}
            </ScrollView>
          </Surface>
        )}
      </View>
    );
  };

  // Render priority selection
  const renderPriorities = () => {
    return (
      <View style={styles.prioritiesContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          {t('tasks.priority')}
        </Text>
        <View style={styles.prioritiesRow}>
          {priorities.map(priority => (
            <TouchableWithoutFeedback
              key={priority.value}
              onPress={() => handleChange('priority', priority.value)}
            >
              <Surface
                style={[
                  styles.priorityItem,
                  task.priority === priority.value && { 
                    backgroundColor: `${priority.color}20`,
                    borderColor: priority.color,
                  }
                ]}
                elevation={1}
              >
                <View style={styles.priorityContent}>
                  <RadioButton
                    value={priority.value}
                    status={task.priority === priority.value ? 'checked' : 'unchecked'}
                    color={priority.color}
                    onPress={() => handleChange('priority', priority.value)}
                    size={Platform.OS === 'web' ? 24 : 20}
                  />
                  <IconButton
                    icon={priority.icon}
                    size={Platform.OS === 'web' ? 16 : 14}
                    iconColor={priority.color}
                    onPress={() => handleChange('priority', priority.value)}
                  />
                  <Text 
                    style={[styles.priorityLabel, { color: theme.colors.onSurface }]}
                    onPress={() => handleChange('priority', priority.value)}
                  >
                    {priority.label}
                  </Text>
                </View>
              </Surface>
            </TouchableWithoutFeedback>
          ))}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      onDismiss={closeModal}
      contentContainerStyle={styles.container}
      statusBarTranslucent
    >
      <View style={[
        styles.overlay,
        { backgroundColor: 'rgba(0,0,0,0.5)' }
      ]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ width: '100%', height: '100%', position: 'absolute' }} />
          </TouchableWithoutFeedback>
          
          <Surface
            style={[
              styles.modalContent,
              isLargeScreen ? styles.modalLarge : styles.modalSmall,
              { 
                backgroundColor: theme.colors.surface,
                paddingTop: Platform.OS === 'web' ? (insets.top + 16) : 8,
                paddingBottom: Platform.OS === 'web' ? (insets.bottom + 16) : 8,
                paddingLeft: Platform.OS === 'web' ? (insets.left + 16) : 4,
                paddingRight: Platform.OS === 'web' ? (insets.right + 16) : 4,
              }
            ]}
            elevation={5}
          >
            <View style={[styles.modalHeader, Platform.OS !== 'web' && styles.compactHeader]}>
              <Text style={[styles.modalTitle, { color: theme.colors.primary }, Platform.OS !== 'web' && styles.compactTitle]}>
                {t('tasks.addTask')}
              </Text>
              <IconButton
                icon="close"
                size={24}
                onPress={closeModal}
                iconColor={theme.colors.onSurfaceVariant}
              />
            </View>

            <ScrollView 
              style={styles.formScroll}
              contentContainerStyle={styles.formContainer}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="none"
            >
              <View style={styles.formField}>
                <TextInput
                  label={t('tasks.taskTitle')}
                  value={task.title}
                  onChangeText={(value) => handleChange('title', value)}
                  mode="outlined"
                  error={!!titleError}
                  style={styles.input}
                  left={Platform.OS === 'web' ? <TextInput.Icon icon="format-title" /> : null}
                  dense={Platform.OS !== 'web'}
                />
                {titleError ? (
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    {titleError}
                  </Text>
                ) : null}
              </View>

              <View style={styles.formField}>
                <TextInput
                  label={t('tasks.taskDescription')}
                  value={task.description}
                  onChangeText={(value) => handleChange('description', value)}
                  mode="outlined"
                  style={styles.input}
                  multiline
                  numberOfLines={3}
                  left={Platform.OS === 'web' ? <TextInput.Icon icon="text-box-outline" /> : null}
                  dense={Platform.OS !== 'web'}
                />
              </View>

              {renderPriorities()}
              
              <Divider style={styles.divider} />
              
              {renderCategories()}
              
              <Divider style={styles.divider} />
              
              <View style={styles.formField}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                  {t('tasks.dueDate')}
                </Text>
                {Platform.OS === 'web' ? (
                  <WebDatePicker
                    value={task.dueDate}
                    onChange={(date) => handleChange('dueDate', date)}
                    style={styles.datePicker}
                    minDate={new Date()}
                  />
                ) : (
                  <PlatformDatePicker
                    value={task.dueDate}
                    onChange={(date) => handleChange('dueDate', date)}
                    containerStyle={styles.datePicker}
                    minimumDate={new Date()}
                    label={null}
                  />
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                mode="outlined"
                onPress={closeModal}
                style={styles.footerButton}
              >
                {t('common.cancel')}
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.footerButton}
                disabled={loading}
                loading={loading}
              >
                {t('common.save')}
              </Button>
            </View>
          </Surface>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 0,
    padding: 0,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 16 : 0,
    width: '100%',
    height: '100%',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalSmall: {
    width: Platform.OS === 'web' ? '90%' : '90%',
    height: Platform.OS === 'web' ? 'auto' : '90%',
    maxHeight: Platform.OS === 'web' ? '95%' : '90%',
    minHeight: 300,
    borderRadius: Platform.OS === 'web' ? 16 : 8,
  },
  modalLarge: {
    width: '60%',
    maxWidth: 600,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
  },
  compactHeader: {
    paddingBottom: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  compactTitle: {
    fontSize: 20,
  },
  formScroll: {
    flex: 1,
  },
  formContainer: {
    paddingBottom: 20,
  },
  formField: {
    marginBottom: Platform.OS === 'web' ? 16 : 12,
  },
  input: {
    marginBottom: 4,
    fontSize: Platform.OS === 'web' ? undefined : 14,
  },
  errorText: {
    fontSize: 12,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    fontWeight: '500',
    marginBottom: Platform.OS === 'web' ? 8 : 4,
    marginLeft: 8,
  },
  prioritiesContainer: {
    marginBottom: 16,
  },
  prioritiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: Platform.OS === 'web' ? 0 : -4,
  },
  priorityItem: {
    flex: 1,
    marginHorizontal: Platform.OS === 'web' ? 4 : 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  priorityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 8 : 4,
  },
  priorityLabel: {
    flex: 1,
    fontSize: 14,
  },
  divider: {
    marginVertical: Platform.OS === 'web' ? 16 : 8,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoryDropdown: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  categoryDropdownContent: {
    padding: Platform.OS === 'web' ? 8 : 4,
  },
  categorySelected: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? undefined : 0,
  },
  inlineCategoryList: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 4,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  categoryListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
    padding: 4,
    borderRadius: 8,
  },
  categoryItemSelected: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryLabel: {
    marginLeft: 4,
    marginRight: 8,
  },
  datePicker: {
    marginTop: 8,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  inlineDatePicker: {
    padding: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    marginTop: 4,
    width: '100%',
  },
  calendar: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  calendarHeader: {
    padding: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  calendarDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  calendarDayName: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
  },
  calendarWeek: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  calendarDay: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  calendarEmptyDay: {
    width: 36,
    height: 36,
  },
  calendarToday: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  calendarSelected: {
    backgroundColor: '#6200ee',
  },
  calendarDisabled: {
    opacity: 0.3,
  },
  calendarDayText: {
    textAlign: 'center',
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    marginBottom: 4,
    gap: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: Platform.OS === 'web' ? 16 : 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  footerButton: {
    marginLeft: 8,
    minWidth: Platform.OS === 'web' ? 100 : 80,
  },
}); 
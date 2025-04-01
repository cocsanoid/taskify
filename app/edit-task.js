import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  IconButton, 
  Surface,
  RadioButton,
  useTheme,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { auth, updateTask, getTask, deleteTask } from './utils/_firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import WebDatePicker from './components/WebDatePicker';
import PlatformDatePicker from './components/PlatformDatePicker';

export default function EditTaskScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { id } = params;
  
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState(null);
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
    priority: 'medium',
    completed: false
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

  // Load task data
  useEffect(() => {
    const loadTask = async () => {
      if (!id) {
        setError("No task ID provided");
        setLoading(false);
        return;
      }
      
      try {
        const taskData = await getTask(id);
        if (!taskData) {
          setError("Task not found");
          setLoading(false);
          return;
        }
        
        // If task has a dueDate, ensure it's a proper Date object
        if (taskData.dueDate) {
          // Handle Firestore timestamp
          const dueDate = taskData.dueDate.toDate ? 
            taskData.dueDate.toDate() : 
            new Date(taskData.dueDate);
            
          // Normalize to midnight
          dueDate.setHours(0, 0, 0, 0);
          taskData.dueDate = dueDate;
        }
        
        setTask(taskData);
        setLoading(false);
      } catch (error) {
        console.error("Error loading task:", error);
        setError("Failed to load task details");
        setLoading(false);
      }
    };
    
    loadTask();
  }, [id]);

  // Handle input changes
  const handleChange = (name, value) => {
    // For category and priority, ensure we never set undefined values
    if ((name === 'category' || name === 'priority') && value === undefined) {
      // Skip updating with undefined values
      console.warn(`Attempted to set ${name} to undefined, ignoring update`);
      return;
    }
    
    // Log the change for debugging
    console.log(`Changing ${name} to:`, value);
    
    // For priority, validate it's one of the expected values
    if (name === 'priority' && !['low', 'medium', 'high'].includes(value)) {
      console.warn(`Invalid priority value: ${value}, using medium as default`);
      value = 'medium';
    }
    
    setTask(prev => {
      const updated = { ...prev, [name]: value };
      console.log('Updated task:', updated);
      return updated;
    });
    
    // Clear errors when title is entered
    if (name === 'title' && value.trim() && titleError) {
      setTitleError('');
    }
  };
  
  // Toggle completion status
  const handleToggleComplete = () => {
    setTask(prev => ({ ...prev, completed: !prev.completed }));
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
      setSaveLoading(true);
      
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
      
      // Log the current priority before update
      console.log('Priority before update:', task.priority);
      
      // Create a clean task object with only the fields we want to update
      const taskToUpdate = {
        title: task.title,
        description: task.description || '',
        dueDate: taskDueDate,
        category: task.category || 'noCategory',
        priority: task.priority || 'medium',
        completed: task.completed === true
      };
      
      // Make sure priority is explicitly set to one of the valid values
      if (!['low', 'medium', 'high'].includes(taskToUpdate.priority)) {
        console.warn(`Invalid priority value: ${taskToUpdate.priority}, using medium as default`);
        taskToUpdate.priority = 'medium';
      }
      
      console.log('Updating task with:', taskToUpdate);
      
      // Update task in Firebase
      await updateTask(id, taskToUpdate);
      
      // Force an immediate update of the task list with a unique timestamp
      const timestamp = Date.now().toString();
      await AsyncStorage.setItem('tasksLastUpdated', timestamp);
      
      // Log success
      console.log('Task successfully updated with new priority:', taskToUpdate.priority);
      
      // Close modal and navigate back
      closeModal();
      
    } catch (error) {
      console.error('Error updating task:', error);
      alert(t('errors.updateTaskFailed'));
    } finally {
      setSaveLoading(false);
    }
  };
  
  // Handle task deletion
  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      
      // Delete task in Firebase
      await deleteTask(id);
      
      // Notify other components about the change
      await AsyncStorage.setItem('tasksLastUpdated', Date.now().toString());
      
      // Close modal and navigate back
      closeModal();
      
    } catch (error) {
      console.error('Error deleting task:', error);
      alert(t('errors.deleteTaskFailed'));
    } finally {
      setDeleteLoading(false);
    }
  };

  // Close modal and navigate back
  const closeModal = () => {
    setVisible(false);
    router.back();
  };

  // Dedicated handler for priority changes
  const handlePriorityChange = (priorityValue) => {
    console.log(`Priority change requested to: ${priorityValue}`);
    // Validate the priority value
    if (!['low', 'medium', 'high'].includes(priorityValue)) {
      console.warn(`Invalid priority value: ${priorityValue}`);
      return;
    }
    
    // Update the task state with the new priority
    setTask(prev => {
      const updated = { ...prev, priority: priorityValue };
      console.log('Task updated with new priority:', updated.priority);
      return updated;
    });
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
          {priorities.map(priority => {
            const isSelected = task.priority === priority.value;
            return (
              <TouchableWithoutFeedback
                key={priority.value}
                onPress={() => handlePriorityChange(priority.value)}
              >
                <Surface
                  style={[
                    styles.priorityItem,
                    { 
                      borderWidth: 1,
                      borderColor: isSelected ? priority.color : theme.colors.outline
                    },
                    isSelected && { 
                      backgroundColor: `${priority.color}20`,
                    }
                  ]}
                  elevation={1}
                >
                  <View style={[
                    styles.priorityContent,
                    { borderLeftWidth: 4, borderLeftColor: priority.color }
                  ]}>
                    <RadioButton
                      value={priority.value}
                      status={isSelected ? 'checked' : 'unchecked'}
                      color={priority.color}
                      onPress={() => handlePriorityChange(priority.value)}
                      size={Platform.OS === 'web' ? 24 : 20}
                    />
                    <IconButton
                      icon={priority.icon}
                      size={Platform.OS === 'web' ? 16 : 14}
                      iconColor={priority.color}
                      onPress={() => handlePriorityChange(priority.value)}
                    />
                    <Text 
                      style={[
                        styles.priorityLabel, 
                        { 
                          color: isSelected ? priority.color : theme.colors.onSurface,
                          fontWeight: isSelected ? 'bold' : 'normal' 
                        }
                      ]}
                      onPress={() => handlePriorityChange(priority.value)}
                    >
                      {priority.label}
                    </Text>
                  </View>
                </Surface>
              </TouchableWithoutFeedback>
            );
          })}
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
                {t('tasks.editTask')}
              </Text>
              <IconButton
                icon="close"
                size={24}
                onPress={closeModal}
                iconColor={theme.colors.onSurfaceVariant}
              />
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ color: theme.colors.onSurface, marginTop: 16 }}>
                  {t('common.loading')}
                </Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <IconButton
                  icon="alert-circle"
                  size={48}
                  iconColor={theme.colors.error}
                />
                <Text style={{ color: theme.colors.error, marginTop: 16, textAlign: 'center' }}>
                  {error}
                </Text>
                <Button 
                  mode="contained" 
                  onPress={closeModal}
                  style={{ marginTop: 24 }}
                >
                  {t('common.goBack')}
                </Button>
              </View>
            ) : (
              <>
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
                    mode="outlined"
                    onPress={handleDelete}
                    style={[styles.footerButton, { borderColor: theme.colors.error }]}
                    textColor={theme.colors.error}
                    icon="delete"
                    loading={deleteLoading}
                    disabled={saveLoading || deleteLoading}
                  >
                    {t('common.delete')}
                  </Button>
        
        <Button 
          mode="contained" 
                    onPress={handleSubmit}
                    style={styles.footerButton}
                    loading={saveLoading}
                    disabled={saveLoading || deleteLoading}
        >
          {t('common.save')}
        </Button>
      </View>
              </>
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
}); 
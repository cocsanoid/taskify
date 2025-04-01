import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TouchableHighlight,
  Modal,
  ImageBackground,
  useColorScheme,
  Platform,
  Dimensions,
  Image
} from 'react-native';
import { 
  Appbar, 
  Text, 
  Card, 
  FAB, 
  TextInput, 
  Button, 
  IconButton,
  ActivityIndicator,
  Portal,
  useTheme
} from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { auth, getNotes, addNote, updateNote, deleteNote } from '../utils/_firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';

// Notebook paper background pattern asset
const notebookPattern = { uri: 'https://www.transparenttextures.com/patterns/lined-paper-2.png' };
const darkNotebookPattern = { uri: 'https://www.transparenttextures.com/patterns/dark-leather.png' };

export default function NotesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const systemColorScheme = useColorScheme();
  const [darkMode, setDarkMode] = useState(systemColorScheme === 'dark');
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentNote, setCurrentNote] = useState({ title: '', content: '', id: null, photo: null });

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

  // Load dark mode setting from AsyncStorage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedDarkMode = await AsyncStorage.getItem('darkMode');
        if (savedDarkMode !== null) {
          setDarkMode(JSON.parse(savedDarkMode));
        } else {
          setDarkMode(systemColorScheme === 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
        setDarkMode(systemColorScheme === 'dark');
      }
    };
    
    loadThemePreference();
  }, [systemColorScheme]);

  // Listen for theme changes
  useEffect(() => {
    const checkTheme = async () => {
      try {
        const savedDarkMode = await AsyncStorage.getItem('darkMode');
        if (savedDarkMode !== null) {
          const newDarkMode = JSON.parse(savedDarkMode);
          if (newDarkMode !== darkMode) {
            setDarkMode(newDarkMode);
          }
        }
      } catch (error) {
        console.error('Error checking theme:', error);
      }
    };
    
    const intervalId = setInterval(checkTheme, 1000);
    return () => clearInterval(intervalId);
  }, [darkMode]);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const fetchedNotes = await getNotes(userId);
      setNotes(fetchedNotes.sort((a, b) => 
        b.createdAt?.toDate?.() - a.createdAt?.toDate?.() || 0
      ));
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = () => {
    setCurrentNote({ title: '', content: '', id: null, photo: null });
    setEditMode(false);
    setModalVisible(true);
  };

  const handleEditNote = (note) => {
    setCurrentNote(note);
    setEditMode(true);
    setModalVisible(true);
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteNote(noteId);
      setNotes(notes.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleSaveNote = async () => {
    if (!currentNote.title.trim()) {
      return; // Don't save empty notes
    }

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      if (editMode && currentNote.id) {
        // Update existing note
        await updateNote(currentNote.id, {
          title: currentNote.title.trim(),
          content: currentNote.content.trim(),
          photo: currentNote.photo,
          updatedAt: new Date()
        });

        // Update state
        setNotes(notes.map(note => 
          note.id === currentNote.id 
            ? { 
                ...note, 
                title: currentNote.title.trim(), 
                content: currentNote.content.trim(),
                photo: currentNote.photo,
                updatedAt: new Date()
              } 
            : note
        ));
      } else {
        // Add new note
        const newNote = await addNote(userId, {
          title: currentNote.title.trim(),
          content: currentNote.content.trim(),
          photo: currentNote.photo
        });
        setNotes([newNote, ...notes]);
      }

      setModalVisible(false);
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        alert(t('common.permissionRequired'));
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCurrentNote({ ...currentNote, photo: { uri: result.assets[0].uri } });
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const renderNoteItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleEditNote(item)}>
      <Card style={styles.noteCard}>
        <ImageBackground
          source={darkMode ? darkNotebookPattern : notebookPattern}
          style={styles.notebookBackground}
          imageStyle={[
            styles.notebookImage,
            darkMode && { opacity: 0.4 }
          ]}
        >
          <Card.Content>
            <Text 
              style={[
                styles.noteTitle,
                darkMode && { color: theme.colors.onSurface }
              ]}
            >
              {item.title}
            </Text>
            <Text 
              style={[
                styles.noteContent,
                darkMode && { color: theme.colors.onSurfaceVariant }
              ]} 
              numberOfLines={3}
            >
              {item.content}
            </Text>
            {item.photo && (
              <Image 
                source={item.photo} 
                style={styles.photoThumbnail} 
                resizeMode="cover"
              />
            )}
          </Card.Content>
          <Card.Actions style={styles.cardActions}>
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeleteNote(item.id)}
              iconColor={darkMode ? theme.colors.onSurface : undefined}
            />
          </Card.Actions>
        </ImageBackground>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[
      styles.container,
      { backgroundColor: darkMode ? theme.colors.background : '#FFFFFF' }
    ]}>
      <StatusBar style={darkMode ? "light" : "dark"} />
      <Appbar.Header>
        <Appbar.Content title={t('notes.title')} />
      </Appbar.Header>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : notes.length === 0 ? (
        <View style={styles.centered}>
          <Text>No notes yet. Create some!</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          renderItem={renderNoteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.notesList,
            isDesktop && styles.desktopNotesList
          ]}
        />
      )}

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContainer,
                {
                  backgroundColor: darkMode ? '#333333' : '#FFFFFF',
                },
                isDesktop && styles.desktopModalContainer
              ]}
            >
              <ImageBackground
                source={darkMode ? darkNotebookPattern : notebookPattern}
                style={styles.modalBackground}
                imageStyle={[
                  styles.notebookImage,
                  { opacity: darkMode ? 0.1 : 0.3 }
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text 
                    style={[
                      styles.modalTitle,
                      darkMode && { color: theme.colors.primary }
                    ]}
                  >
                    {editMode ? t('notes.editNote') : t('notes.newNote')}
                  </Text>
                  <IconButton
                    icon="close"
                    size={24}
                    onPress={() => setModalVisible(false)}
                    iconColor={darkMode ? theme.colors.onSurface : undefined}
                  />
                </View>
                
                <TextInput
                  placeholder={t('notes.titlePlaceholder')}
                  value={currentNote.title}
                  onChangeText={(text) => setCurrentNote({ ...currentNote, title: text })}
                  style={[
                    styles.titleInput,
                    darkMode && { backgroundColor: '#000000', color: '#ffffff' }
                  ]}
                  mode="flat"
                  underlineColor={darkMode ? theme.colors.primary : '#6a0dad'}
                  placeholderTextColor={darkMode ? '#aaaaaa' : '#888'}
                  textColor={darkMode ? '#ffffff' : undefined}
                  selectionColor={darkMode ? theme.colors.primary : '#6a0dad'}
                />
                
                <TextInput
                  placeholder={t('notes.contentPlaceholder')}
                  value={currentNote.content}
                  onChangeText={(text) => setCurrentNote({ ...currentNote, content: text })}
                  style={[
                    styles.contentInput,
                    darkMode && { backgroundColor: '#000000', color: '#ffffff' }
                  ]}
                  multiline
                  mode="flat"
                  underlineColor="transparent"
                  scrollEnabled={false}
                  numberOfLines={10}
                  placeholderTextColor={darkMode ? '#aaaaaa' : '#888'}
                  textColor={darkMode ? '#ffffff' : undefined}
                />
                
                {currentNote.photo && (
                  <View style={styles.photoPreviewContainer}>
                    <Image 
                      source={currentNote.photo} 
                      style={styles.photoPreview} 
                      resizeMode="contain"
                    />
                    <IconButton
                      icon="close-circle"
                      size={24}
                      style={styles.removePhotoButton}
                      onPress={() => setCurrentNote({ ...currentNote, photo: null })}
                    />
                  </View>
                )}
                
                <View style={styles.actionButtons}>
                  <Button 
                    mode="contained"
                    onPress={handleSaveNote}
                    style={styles.saveButton}
                  >
                    {t('common.save')}
                  </Button>
                </View>
              </ImageBackground>
            </View>
          </View>
        </Modal>
      </Portal>

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={handleAddNote}
        color="#fff"
      />
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
  notesList: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100, // Extra padding for bottom tabs
    width: '100%',
  },
  desktopNotesList: {
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 32,
  },
  noteCard: {
    marginBottom: 16,
    ...(Platform.OS === 'web' 
      ? {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)'
        } 
      : {
          elevation: 4,
        }
    ),
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
  },
  notebookBackground: {
    padding: 8,
    width: '100%',
  },
  notebookImage: {
    resizeMode: 'repeat',
    opacity: 0.7,
  },
  noteTitle: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  noteContent: {
    fontFamily: 'System',
    fontSize: 14,
    color: '#666',
  },
  cardActions: {
    justifyContent: 'flex-end',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 80, // Position above the bottom tabs
    borderRadius: 28,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center', // Центрирование по вертикали
    alignItems: 'center', // Центрирование по горизонтали
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: '90%',
    width: Platform.OS === 'web' ? '60%' : '90%',
    // Убрано фиксированное позиционирование
    ...(Platform.OS === 'web' 
      ? {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)'
        } 
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }
    ),
  },
  desktopModalContainer: {
    maxWidth: 800,
  },
  modalBackground: {
    width: '100%',
    height: '100%',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: 'transparent',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6a0dad',
  },
  titleInput: {
    backgroundColor: 'transparent',
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 8,
    color: '#333',
  },
  contentInput: {
    backgroundColor: 'transparent',
    fontFamily: 'System',
    fontSize: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    maxHeight: 300,
    color: '#333',
  },
  photoPreviewContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    position: 'relative',
    alignItems: 'center',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginVertical: 16,
  },
  saveButton: {
    width: 150,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 4,
  },
}); 
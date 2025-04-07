import React, { useState, useEffect, useMemo } from 'react';
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
import { router, useRouter } from 'expo-router';
import TabAppBar from '../components/TabAppBar';
import PageBackground from '../../components/PageBackground';
import TabBackground from '../components/TabBackground';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import ThemeAwareView from '../components/ThemeAwareView';

// Notebook paper background pattern asset
const notebookPattern = { uri: 'https://www.transparenttextures.com/patterns/lined-paper-2.png' };
const darkNotebookPattern = { uri: 'https://www.transparenttextures.com/patterns/dark-leather.png' };

export default function NotesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isDarkMode } = useCustomTheme();
  const systemColorScheme = useColorScheme();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentNote, setCurrentNote] = useState({ title: '', content: '', id: null, photo: null });
  const [searchVisible, setSearchVisible] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(true);
  const router = useRouter();

  // Create fallback colors in case theme.colors.notesTab is undefined
  const notesTabColors = useMemo(() => theme.colors.notesTab || {
    primary: theme.colors.primary,
    secondary: theme.colors.secondary
  }, [theme.colors]);

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

  // Add a focus listener to refresh notes when the screen comes into focus
  useEffect(() => {
    console.log('Setting up notes refresh mechanism');
    
    // Function to check if we need to refresh notes - only if flag is set
    const refreshNotesIfNeeded = () => {
      // Always check web storage for refresh signal
      if (Platform.OS === 'web') {
        const needsRefreshFromStorage = sessionStorage.getItem('notes_needs_refresh');
        if (needsRefreshFromStorage === 'true') {
          console.log('Detected refresh signal from sessionStorage');
          sessionStorage.removeItem('notes_needs_refresh');
          // Force an immediate refresh
          console.log('Forcing immediate refresh from storage signal');
          fetchNotes();
          return; // Exit early since we're already refreshing
        }
      }
      
      if (needsRefresh) {
        console.log('Notes need refreshing - fetching notes');
        fetchNotes();
        setNeedsRefresh(false); // Reset the flag after refreshing
      } else {
        // Even if needsRefresh is false, do a refresh when the tab is focused again
        // This helps catch updates that might have been missed
        console.log('Refreshing notes on focus anyway to ensure latest data');
        fetchNotes();
      }
    };
    
    if (Platform.OS !== 'web') {
      // For native platforms, use the router focus event
      let unsubscribe = null;
      
      if (router && typeof router.addListener === 'function') {
        unsubscribe = router.addListener('focus', () => {
          console.log('Notes screen is focused - checking if refresh needed');
          refreshNotesIfNeeded();
        });
      } else {
        // Fallback: just refresh once initially and when needsRefresh changes
        console.log('Router addListener not available, using fallback refresh');
        refreshNotesIfNeeded();
      }
      
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } else {
      // For web, set up focus event listener - only refresh when tab/window is focused again
      window.addEventListener('focus', refreshNotesIfNeeded);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          refreshNotesIfNeeded();
        }
      });
      
      return () => {
        window.removeEventListener('focus', refreshNotesIfNeeded);
        document.removeEventListener('visibilitychange', refreshNotesIfNeeded);
      };
    }
  }, [needsRefresh]);

  // Additional useEffect to handle the case where we navigate back with params
  useEffect(() => {
    const handleRouteParams = () => {
      if (router.params?.refresh) {
        console.log('Detected refresh signal from router params');
        setNeedsRefresh(true);
        // Clear the params
        router.setParams({});
      }
    };
    
    handleRouteParams();
  }, [router.params]);

  // Initial data loading
  useEffect(() => {
    fetchNotes();
  }, []);

  // Add a global event listener for note updates
  useEffect(() => {
    // Define our custom event handler
    const handleNoteCreated = () => {
      console.log('Note created event detected - refreshing notes');
      fetchNotes();
    };
    
    // For web, use the window event system
    if (Platform.OS === 'web') {
      window.addEventListener('note-created', handleNoteCreated);
      
      return () => {
        window.removeEventListener('note-created', handleNoteCreated);
      };
    }
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.log('No user ID found when fetching notes');
        setLoading(false);
        return;
      }

      console.log('Fetching notes for user:', userId);
      const fetchedNotes = await getNotes(userId);
      console.log('Fetched notes count:', fetchedNotes?.length || 0);
      
      if (!fetchedNotes || fetchedNotes.length === 0) {
        console.log('No notes found for the current user');
        setNotes([]);
        setLoading(false);
        return;
      }
      
      // Detailed logging of fetched notes (excluding large content)
      console.log('Notes retrieved:', fetchedNotes.map(note => ({
        id: note.id,
        title: note.title,
        hasPhoto: !!note.photo,
        createdAt: note.createdAt
      })));
      
      // Sort notes by creation date (newest first)
      const sortedNotes = fetchedNotes.sort((a, b) => {
        // Handle cases where createdAt might be missing or in different formats
        const aTime = a.createdAt instanceof Date ? a.createdAt : 
                     (a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0));
        const bTime = b.createdAt instanceof Date ? b.createdAt : 
                     (b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0));
        return bTime - aTime;
      });
      
      console.log('Setting notes state with', sortedNotes.length, 'notes');
      setNotes(sortedNotes);
      
      // After fetching is complete, reset needsRefresh
      setNeedsRefresh(false);
    } catch (error) {
      console.error('Error fetching notes:', error);
      // In case of error, try to recover with an empty array
      setNotes([]);
      alert('Error loading notes. Please pull down to refresh.');
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
      setSaveLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.error('No user ID found when saving note');
        alert(t('common.errorSaving'));
        setSaveLoading(false);
        return;
      }

      let savedNote;
      
      if (editMode && currentNote.id) {
        // Update existing note
        await updateNote(currentNote.id, {
          title: currentNote.title.trim(),
          content: currentNote.content.trim(),
          photo: currentNote.photo,
          updatedAt: new Date()
        });

        // Update state
        savedNote = {
          ...currentNote,
          title: currentNote.title.trim(), 
          content: currentNote.content.trim(),
          updatedAt: new Date()
        };
        
        setNotes(prevNotes => 
          prevNotes.map(note => note.id === currentNote.id ? savedNote : note)
        );
        console.log('Note updated successfully');
      } else {
        // Add new note
        console.log('Adding new note for user:', userId);
        savedNote = await addNote(userId, {
          title: currentNote.title.trim(),
          content: currentNote.content.trim(),
          photo: currentNote.photo
        });
        console.log('New note created:', savedNote);
        
        // Update notes state with new note
        setNotes(prevNotes => [savedNote, ...prevNotes]);
        console.log('Note saved successfully:', savedNote);
      }

      // Force modal to close after a slight delay (gives time for state updates)
      setTimeout(() => {
        forceCloseModal();
        // Force a refresh of the notes list after the modal is closed
        setTimeout(fetchNotes, 300);
      }, 100);
      
    } catch (error) {
      console.error('Error saving note:', error);
      alert(t('common.errorSaving'));
      setSaveLoading(false);
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
          source={isDarkMode ? darkNotebookPattern : notebookPattern}
          style={styles.notebookBackground}
          imageStyle={[
            styles.notebookImage,
            isDarkMode && { opacity: 0.4 }
          ]}
        >
          <Card.Content>
            <Text 
              style={[
                styles.noteTitle,
                isDarkMode && { color: theme.colors.onSurface }
              ]}
            >
              {item.title}
            </Text>
            <Text 
              style={[
                styles.noteContent,
                isDarkMode && { color: theme.colors.onSurfaceVariant }
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
              iconColor={isDarkMode ? theme.colors.onSurface : undefined}
            />
          </Card.Actions>
        </ImageBackground>
      </Card>
    </TouchableOpacity>
  );

  // Add handleOpenMenu function
  const handleOpenMenu = () => {
    // Handle menu open action
    console.log('Menu opened');
  };

  // Add a function to forcefully close the modal
  const forceCloseModal = () => {
    setModalVisible(false);
    setSaveLoading(false);
    setCurrentNote({ title: '', content: '', id: null, photo: null });
  };

  // Add a function to manually trigger a refresh when needed
  const triggerRefresh = () => {
    setNeedsRefresh(true);
    fetchNotes();
  };

  return (
    <ThemeAwareView tabName="notes">
      <TabAppBar title={t('notes.title')} tabName="notes" />
      <View style={styles.container}>
        <PageBackground pageName="notes" />
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            contentContainerStyle={[
              styles.notesList,
              isDesktop && styles.desktopNotesList
            ]}
            data={notes}
            keyExtractor={(item) => item.id}
            renderItem={renderNoteItem}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text style={{ color: theme.colors.onSurfaceVariant, marginBottom: 20 }}>
                  {t('notes.noNotes')}
                </Text>
              </View>
            }
          />
        )}
        
        <FAB
          style={[
            styles.fab,
            { 
              backgroundColor: '#FFEB3B',
              bottom: 7  // Increase this value more to move button down further
            }
          ]}
          icon="plus"
          onPress={() => router.push('/add-note')}
          color="#000"
          label={t('notes.addNew')}
        />
        
        {/* Modal for adding/editing notes */}
        <Portal>
          <Modal
            key={`note-modal-${modalVisible ? 'open' : 'closed'}`}
            visible={modalVisible}
            onDismiss={forceCloseModal}
            contentContainerStyle={styles.modalOverlay}
            dismissable={!saveLoading}
          >
            <View style={[
              styles.modalContainer,
              isDesktop && styles.desktopModalContainer,
              { backgroundColor: theme.colors.surface }
            ]}>
              <ImageBackground
                source={isDarkMode ? darkNotebookPattern : notebookPattern}
                style={styles.modalBackground}
                imageStyle={[
                  styles.notebookImage,
                  isDarkMode && { opacity: 0.4 }
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {editMode ? t('notes.editNote') : t('notes.addNote')}
                  </Text>
                  <IconButton
                    icon="close"
                    size={24}
                    onPress={forceCloseModal}
                    disabled={saveLoading}
                  />
                </View>
                
                <TextInput
                  label={t('notes.title')}
                  value={currentNote.title}
                  onChangeText={(text) => setCurrentNote({ ...currentNote, title: text })}
                  style={styles.titleInput}
                  mode="flat"
                />
                
                <TextInput
                  label={t('notes.content')}
                  value={currentNote.content}
                  onChangeText={(text) => setCurrentNote({ ...currentNote, content: text })}
                  multiline
                  numberOfLines={8}
                  style={styles.contentInput}
                  mode="flat"
                />
                
                {currentNote.photo && (
                  <View style={styles.photoPreviewContainer}>
                    <Image
                      source={currentNote.photo}
                      style={styles.photoPreview}
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
                    onPress={pickImage}
                    icon="image"
                    style={{ marginRight: 16 }}
                  >
                    {t('common.addPhoto')}
                  </Button>
                  
                  <Button
                    mode="contained"
                    onPress={saveLoading ? null : handleSaveNote}
                    style={[
                      styles.saveButton,
                      saveLoading && { opacity: 0.7 }
                    ]}
                    loading={saveLoading}
                    disabled={saveLoading || !currentNote.title.trim()}
                  >
                    {saveLoading ? t('common.saving') : t('common.save')}
                  </Button>
                </View>
              </ImageBackground>
            </View>
          </Modal>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notesList: {
    padding: 16,
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
    width: '100%',
  },
  desktopNotesList: {
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 50,
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
    bottom: 0,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 0, // Remove padding to allow full screen
    width: '100%',
    height: '100%',
    margin: 0,
  },
  modalContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 0, // Remove border radius for fullscreen
    overflow: 'hidden',
    maxHeight: '100%', // Use 100% for fullscreen
    ...(Platform.OS === 'web' 
      ? {
          boxShadow: 'none' // Remove shadow for fullscreen
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
    width: '100%',
    maxWidth: '100%', // Use 100% for fullscreen
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
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    width: '100%',
  },
  modalTitle: {
    fontSize: 24,
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
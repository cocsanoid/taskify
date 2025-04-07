import { StyleSheet, Platform, View, ScrollView, SafeAreaView, KeyboardAvoidingView, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { TextInput, Button, IconButton, Appbar, useTheme, Text } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { auth, addNote } from './utils/_firebase';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 0,
    overflow: 'hidden',
  },
  modalSmall: {
    width: '100%',
    height: '100%',
    maxHeight: '100%',
    minHeight: '100%',
    borderRadius: 0,
  },
  formScroll: {
    flex: 1,
    paddingBottom: Platform.OS === 'web' ? 20 : 100,
  },
  appbar: {
    elevation: 0,
  },
  inputContainer: {
    padding: 16,
    flex: 1,
    width: '100%',
  },
  titleInput: {
    fontSize: 24,
    marginBottom: 20,
    width: '100%',
  },
  contentInput: {
    flex: 1,
    marginBottom: 16,
    minHeight: 300,
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 16,
  },
  photoPreviewContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  photoLabel: {
    marginBottom: 8,
  },
  removePhotoButton: {
    marginTop: 8,
  }
});

export default function AddNote() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  // Get user ID on component mount
  useEffect(() => {
    const checkAuth = () => {
      const user = auth.currentUser;
      console.log('Current user:', user ? user.uid : 'No user');
      if (user) {
        setUserId(user.uid);
      }
    };
    
    checkAuth();
    // Add auth state change listener
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user ? user.uid : 'No user');
      setUserId(user ? user.uid : null);
    });
    
    return () => unsubscribe();
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, введите заголовок для заметки');
      return;
    }

    try {
      setLoading(true);
      // Get current user ID directly
      const currentUserId = auth.currentUser?.uid;
      
      console.log('Attempting to save note for user:', currentUserId);
      if (!currentUserId) {
        console.error('No user ID found when saving note');
        Alert.alert('Ошибка аутентификации', 'Пожалуйста, войдите в систему, чтобы сохранить заметку');
        setLoading(false);
        return;
      }

      // Prepare note data with proper photo format
      const noteData = {
        title: title.trim(),
        content: content.trim(),
        // Ensure proper format for photo data
        photo: photo ? {
          uri: photo.uri,
          type: 'image/jpeg', // Default type if not available
          fileName: 'photo.jpg' // Default filename if not available
        } : null
      };
      
      console.log('Saving note with data:', JSON.stringify(noteData));
      
      // Add the note
      const savedNote = await addNote(currentUserId, noteData);
      console.log('Note saved successfully:', savedNote);
      
      // Reset loading state
      setLoading(false);
      
      // First navigate back to the notes screen with a parameter to trigger refresh
      if (Platform.OS === 'web') {
        // For web, we'll use both sessionStorage and a custom event
        sessionStorage.setItem('notes_needs_refresh', 'true');
        
        // Dispatch a custom event to notify that a note was created
        try {
          window.dispatchEvent(new Event('note-created'));
          console.log('Dispatched note-created event');
        } catch (eventError) {
          console.error('Failed to dispatch event:', eventError);
        }
        
        router.back();
      } else {
        // For native, use router params
        router.navigate('/(tabs)', { refresh: true });
      }
      
      // Then show success message
      setTimeout(() => {
        Alert.alert(
          'Успешно', 
          'Заметка сохранена'
        );
      }, 100);
    } catch (error) {
      console.error('Error saving note:', error);
      setLoading(false);
      Alert.alert(
        t('errors.genericError'), 
        'Не удалось сохранить заметку: ' + (error.message || t('errors.tryAgain'))
      );
    }
  };

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(t('common.permissionRequired'), 
          'Для добавления фотографии необходим доступ к галерее.');
        return;
      }
      
      // Launch picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      // Handle result
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('Photo selected:', asset.uri);
        const photoInfo = {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          fileName: asset.fileName || 'photo.jpg'
        };
        setPhoto(photoInfo);
        Alert.alert(t('notes.photoAdded'));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('errors.genericError'), t('errors.tryAgain'));
    }
  };

  const removePhoto = () => {
    setPhoto(null);
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.modalContent, { backgroundColor: theme.colors.background }]}
      >
        <Appbar.Header style={[styles.appbar, { backgroundColor: theme.colors.surface }]}>
          <Appbar.BackAction onPress={handleBack} color={theme.colors.onSurface} />
          <Appbar.Content title={t('notes.newNote')} color={theme.colors.onSurface} />
          <Appbar.Action 
            icon="check" 
            onPress={handleSave} 
            disabled={!title.trim() || loading} 
            color={theme.colors.onSurface}
          />
        </Appbar.Header>
        
        <ScrollView 
          style={[styles.formScroll, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={{ backgroundColor: theme.colors.background }}
        >
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.background }]}>
            <TextInput
              label={t('notes.titlePlaceholder')}
              value={title}
              onChangeText={setTitle}
              style={[styles.titleInput, { backgroundColor: 'transparent' }]}
              mode="flat"
              autoFocus
              textColor={theme.colors.onBackground}
              underlineColor={theme.colors.onSurfaceVariant}
              activeUnderlineColor={theme.colors.primary}
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
            
            <TextInput
              label={t('notes.contentPlaceholder')}
              value={content}
              onChangeText={setContent}
              style={[styles.contentInput, { backgroundColor: 'transparent' }]}
              mode="flat"
              multiline
              numberOfLines={Platform.OS === 'ios' ? null : 8}
              textAlignVertical="top"
              textColor={theme.colors.onBackground}
              underlineColor={theme.colors.onSurfaceVariant}
              activeUnderlineColor={theme.colors.primary}
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />

            {photo && (
              <View style={styles.photoPreviewContainer}>
                <Text style={[styles.photoLabel, { color: theme.colors.onBackground }]}>
                  {t('notes.addPhoto')}:
                </Text>
                <Image 
                  source={{ uri: photo.uri }} 
                  style={styles.photoPreview} 
                  resizeMode="cover"
                />
                <Button 
                  mode="outlined" 
                  onPress={removePhoto} 
                  style={styles.removePhotoButton}
                  textColor={theme.colors.error}
                >
                  {t('common.delete')}
                </Button>
              </View>
            )}
          </View>
        </ScrollView>
        
        <View style={[styles.buttonContainer, { backgroundColor: theme.colors.background }]}>
          <IconButton
            icon={photo ? "image-edit" : "image"}
            mode="contained"
            onPress={pickImage}
            disabled={loading}
            iconColor={theme.colors.onPrimary}
            containerColor={theme.colors.primary}
          />
          
          <Button 
            mode="contained" 
            onPress={handleSave}
            loading={loading}
            disabled={!title.trim() || loading}
            textColor={theme.colors.onPrimary}
            buttonColor={theme.colors.primary}
          >
            {t('common.save')}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 
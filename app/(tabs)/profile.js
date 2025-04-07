import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions, Image, ActivityIndicator } from 'react-native';
import { 
  Card, 
  Text, 
  useTheme, 
  Switch, 
  Divider, 
  Avatar, 
  Button,
  List,
  IconButton,
  Modal,
  Portal,
  TextInput
} from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { auth, signOut, logoutUser } from '../utils/_firebase';
import { updatePassword, updateProfile, deleteUser } from 'firebase/auth';
import TabBackground from '../components/TabBackground';
import TabAppBar from '../components/TabAppBar';
import PageBackground from '../../components/PageBackground';
import { useTheme as useCustomTheme } from '../context/ThemeContext';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { isDarkMode, toggleTheme, setDarkMode } = useCustomTheme();
  const [user, setUser] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  // Create fallback colors in case theme.colors.profileTab is undefined
  const profileTabColors = theme.colors.profileTab || {
    primary: theme.colors.primary,
    secondary: theme.colors.secondary
  };
  
  // Responsive layout handling
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const isDesktop = Platform.OS === 'web' && dimensions.width >= 1024;
  const isTablet = Platform.OS === 'web' && dimensions.width >= 768 && dimensions.width < 1024;
  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android' || dimensions.width < 768;
  
  useEffect(() => {
    // Get current user
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser({
        displayName: currentUser.displayName || t('profile.anonymous'),
        email: currentUser.email,
        photoURL: currentUser.photoURL,
        uid: currentUser.uid,
      });
    } else {
      // Redirect to login if not logged in
      router.replace('/(auth)/login');
    }
    
    // Listen for dimension changes
    const updateDimensions = () => {
      setDimensions(Dimensions.get('window'));
    };
    
    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => {
      subscription.remove();
    };
  }, []);
  
  // Function to toggle dark mode
  const handleToggleDarkMode = async () => {
    try {
      // Use the toggleTheme function from the context
      toggleTheme();
      // Force a re-render with a timestamp update for other components that aren't using the context directly
      await AsyncStorage.setItem('themeUpdateTimestamp', Date.now().toString());
    } catch (error) {
      console.error('Failed to toggle dark mode:', error);
    }
  };
  
  // Function to handle logout
  const handleLogout = async () => {
    try {
      await logoutUser();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };
  
  const handleOpenMenu = () => {
    setMenuVisible(true);
  };
  
  const confirmLogout = () => {
    setLogoutModalVisible(true);
  };
  
  const dismissLogoutModal = () => {
    setLogoutModalVisible(false);
  };

  const openEditProfileModal = () => {
    setNewName(user?.displayName || '');
    setNewPassword('');
    setEditProfileModalVisible(true);
  };

  const dismissEditProfileModal = () => {
    setEditProfileModalVisible(false);
  };

  const openPrivacyModal = () => {
    setPrivacyModalVisible(true);
  };

  const dismissPrivacyModal = () => {
    setPrivacyModalVisible(false);
  };

  const openDeleteAccountModal = () => {
    setDeleteAccountModalVisible(true);
    setDeleteConfirmation('');
  };

  const dismissDeleteAccountModal = () => {
    setDeleteAccountModalVisible(false);
    setDeleteConfirmation('');
  };

  const handleDeleteAccount = async () => {
    // Don't proceed if already submitting
    if (isSubmitting) return;
    
    // Validate confirmation
    if (deleteConfirmation !== 'DELETE') {
      alert(t('profile.invalidConfirmation'));
      return;
    }
    
    try {
      setIsSubmitting(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      // First perform any cleanup operations needed (can be expanded)
      console.log('Preparing to delete account...');
      
      // Delete the user account
      await deleteUser(currentUser);
      console.log('Account deleted successfully');
      
      // Close modal and redirect
      setDeleteAccountModalVisible(false);
      setDeleteConfirmation('');
      
      // Navigate to login screen
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 100);
    } catch (error) {
      console.error('Error deleting account:', error);
      
      // Provide more specific error feedback
      if (error.code === 'auth/requires-recent-login') {
        alert(t('profile.recentLoginRequired'));
      } else {
        alert(t('profile.deleteAccountError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileUpdate = async () => {
    // Don't proceed if already submitting
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Create an array of promises for parallel execution
      const updatePromises = [];
      
      // Update display name if changed
      if (newName && newName !== user.displayName) {
        updatePromises.push(
          updateProfile(currentUser, { displayName: newName })
            .then(() => {
              console.log('Display name updated successfully');
              // Update local state immediately for better UX
              setUser(prev => ({ ...prev, displayName: newName }));
            })
        );
      }
      
      // Update password if provided
      if (newPassword) {
        updatePromises.push(
          updatePassword(currentUser, newPassword)
            .then(() => {
              console.log('Password updated successfully');
            })
        );
      }
      
      // Execute all updates in parallel
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        console.log('All profile updates completed successfully');
      } else {
        console.log('No changes to apply');
      }
      
      // Close modal
      setEditProfileModalVisible(false);
      
      // Clear form fields
      setNewPassword('');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(t('profile.updateError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only render if user is available
  if (!user) return null;

  return (
    <TabBackground tabName="profile">
      <TabAppBar title={t('profile.title')} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <PageBackground pageName="profile" />
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && styles.desktopContent
          ]}
        >
          <Card style={[styles.profileCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <Card.Content style={styles.profileContent}>
              <View style={styles.avatarContainer}>
                {user.photoURL ? (
                  <Avatar.Image 
                    size={100} 
                    source={{ uri: user.photoURL }}
                    style={styles.avatar}
                  />
                ) : (
                  <Avatar.Text 
                    size={100} 
                    label={user.displayName ? user.displayName.charAt(0).toUpperCase() : "?"}
                    color="#fff"
                    style={[styles.avatar, { backgroundColor: profileTabColors.primary }]}
                  />
                )}
                
                <View style={styles.userInfo}>
                  <Text 
                    style={[
                      styles.userName, 
                      { color: theme.colors.onSurface }
                    ]}
                    numberOfLines={1}
                  >
                    {user.displayName}
                  </Text>
                  <Text 
                    style={[
                      styles.userEmail, 
                      { color: theme.colors.onSurfaceVariant }
                    ]}
                    numberOfLines={1}
                  >
                    {user.email}
                  </Text>
                </View>
              </View>
              
              <Button 
                mode="outlined" 
                style={[
                  styles.editProfileButton,
                  { borderColor: profileTabColors.primary }
                ]}
                textColor={profileTabColors.primary}
                onPress={openEditProfileModal}
              >
                {t('profile.editProfile')}
              </Button>
            </Card.Content>
          </Card>
          
          <Card style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                {t('profile.appSettings')}
              </Text>
              
              <List.Item
                title={t('profile.darkMode')}
                left={props => <List.Icon {...props} icon="theme-light-dark" color={profileTabColors.primary} />}
                right={props => (
                  <Switch
                    value={isDarkMode}
                    onValueChange={handleToggleDarkMode}
                    color={profileTabColors.primary}
                  />
                )}
                titleStyle={{ color: theme.colors.onSurface }}
              />
              <Divider />
            </Card.Content>
          </Card>
          
          <Card style={[styles.accountCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                {t('profile.account')}
              </Text>
              
              <List.Item
                title={t('profile.dataPrivacy')}
                left={props => <List.Icon {...props} icon="shield-outline" color={profileTabColors.primary} />}
                titleStyle={{ color: theme.colors.onSurface }}
                onPress={openPrivacyModal}
              />
              <Divider />
              
              <List.Item
                title={t('profile.logout')}
                left={props => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
                titleStyle={{ color: theme.colors.error }}
                onPress={confirmLogout}
              />
            </Card.Content>
          </Card>
          
          <Card style={[styles.dangerCard, { backgroundColor: theme.colors.errorContainer }]} elevation={2}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onErrorContainer }]}>
                {t('profile.dangerZone')}
              </Text>
              
              <Text style={[styles.warningText, { color: theme.colors.onErrorContainer }]}>
                {t('profile.deleteAccountWarning')}
              </Text>
              
              <Button 
                mode="contained" 
                buttonColor={theme.colors.error}
                textColor={theme.colors.onError}
                onPress={openDeleteAccountModal}
                style={styles.deleteAccountButton}
              >
                {t('profile.deleteAccount')}
              </Button>
            </Card.Content>
          </Card>
          
          <View style={styles.infoSection}>
            <Text style={[styles.appVersion, { color: theme.colors.onSurfaceVariant }]}>
              {t('profile.version')} 1.0.0
            </Text>
          </View>
          
          <View style={styles.bottomPadding} />
        </ScrollView>
        
        <Portal>
          <Modal 
            visible={logoutModalVisible} 
            onDismiss={dismissLogoutModal}
            contentContainerStyle={[
              styles.modal,
              {backgroundColor: theme.colors.surface}
            ]}
          >
            <Text style={{color: theme.colors.onSurface, marginBottom: 20}}>
              {t('profile.confirmLogout')}
            </Text>
            <View style={styles.modalActions}>
              <Button 
                onPress={dismissLogoutModal} 
                style={{marginRight: 8}}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                mode="contained"
                onPress={handleLogout}
                buttonColor={theme.colors.error}
              >
                {t('profile.logout')}
              </Button>
            </View>
          </Modal>

          <Modal
            visible={editProfileModalVisible}
            onDismiss={dismissEditProfileModal}
            contentContainerStyle={[
              styles.modal,
              { backgroundColor: theme.colors.surface }
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              {t('profile.editProfile')}
            </Text>
            
            <TextInput
              label={t('profile.name')}
              value={newName}
              onChangeText={setNewName}
              mode="outlined"
              style={styles.input}
              disabled={isSubmitting}
              error={newName.trim() === ''}
              autoCapitalize="words"
            />
            
            <TextInput
              label={t('profile.newPassword')}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              mode="outlined"
              style={styles.input}
              disabled={isSubmitting}
              error={newPassword.length > 0 && newPassword.length < 6}
              helperText={newPassword.length > 0 && newPassword.length < 6 ? t('profile.passwordMinLength') : ''}
            />
            
            {isSubmitting && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={profileTabColors.primary} style={styles.loadingSpinner} />
                <Text style={styles.loadingText}>{t('profile.updating')}</Text>
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <Button 
                mode="outlined" 
                onPress={dismissEditProfileModal}
                style={styles.cancelButton}
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                mode="contained" 
                onPress={handleProfileUpdate}
                loading={isSubmitting}
                disabled={isSubmitting || (newName.trim() === '' && newPassword === '') || (newPassword.length > 0 && newPassword.length < 6)}
                style={[styles.saveButton, { backgroundColor: profileTabColors.primary }]}
              >
                {t('common.save')}
              </Button>
            </View>
          </Modal>

          <Modal
            visible={privacyModalVisible}
            onDismiss={dismissPrivacyModal}
            contentContainerStyle={[
              styles.modal,
              { backgroundColor: theme.colors.surface }
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              {t('profile.dataPrivacy')}
            </Text>
            
            <Text style={[styles.modalText, { color: theme.colors.onSurfaceVariant }]}>
              {t('profile.privacyDescription')}
            </Text>
            
            <View style={styles.modalButtons}>
              <Button 
                mode="contained" 
                onPress={dismissPrivacyModal}
                style={[styles.saveButton, { backgroundColor: profileTabColors.primary }]}
              >
                {t('common.ok')}
              </Button>
            </View>
          </Modal>

          <Modal 
            visible={deleteAccountModalVisible} 
            onDismiss={dismissDeleteAccountModal}
            contentContainerStyle={[
              styles.modal,
              { backgroundColor: theme.colors.surface }
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.error }]}>
              {t('profile.deleteAccountTitle')}
            </Text>
            
            <Text style={{ color: theme.colors.onSurface, marginBottom: 20 }}>
              {t('profile.deleteAccountConfirmation')}
            </Text>
            
            <TextInput
              label={t('profile.deleteAccountPrompt')}
              value={deleteConfirmation}
              onChangeText={setDeleteConfirmation}
              style={{ marginBottom: 20 }}
              disabled={isSubmitting}
              error={deleteConfirmation !== '' && deleteConfirmation !== 'DELETE'}
              maxLength={6}
            />
            
            {isSubmitting && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.error} style={styles.loadingSpinner} />
                <Text style={styles.loadingText}>{t('profile.deletingAccount')}</Text>
              </View>
            )}
            
            <View style={styles.modalActions}>
              <Button 
                onPress={dismissDeleteAccountModal} 
                style={{ marginRight: 8 }}
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                mode="contained"
                onPress={handleDeleteAccount}
                buttonColor={theme.colors.error}
                disabled={deleteConfirmation !== 'DELETE' || isSubmitting}
                loading={isSubmitting}
              >
                {t('profile.deleteAccount')}
              </Button>
            </View>
          </Modal>
        </Portal>
      </View>
    </TabBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    padding: 16,
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 100,
  },
  desktopContent: {
    maxWidth: 900,
    alignSelf: 'center',
    paddingHorizontal: 50,
  },
  profileCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  profileContent: {
    paddingVertical: 16,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
  },
  editProfileButton: {
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  settingsCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  accountCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  appVersion: {
    fontSize: 14,
  },
  bottomPadding: {
    height: 100,
  },
  modal: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalText: {
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    marginBottom: 16,
  },
  saveButton: {
    minWidth: 100,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    marginRight: 12,
  },
  dangerCard: {
    marginVertical: 16,
    borderRadius: 12,
  },
  warningText: {
    marginBottom: 16,
  },
  deleteAccountButton: {
    alignSelf: 'flex-start',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    justifyContent: 'center',
  },
  loadingSpinner: {
    marginRight: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
}); 
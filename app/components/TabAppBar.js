import React from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { Appbar, useTheme, Text, Avatar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { useTheme as useCustomTheme } from '../context/ThemeContext';

/**
 * Custom AppBar component with tab-specific styling
 * 
 * @param {string} tabName - Name of the tab (home, tasks, calendar, notes, habits, profile)
 * @param {string} title - Title to display in the AppBar
 * @param {Function} onMenuPress - Function to execute when menu button is pressed
 * @param {React.ReactNode} rightItems - Additional items to render on the right side
 * @param {object} user - User object for profile display (optional)
 * @returns {React.ReactNode}
 */
export default function TabAppBar({ 
  tabName, 
  title, 
  onMenuPress, 
  rightItems,
  user
}) {
  const theme = useTheme();
  const { isDarkMode } = useCustomTheme();
  const insets = useSafeAreaInsets();
  
  // Ensure onMenuPress is a function
  const handleMenuPress = typeof onMenuPress === 'function' ? onMenuPress : () => console.log('Menu pressed');
  
  // Get appropriate colors based on tab name
  const tabKey = `${tabName}Tab`;
  const tabColors = isDarkMode ? Colors.dark[tabKey] : Colors.light[tabKey];
  
  // If no tab-specific colors found, fallback to home
  const colors = tabColors || (isDarkMode ? Colors.dark.homeTab : Colors.light.homeTab);
  
  // Determine if we are on mobile
  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  
  // Get first letter of display name for avatar fallback
  const getInitial = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };
  
  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="transparent"
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        translucent
      />
      
      <View 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          height: isMobile ? 70 + insets.top : 80,
          zIndex: -1,
          backgroundColor: colors.gradient[0]
        }}
      >
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            flex: 1,
            width: '100%',
            height: '100%'
          }}
        />
      </View>
      
      <Appbar.Header
        style={[
          styles.header,
          { 
            backgroundColor: 'transparent',
            paddingHorizontal: isMobile ? 0 : 8,
          }
        ]}
      >
        {isMobile && (
          <Appbar.Action 
            icon="menu" 
            color={isDarkMode ? '#fff' : '#fff'} 
            onPress={handleMenuPress} 
            size={26}
            style={{ marginLeft: 0, paddingLeft: 0 }}
          />
        )}
        
        <View style={[
          styles.titleContainer,
          isMobile ? { justifyContent: 'flex-start' } : { justifyContent: 'center' }
        ]}>
          {user && (
            user.photoURL ? (
              <Avatar.Image 
                size={32} 
                source={{ uri: user.photoURL }} 
                style={styles.avatar}
              />
            ) : (
              <Avatar.Text 
                size={32} 
                label={getInitial(user.displayName)}
                color="#fff"
                style={[styles.avatar, { backgroundColor: colors.secondary }]}
              />
            )
          )}
          <Text 
            variant="titleLarge" 
            style={[
              styles.title,
              { color: isDarkMode ? '#fff' : '#fff' } 
            ]}
          >
            {title}
          </Text>
        </View>
        
        <View style={styles.rightItems}>
          {rightItems}
        </View>
      </Appbar.Header>
      
      {/* Tab-specific accent decoration */}
      <View style={[
        styles.accentDecoration,
        { backgroundColor: colors.secondary }
      ]}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View 
            key={i}
            style={[
              styles.accentDot,
              { 
                backgroundColor: isDarkMode ? '#fff' : '#fff',
                left: i * 40 + 10,
                opacity: 0.2 + (i * 0.05)
              }
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: '100vw',
    overflow: 'visible',
  },
  header: {
    elevation: 0,
    paddingHorizontal: 4,
    height: 70,
    width: '100%',
    backgroundColor: 'transparent',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
  },
  rightItems: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accentDecoration: {
    height: 6,
    width: '100%',
    position: 'relative',
  },
  accentDot: {
    position: 'absolute',
    top: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
  }
}); 
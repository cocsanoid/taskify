/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

/**
 * Updated colors for the app with distinct colors for each tab.
 * Using more vibrant and engaging color schemes.
 */

// Main theme colors
const primaryPurple = '#7e41d4';  // Main purple
const secondaryBlue = '#3498db';  // Blue accent
const accentPink = '#e84393';     // Pink accent
const accentGreen = '#00b894';    // Green accent
const accentOrange = '#e67e22';   // Orange accent

// Tab-specific colors
const homeColors = {
  primary: '#9c42f5',  // Vibrant purple
  secondary: '#8248e5',
  gradient: ['#9c42f5', '#7e41d4'],
  cardBg: '#f0e7ff'
};

const tasksColors = {
  primary: '#3498db',  // Blue
  secondary: '#2980b9',
  gradient: ['#3498db', '#2980b9'],
  cardBg: '#e7f5ff'
};

const calendarColors = {
  primary: '#00b894',  // Green
  secondary: '#009688',
  gradient: ['#00b894', '#009688'],
  cardBg: '#e7fff3'
};

const notesColors = {
  primary: '#f39c12',  // Orange/Gold
  secondary: '#e67e22',
  gradient: ['#f39c12', '#e67e22'],
  cardBg: '#fff7e7'
};

const habitsColors = {
  primary: '#FF69B4',  // Hot Pink
  secondary: '#FF1493',  // Deep Pink
  gradient: ['#FF69B4', '#FF1493'],
  cardBg: '#ffe7f5'
};

const profileColors = {
  primary: '#4a69bd',  // Navy Blue
  secondary: '#273c75',
  gradient: ['#4a69bd', '#273c75'],
  cardBg: '#e7efff'
};

// Dark mode variations
const darkPurple = '#5e20aa';
const darkBlue = '#2980b9';
const darkPink = '#c2185b';

// Stripes and decoration colors
const stripeColors = ['#9c42f5', '#3498db', '#e84393', '#00b894', '#f39c12'];

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: primaryPurple,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: primaryPurple,
    primary: primaryPurple,
    secondary: secondaryBlue,
    accent: accentPink,
    success: accentGreen,
    warning: accentOrange,
    error: '#ff3b30',
    surface: '#ffffff',
    surfaceVariant: '#f5f5f5',
    border: '#e0e0e0',
    striped: stripeColors,
    homeTab: homeColors,
    tasksTab: tasksColors,
    calendarTab: calendarColors,
    notesTab: notesColors,
    habitsTab: habitsColors,
    profileTab: profileColors,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#ffffff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#ffffff',
    primary: primaryPurple,
    secondary: secondaryBlue,
    accent: accentPink,
    success: accentGreen,
    warning: accentOrange,
    error: '#ff453a',
    surface: '#222222',
    surfaceVariant: '#333333',
    border: '#444444',
    striped: stripeColors,
    homeTab: {
      primary: '#9c42f5',
      secondary: '#8248e5',
      gradient: ['#9c42f5', '#7e41d4'],
      cardBg: '#2a1e3a'
    },
    tasksTab: {
      primary: '#3498db',
      secondary: '#2980b9',
      gradient: ['#3498db', '#2980b9'],
      cardBg: '#1e293a'
    },
    calendarTab: {
      primary: '#00b894',
      secondary: '#009688',
      gradient: ['#00b894', '#009688'],
      cardBg: '#1e3a2a'
    },
    notesTab: {
      primary: '#f39c12',
      secondary: '#e67e22',
      gradient: ['#f39c12', '#e67e22'],
      cardBg: '#3a2e1e'
    },
    habitsTab: {
      primary: '#FF69B4',  // Hot Pink
      secondary: '#FF1493',  // Deep Pink
      gradient: ['#FF69B4', '#FF1493'],
      cardBg: '#3a1e2e'
    },
    profileTab: {
      primary: '#4a69bd',
      secondary: '#273c75',
      gradient: ['#4a69bd', '#273c75'],
      cardBg: '#1e233a'
    },
  },
};

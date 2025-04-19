# Taskify - Task Management Application

Taskify is a full-featured task management application built with React Native, Expo, and Firebase. It allows users to manage their daily tasks with features like authentication, task creation, editing, and completion tracking.

## Features

- 🔒 User authentication (login/register)
- ✅ Create, edit, and delete tasks
- 📆 Set due dates for tasks
- 📅 Calendar view to see scheduled tasks
- 📝 Create, edit, and delete notes with a notebook-like interface
- ✓ Mark tasks as completed
- 🌓 Light/dark theme support
- 📱 Cross-platform (iOS, Android, Web)

## Prerequisites

- Node.js (16.x or higher)
- npm or yarn
- Expo CLI
- Firebase account

## Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/taskify.git
cd taskify
```

2. Install dependencies:
```
npm install
```

3. Configure Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication with Email/Password method
   - Create a Firestore database
   - Get your Firebase configuration (apiKey, authDomain, etc.)
   - Replace the placeholder values in `app/utils/firebase.js` with your actual Firebase config

4. Start the development server:
```
npm start
```

5. Run on your device:
   - For iOS (requires macOS): `npm run ios`
   - For Android: `npm run android`
   - For web: `npm run web`
   - Or scan the QR code with Expo Go app

## Building for Production

### For Android (APK)

```
expo build:android
```

### For iOS (requires Apple Developer account)

```
expo build:ios
```

### For Web

```
expo build:web
```

## Project Structure

- `app/` - Expo Router screens and navigation
  - `(auth)/` - Authentication screens (login, register)
  - `(tabs)/` - Main app tabs (tasks, calendar, notes, profile)
  - `utils/` - Firebase and utility functions
- `components/` - Reusable components
- `assets/` - Images, fonts, and other static assets

## New Features (v1.1)

### Due Dates
- Set due dates when creating or editing tasks
- Tasks are color-coded based on due dates (today, tomorrow, past due)
- Tasks are sorted by due date for better prioritization

### Calendar View
- Interactive calendar to visualize your scheduled tasks
- Dates with tasks are marked with dots
- Select any date to see tasks scheduled for that day

### Notes
- Create and manage personal notes
- Notes feature a notebook paper design for a fun experience
- Full CRUD functionality (create, read, update, delete)

## License

This project is licensed under the MIT License.

## Acknowledgements

- [Expo](https://expo.dev)
- [React Native](https://reactnative.dev)
- [Firebase](https://firebase.google.com)
- [React Native Paper](https://reactnativepaper.com)
- [React Native Calendars](https://github.com/wix/react-native-calendars)

thx.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// More robust check for React Native environment
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

// Import AsyncStorage directly for React Native, conditionally for web
let AsyncStorage;
try {
  if (isReactNative) {
    // In React Native
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  } else if (typeof window !== 'undefined') {
    // In browser, but not SSR
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  }
} catch (error) {
  console.warn('AsyncStorage could not be loaded', error);
  // Create a mock AsyncStorage implementation for SSR environments
  AsyncStorage = {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
  };
}

// Only Russian translations
const ruTranslations = {
  common: {
    loading: 'Загрузка...',
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Редактировать',
    optional: 'необязательно',
    error: 'Ошибка',
    success: 'Успешно',
    permissionRequired: 'Требуется разрешение',
    loggingOut: 'Выход...',
    ok: 'OK',
    add: 'Добавить',
    addPhoto: 'Добавить фото',
  },
  auth: {
    login: 'Войти',
    logout: 'Выйти',
    email: 'Электронная почта',
    password: 'Пароль',
    confirmPassword: 'Подтвердите пароль',
    register: 'Регистрация',
    welcomeMessage: 'Добро пожаловать в Taskify',
    appSlogan: 'Управляйте задачами с легкостью',
    noAccount: 'Нет аккаунта?',
    haveAccount: 'Уже есть аккаунт?',
    signUp: 'Зарегистрироваться',
    signIn: 'Войти',
    loginFailed: 'Ошибка входа',
    registerFailed: 'Ошибка регистрации',
    fillAllFields: 'Пожалуйста, заполните все поля',
    passwordsDoNotMatch: 'Пароли не совпадают',
    accountCreatedOn: 'Аккаунт создан:',
    lastSignIn: 'Последний вход:',
    incorrectCredentials: 'Неверный email или пароль',
    invalidEmail: 'Пользователь уже зарегистрирован',
    tooManyAttempts: 'Слишком много попыток. Попробуйте позже',
    networkError: 'Ошибка сети. Проверьте подключение',
    invalidCredentials: 'Пользователь уже зарегистрирован',
    error: 'Ошибка',
    guestLoginFailed: 'Не удалось войти как гость. Пожалуйста, попробуйте ещё раз.',
    continueAsGuest: 'Продолжить как гость',
  },
  profile: {
    title: 'Профиль',
    userProfile: 'Профиль пользователя',
    email: 'Электронная почта:',
    preferences: 'Настройки',
    darkMode: 'Темная тема',
    pushNotifications: 'Push-уведомления',
    permissionRequired: 'Требуется разрешение',
    notificationPermission: 'Пожалуйста, включите уведомления в настройках устройства для получения напоминаний о задачах.',
    language: 'Язык',
    about: 'О приложении',
    version: 'Версия',
    logOut: 'Выйти',
    settingsAndSupport: 'Настройки и поддержка',
    account: 'Аккаунт',
    createAccount: 'Создать аккаунт',
    guestMode: 'Гостевой режим - данные будут потеряны при выходе',
    grantPhotoPermission: 'Разрешите доступ к галерее, чтобы выбрать фото профиля',
    uploadFailed: 'Не удалось загрузить фото. Попробуйте ещё раз.',
    photoUpdated: 'Фото профиля обновлено',
    guestUser: 'Гостевой пользователь',
    anonymous: 'Аноним',
    editProfile: 'Редактировать профиль',
    appSettings: 'Настройки приложения',
    notifications: 'Уведомления',
    changePassword: 'Изменить пароль',
    changeName: 'Изменить имя',
    dataPrivacy: 'Конфиденциальность данных',
    logout: 'Выйти',
    logoutConfirmation: 'Вы хотите выйти?',
    logoutDescription: 'Вы действительно хотите выйти из своего аккаунта?',
    name: 'Имя',
    newPassword: 'Новый пароль',
    privacyDescription: 'Мы храним ваши данные на защищенных серверах и не предоставляем их третьим сторонам. Мы используем информацию только для обеспечения работы приложения и улучшения пользовательского опыта.',
    confirmLogout: 'Вы действительно хотите выйти?',
    deleteAccount: 'Удалить аккаунт',
    deleteAccountTitle: 'Удаление аккаунта',
    deleteAccountWarning: 'Внимание: удаление аккаунта приведет к безвозвратной потере всех ваших данных и настроек.',
    deleteAccountConfirmation: 'Вы собираетесь удалить свой аккаунт. Это действие необратимо и приведет к удалению всех ваших данных. Для подтверждения введите "DELETE".',
    deleteAccountPrompt: 'Введите DELETE для подтверждения',
    deleteAccountError: 'Ошибка при удалении аккаунта. Пожалуйста, попробуйте позже.',
    dangerZone: 'Опасная зона'
  },
  home: {
    title: 'Главная',
    welcomeMessage: 'Добро пожаловать в Taskify',
  },
  habits: {
    title: 'Привычки',
    noHabits: 'Привычки не найдены',
    addFirst: 'Добавить первую привычку',
    streak: 'день подряд',
    markComplete: 'Отметить',
    completed: 'Выполнено',
    deleteHabit: 'Удалить привычку',
    confirmDelete: 'Вы уверены, что хотите удалить эту привычку?',
    confirmDeleteMessage: 'Эта привычка и все данные о ней будут удалены без возможности восстановления.',
    addHabit: 'Добавить привычку',
    habitName: 'Название привычки',
    cancel: 'Отмена',
    create: 'Создать',
    newHabit: 'Новая привычка',
    addNewHabit: 'Добавить новую привычку',
    dailyHabits: 'Ежедневные привычки',
    habitTitle: 'Название привычки',
    habitDescription: 'Описание привычки',
    habitFrequency: 'Частота',
    habitDuration: 'Длительность',
    habitStartDate: 'Дата начала',
    habitEndDate: 'Дата окончания',
    addNew: 'Добавить новую привычку',
    
  },
  tasks: {
    title: 'Задачи',
    addTask: 'Добавить задачу',
    editTask: 'Редактировать задачу',
    taskTitle: 'Название',
    taskDescription: 'Описание',
    dueDate: 'Срок выполнения',
    dueTime: 'Время напоминания',
    priority: 'Приоритет',
    status: 'Статус',
    completed: 'Выполнено',
    incomplete: 'Не выполнено',
    high: 'Высокий',
    medium: 'Средний',
    low: 'Низкий',
    noTasks: 'Задачи не найдены',
    noTasksFor: 'Нет задач на {{date}}',
    tasksFor: 'Задачи на {{date}}',
    addNew: 'Добавить новую задачу',
    enterTitle: 'Введите название',
    enterDescription: 'Введите описание',
    selectDate: 'Выберите срок выполнения',
    selectPriority: 'Выберите приоритет',
    taskCreated: 'Задача успешно создана',
    taskUpdated: 'Задача успешно обновлена',
    taskDeleted: 'Задача успешно удалена',
    confirmDelete: 'Вы уверены, что хотите удалить эту задачу?',
    yes: 'Да',
    no: 'Нет',
    today: 'Сегодня',
    tomorrow: 'Завтра',
    pastDue: 'Просрочено',
    thisWeek: 'Эта неделя',
    upcoming: 'Предстоящие',
    todaysTasks: 'Задачи на сегодня',
    all: 'Все',
    active: 'Активные',
    completedTasks: 'Выполненные',
    due: 'Срок:',
    taskList: 'Список задач',
    category: 'Категория',
    categories: 'Категории',
    selectCategory: 'Выберите категорию',
    addCategory: 'Добавить категорию',
    noCategory: 'Без категории',
    work: 'Работа',
    personal: 'Личное',
    shopping: 'Покупки',
    health: 'Здоровье',
    education: 'Образование',
    finance: 'Финансы',
    other: 'Другое',
    search: 'Поиск',
    searchPlaceholder: 'Поиск задач...',
    themeToggle: 'Переключить тему',
    noUpcomingTasks: 'Нет предстоящих задач',
  },
  notes: {
    title: 'Мои заметки',
    newNote: 'Новая заметка',
    editNote: 'Редактировать заметку',
    titlePlaceholder: 'Заголовок',
    contentPlaceholder: 'Начните писать...',
    addPhoto: 'Добавить фото',
    photoAdded: 'Фото добавлено',
    deleteConfirm: 'Удалить эту заметку?',
    noNotes: 'Заметок пока нет. Создайте их!',
    addNew: 'Добавить новую заметку',
  },
  calendar: {
    title: 'Календарь',
    month: 'Месяц',
    week: 'Неделя',
    day: 'День',
    today: 'Сегодня',
    tomorrow: 'Завтра',
    sun: 'Вс',
    mon: 'Пн',
    tue: 'Вт',
    wed: 'Ср',
    thu: 'Чт',
    fri: 'Пт',
    sat: 'Сб',
    sunday: 'Воскресенье',
    monday: 'Понедельник',
    tuesday: 'Вторник',
    wednesday: 'Среда',
    thursday: 'Четверг',
    friday: 'Пятница',
    saturday: 'Суббота',
    noTasksForDate: 'Нет задач на эту дату',
    addTask: 'Добавить задачу',
  },
  errors: {
    genericError: 'Произошла ошибка',
    tryAgain: 'Пожалуйста, попробуйте снова',
  }
};

// Only Russian resources
const resources = {
  ru: {
    translation: ruTranslations
  }
};

// Initialize i18next with Russian only
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ru',
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

// Russian-only implementation
export const changeLanguage = () => {
  i18n.changeLanguage('ru');
  
  if (AsyncStorage) {
    return AsyncStorage.setItem('userLanguage', 'ru')
      .catch(error => {
        console.error('Error saving language preference:', error);
      });
  }
  
  return Promise.resolve();
};

// Ensure Russian language is set
export const ensureRussianLanguage = async () => {
  if (!AsyncStorage) {
    return Promise.resolve();
  }
  
  try {
    i18n.changeLanguage('ru');
    await AsyncStorage.setItem('userLanguage', 'ru');
  } catch (error) {
    console.error('Error setting Russian language:', error);
  }
};

// Initialize Russian language
if ((typeof window !== 'undefined' || isReactNative) && AsyncStorage) {
  i18n.changeLanguage('ru');
  ensureRussianLanguage().catch(err => {
    console.error('Failed to ensure Russian language:', err);
  });
}

export default i18n; 
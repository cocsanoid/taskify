import React, { useState, useEffect, useRef } from 'react';
import { View, Platform, StyleSheet, useColorScheme, TouchableOpacity } from 'react-native';
import { Button, Portal, Modal, Text, useTheme, IconButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function PlatformDatePicker({
  value,
  onChange,
  minimumDate,
  label,
  containerStyle,
  buttonStyle,
}) {
  const [showNativePicker, setShowNativePicker] = useState(false);
  const [showWebPicker, setShowWebPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value || new Date());
  const [darkMode, setDarkMode] = useState(false);
  const systemColorScheme = useColorScheme();
  const theme = useTheme();
  const calendarContainerRef = useRef(null);

  // Load dark mode preference
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
        console.log('Failed to load theme preference:', error);
        setDarkMode(systemColorScheme === 'dark');
      }
    };

    loadThemePreference();
  }, [systemColorScheme]);

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'Выберите дату';

    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) {
        return 'Некорректная дата';
      }
      return format(dateObj, 'd MMMM yyyy', { locale: ru });
    } catch (error) {
      console.log('Error formatting date:', error);
      return 'Некорректная дата';
    }
  };

  // For native platforms
  const handleNativeChange = (event, selectedDate) => {
    setShowNativePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
      onChange(selectedDate); // Pass only the date, not the event
    }
  };

  const handleWebDateSelect = (newDate) => {
    const normalizedDate = new Date(
      Date.UTC(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), 12, 0, 0, 0)
    );
    setSelectedDate(normalizedDate);
  };

  const handleWebConfirm = () => {
    const normalizedDate = new Date(
      Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 12, 0, 0, 0)
    );
    onChange(normalizedDate);
    setShowWebPicker(false);
  };

  const handleClearDate = () => {
    onChange(null);
    setSelectedDate(new Date());
    setShowWebPicker(false);
  };

  // Generate calendar grid
  const renderCalendarGrid = () => {
    const today = new Date();
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

    const calendarDays = [];
    let dayCount = 1;

    for (let week = 0; week < 6; week++) {
      const weekDays = [];

      for (let day = 0; day < 7; day++) {
        if ((week === 0 && day < startingDayOfWeek) || dayCount > daysInMonth) {
          weekDays.push(<View key={`empty-${week}-${day}`} style={styles.calendarDay} />);
        } else {
          const date = new Date(currentYear, currentMonth, dayCount);
          const isToday =
            today.getDate() === dayCount &&
            today.getMonth() === currentMonth &&
            today.getFullYear() === currentYear;
          const isSelected =
            selectedDate.getDate() === dayCount &&
            selectedDate.getMonth() === currentMonth &&
            selectedDate.getFullYear() === currentYear;
          const isPastMinimum = !minimumDate || date >= minimumDate;

          weekDays.push(
            <Button
              key={`day-${dayCount}`}
              mode={isSelected ? 'contained' : 'text'}
              compact
              disabled={!isPastMinimum}
              onPress={() => handleWebDateSelect(date)}
              style={[
                styles.calendarDay,
                isToday && styles.today,
                isSelected && styles.selected,
                !isPastMinimum && styles.disabledDay,
                darkMode && { backgroundColor: isSelected ? theme.colors.primary : 'transparent' },
              ]}
              labelStyle={[
                styles.calendarDayText,
                isSelected && { color: '#fff' },
                !isSelected && darkMode && { color: '#fff' },
                !isPastMinimum && styles.disabledDayText,
              ]}
            >
              {dayCount.toString()}
            </Button>
          );
          dayCount++;
        }
      }

      calendarDays.push(
        <View key={`week-${week}`} style={styles.calendarWeek}>
          {weekDays}
        </View>
      );
    }

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            onPress={() => {
              const prevMonth = new Date(selectedDate);
              prevMonth.setMonth(prevMonth.getMonth() - 1);
              setSelectedDate(prevMonth);
            }}
            style={styles.monthNavButton}
          >
            <IconButton icon="chevron-left" size={24} color={darkMode ? '#fff' : theme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.monthYearText, { color: darkMode ? '#fff' : theme.colors.onSurface }]}>
            {format(selectedDate, 'LLLL yyyy', { locale: ru })}
          </Text>
          <TouchableOpacity
            onPress={() => {
              const nextMonth = new Date(selectedDate);
              nextMonth.setMonth(nextMonth.getMonth() + 1);
              setSelectedDate(nextMonth);
            }}
            style={styles.monthNavButton}
          >
            <IconButton icon="chevron-right" size={24} color={darkMode ? '#fff' : theme.colors.onSurface} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekdayHeader}>
          {daysOfWeek.map((day) => (
            <Text
              key={day}
              style={[styles.weekdayText, { color: darkMode ? '#aaa' : theme.colors.onSurfaceVariant }]}
            >
              {day}
            </Text>
          ))}
        </View>

        {calendarDays}
      </View>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: theme.colors.onSurface }]}>{label}</Text>}

      <Button
        mode="outlined"
        onPress={() => {
          if (Platform.OS === 'web') {
            setShowWebPicker(true);
          } else {
            setShowNativePicker(true);
          }
        }}
        icon="calendar"
        style={[styles.dateButton, buttonStyle]}
      >
        {formatDate(value)}
      </Button>

      {Platform.OS !== 'web' && showNativePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleNativeChange}
          minimumDate={minimumDate}
        />
      )}

      {Platform.OS === 'web' && (
        <Portal>
          <Modal
            visible={showWebPicker}
            onDismiss={() => setShowWebPicker(false)}
            contentContainerStyle={[
              styles.modalContainer,
              { backgroundColor: darkMode ? '#121212' : '#fff' },
            ]}
            style={[styles.modalWrapper, { zIndex: 3000 }]}
          >
            {renderCalendarGrid()}

            <View style={styles.modalButtons}>
              <Button mode="text" onPress={handleClearDate} style={styles.modalButton}>
                Очистить
              </Button>
              <Button mode="contained" onPress={handleWebConfirm} style={styles.modalButton}>
                Подтвердить
              </Button>
            </View>
          </Modal>
        </Portal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  dateButton: {
    alignSelf: 'flex-start',
  },
  modalWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3000,
    elevation: 20,
  },
  modalContainer: {
    padding: 20,
    borderRadius: 8,
    minWidth: 320,
    maxWidth: '90%',
    elevation: 24,
    zIndex: 2000,
  },
  calendarContainer: {
    width: '100%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  monthNavButton: {
    padding: 5,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  weekdayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  calendarWeek: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  calendarDayText: {
    textAlign: 'center',
    fontSize: 14,
  },
  today: {
    borderWidth: 1,
    borderColor: '#6a0dad',
  },
  selected: {
    backgroundColor: '#6a0dad',
  },
  disabledDay: {
    opacity: 0.3,
  },
  disabledDayText: {
    color: '#aaa',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: {
    marginLeft: 8,
  },
});
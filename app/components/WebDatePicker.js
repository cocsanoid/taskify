import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableWithoutFeedback, 
  ScrollView
} from 'react-native';
import { 
  Text, 
  Button, 
  IconButton, 
  Surface,
  useTheme
} from 'react-native-paper';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

const WebDatePicker = ({ value, onChange, style, minDate = new Date() }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(value || null);
  const [currentViewDate, setCurrentViewDate] = useState(value || new Date());
  const [showPicker, setShowPicker] = useState(false);
  const calendarRef = useRef(null);
  
  // Normalize minDate to midnight
  const normalizedMinDate = React.useMemo(() => {
    const date = new Date(minDate);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [minDate]);

  // Create a current month calendar view
  const renderCalendar = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to midnight
    
    const currentMonth = currentViewDate.getMonth();
    const currentYear = currentViewDate.getFullYear();

    // Get days in current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    // Create days array
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    // Create week rows with empty cells for the first week
    const weeks = [];
    let week = Array(7).fill(null);
    
    // Fill in the first week with empty slots before the first day
    for (let i = 0; i < days.length; i++) {
      const dayIndex = (firstDayOfMonth + i) % 7;
      const dayNumber = i + 1;
      
      if (week[dayIndex] === null) {
        week[dayIndex] = dayNumber;
      }
      
      if (dayIndex === 6 || dayNumber === days.length) {
        weeks.push([...week]);
        week = Array(7).fill(null);
      }
    }
    
    return (
      <View style={[styles.calendar, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.calendarHeader}>
          <IconButton 
            icon="chevron-left" 
            size={20} 
            iconColor={theme.colors.primary}
            onPress={() => {
              const newDate = new Date(currentViewDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setCurrentViewDate(newDate);
            }}
          />
          <Text style={[styles.calendarMonth, { color: theme.colors.primary }]}>
            {format(currentViewDate, 'LLLL yyyy', { locale: ru })}
          </Text>
          <IconButton 
            icon="chevron-right" 
            size={20} 
            iconColor={theme.colors.primary}
            onPress={() => {
              const newDate = new Date(currentViewDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setCurrentViewDate(newDate);
            }}
          />
        </View>
        
        <View style={styles.calendarDays}>
          {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map((day, index) => (
            <Text key={index} style={[styles.calendarDayName, { color: theme.colors.onSurfaceVariant }]}>
              {day}
            </Text>
          ))}
        </View>
        
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.calendarWeek}>
            {week.map((day, dayIndex) => {
              if (day === null) {
                return <View key={dayIndex} style={styles.calendarEmptyDay} />;
              }
              
              // Create date at midnight for proper comparison
              const date = new Date(currentYear, currentMonth, day);
              date.setHours(0, 0, 0, 0);
              
              const isToday = today.getDate() === day && 
                              today.getMonth() === currentMonth && 
                              today.getFullYear() === currentYear;
                              
              // Check if this date is the selected date by comparing year, month, and day
              const isSelected = selectedDate && 
                                selectedDate.getDate() === day && 
                                selectedDate.getMonth() === currentMonth && 
                                selectedDate.getFullYear() === currentYear;
              
              // Compare only the date parts
              const isPastMinimum = date.getTime() >= normalizedMinDate.getTime();
              
              return (
                <TouchableWithoutFeedback 
                  key={dayIndex} 
                  onPress={() => {
                    if (isPastMinimum) {
                      const newDate = new Date(currentYear, currentMonth, day);
                      newDate.setHours(0, 0, 0, 0); // Normalize to midnight
                      setSelectedDate(newDate);
                      onChange(newDate);
                    }
                  }}
                >
                  <View style={[
                    styles.calendarDay,
                    isToday && styles.calendarToday,
                    isSelected && [styles.calendarSelected, { backgroundColor: theme.colors.primary }],
                    !isPastMinimum && styles.calendarDisabled
                  ]}>
                    <Text style={[
                      styles.calendarDayText,
                      { color: theme.colors.onSurface },
                      isSelected && { color: theme.colors.onPrimary },
                      !isPastMinimum && { color: theme.colors.onSurfaceDisabled }
                    ]}>
                      {day}
                    </Text>
                  </View>
                </TouchableWithoutFeedback>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  // Update currentViewDate when value changes
  useEffect(() => {
    if (value) {
      setCurrentViewDate(new Date(value));
      setSelectedDate(new Date(value));
    }
  }, [value]);

  return (
    <View style={style}>
      <TouchableWithoutFeedback onPress={() => setShowPicker(!showPicker)}>
        <View style={[
          styles.datePickerButton, 
          { 
            borderColor: theme.colors.outline,
            backgroundColor: theme.colors.surfaceVariant
          }
        ]}>
          <Text style={{ color: theme.colors.onSurface, flex: 1 }}>
            {value ? format(value, 'dd MMMM yyyy', { locale: ru }) : t('tasks.selectDate')}
          </Text>
          <IconButton 
            icon={showPicker ? "calendar-collapse" : "calendar"} 
            size={20} 
            iconColor={theme.colors.primary} 
          />
        </View>
      </TouchableWithoutFeedback>
      
      {showPicker && (
        <Surface
          style={[
            styles.inlineDatePicker,
            { backgroundColor: theme.colors.surface, marginTop: 4 }
          ]}
          elevation={2}
        >
          {renderCalendar()}
          <View style={styles.datePickerActions}>
            <Button 
              onPress={() => {
                if (selectedDate) {
                  onChange(selectedDate);
                }
                setShowPicker(false);
              }}
              mode="contained"
            >
              Выбрать
            </Button>
            <Button 
              onPress={() => setShowPicker(false)}
              mode="outlined"
            >
              {t('common.cancel')}
            </Button>
          </View>
        </Surface>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  inlineDatePicker: {
    padding: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    marginTop: 4,
    width: '100%',
  },
  calendar: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  calendarHeader: {
    padding: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  calendarDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  calendarDayName: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
  },
  calendarWeek: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  calendarDay: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  calendarEmptyDay: {
    width: 36,
    height: 36,
  },
  calendarToday: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  calendarSelected: {
    backgroundColor: '#6200ee',
  },
  calendarDisabled: {
    opacity: 0.3,
  },
  calendarDayText: {
    textAlign: 'center',
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    marginBottom: 4,
    gap: 8,
  },
});

export default WebDatePicker; 
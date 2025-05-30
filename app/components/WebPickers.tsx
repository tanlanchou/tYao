import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Modal, Text, TextInput } from 'react-native-paper';

interface WebTimePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (time: Date) => void;
  initialTime: Date;
}

interface WebDatePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  initialDate: Date;
}

export const WebTimePicker = ({ visible, onClose, onConfirm, initialTime }: WebTimePickerProps) => {
  const [hours, setHours] = useState(initialTime.getHours().toString());
  const [minutes, setMinutes] = useState(initialTime.getMinutes().toString());

  const handleConfirm = () => {
    const hoursNum = parseInt(hours, 10);
    const minutesNum = parseInt(minutes, 10);
    
    if (!isNaN(hoursNum) && hoursNum >= 0 && hoursNum <= 23 &&
        !isNaN(minutesNum) && minutesNum >= 0 && minutesNum <= 59) {
      const newTime = new Date(initialTime);
      newTime.setHours(hoursNum);
      newTime.setMinutes(minutesNum);
      onConfirm(newTime);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      onDismiss={onClose}
      contentContainerStyle={styles.modalContainer}
    >
      <Text style={styles.modalTitle}>选择时间</Text>
      <View style={styles.webTimePickerContainer}>
        <View style={styles.timeInputContainer}>
          <TextInput
            label="时"
            value={hours}
            onChangeText={setHours}
            keyboardType="numeric"
            maxLength={2}
            style={styles.timeInput}
            mode="outlined"
          />
          <Text style={styles.timeSeparator}>:</Text>
          <TextInput
            label="分"
            value={minutes}
            onChangeText={setMinutes}
            keyboardType="numeric"
            maxLength={2}
            style={styles.timeInput}
            mode="outlined"
          />
        </View>
        <View style={styles.modalContent}>
          <Button 
            mode="contained" 
            onPress={handleConfirm} 
            style={styles.modalButton}
            disabled={!hours || !minutes || 
              parseInt(hours, 10) < 0 || parseInt(hours, 10) > 23 ||
              parseInt(minutes, 10) < 0 || parseInt(minutes, 10) > 59}
          >
            确定
          </Button>
          <Button mode="outlined" onPress={onClose} style={styles.modalButton}>
            取消
          </Button>
        </View>
      </View>
    </Modal>
  );
};

export const WebDatePicker = ({ visible, onClose, onConfirm, initialDate }: WebDatePickerProps) => {
  const [year, setYear] = useState(initialDate.getFullYear().toString());
  const [month, setMonth] = useState((initialDate.getMonth() + 1).toString());
  const [day, setDay] = useState(initialDate.getDate().toString());

  const handleConfirm = () => {
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);
    
    if (validateDate(yearNum, monthNum, dayNum)) {
      const newDate = new Date(initialDate);
      newDate.setFullYear(yearNum);
      newDate.setMonth(monthNum - 1);
      newDate.setDate(dayNum);
      onConfirm(newDate);
    }
  };

  const validateDate = (y: number, m: number, d: number) => {
    if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
    if (y < 2000 || y > 2100) return false;
    if (m < 1 || m > 12) return false;
    if (d < 1 || d > 31) return false;
    
    const date = new Date(y, m - 1, d);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      onDismiss={onClose}
      contentContainerStyle={styles.modalContainer}
    >
      <Text style={styles.modalTitle}>选择日期</Text>
      <View style={styles.webDatePickerContainer}>
        <View style={styles.dateInputContainer}>
          <TextInput
            label="年"
            value={year}
            onChangeText={setYear}
            keyboardType="numeric"
            maxLength={4}
            style={styles.dateInput}
            mode="outlined"
          />
          <Text style={styles.dateSeparator}>/</Text>
          <TextInput
            label="月"
            value={month}
            onChangeText={setMonth}
            keyboardType="numeric"
            maxLength={2}
            style={styles.dateInput}
            mode="outlined"
          />
          <Text style={styles.dateSeparator}>/</Text>
          <TextInput
            label="日"
            value={day}
            onChangeText={setDay}
            keyboardType="numeric"
            maxLength={2}
            style={styles.dateInput}
            mode="outlined"
          />
        </View>
        <View style={styles.modalContent}>
          <Button 
            mode="contained" 
            onPress={handleConfirm} 
            style={styles.modalButton}
            disabled={!validateDate(parseInt(year, 10), parseInt(month, 10), parseInt(day, 10))}
          >
            确定
          </Button>
          <Button mode="outlined" onPress={onClose} style={styles.modalButton}>
            取消
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    padding: 24,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#1976d2',
  },
  modalContent: {
    gap: 12,
  },
  modalButton: {
    marginVertical: 6,
    borderRadius: 8,
    paddingVertical: 8,
  },
  webTimePickerContainer: {
    padding: 16,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  timeInput: {
    width: 80,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 24,
    marginHorizontal: 8,
  },
  webDatePickerContainer: {
    padding: 16,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dateInput: {
    width: 80,
    textAlign: 'center',
  },
  dateSeparator: {
    fontSize: 24,
    marginHorizontal: 8,
  },
}); 
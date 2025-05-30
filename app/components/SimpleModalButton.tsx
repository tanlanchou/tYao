import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Button, IconButton, Modal, Portal, Text } from 'react-native-paper';

interface SimpleModalButtonProps {
  label?: string;
  buttonStyle?: any;
}

type ModalMode = 'main' | 'repeat' | 'daily';

const SimpleModalButton: React.FC<SimpleModalButtonProps> = ({ label = '提醒日期', buttonStyle }) => {
  const [visible, setVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [mode, setMode] = useState<ModalMode>('main');
  const [dailyTimes, setDailyTimes] = useState<Date[]>([]);

  const handleSingleReminder = () => {
    setSelectedDate(null);
    setDailyTimes([]);
    setPickerVisible(true);
  };

  const handleDateConfirm = (date: Date) => {
    setSelectedDate(date);
    setPickerVisible(false);
    setVisible(false);
    setMode('main');
  };

  const handleOpen = () => {
    setVisible(true);
    setMode('main');
  };

  const handleClose = () => {
    setVisible(false);
    setMode('main');
  };

  const handleAddTime = () => {
    setPickerVisible(true);
  };

  const handleDailyTimeConfirm = (date: Date) => {
    if (dailyTimes.length < 4) {
      setDailyTimes([...dailyTimes, date]);
    }
    setPickerVisible(false);
  };

  const handleRemoveTime = (index: number) => {
    setDailyTimes(dailyTimes.filter((_, i) => i !== index));
  };

  const handleDailyConfirm = () => {
    setVisible(false);
    setMode('main');
  };

  const handleBack = () => {
    setMode("repeat");
    // Alert.alert(
    //   '确认返回',
    //   '未保存的数据将丢失，是否确认返回？',
    //   [
    //     { text: '取消', style: 'cancel' },
    //     { text: '确认', onPress: () => setMode('repeat') },
    //   ]
    // );
  };

  return (
    <View style={styles.container}>
      <Button
        mode="outlined"
        onPress={handleOpen}
        style={buttonStyle}
      >
        {label}
      </Button>
      {selectedDate && (
        <Text style={styles.selectedDateText}>
          单次提醒：{selectedDate.getFullYear()}-{(selectedDate.getMonth()+1).toString().padStart(2,'0')}-{selectedDate.getDate().toString().padStart(2,'0')} {selectedDate.getHours().toString().padStart(2,'0')}:{selectedDate.getMinutes().toString().padStart(2,'0')}
        </Text>
      )}
      {dailyTimes.length > 0 && (
        <Text style={styles.selectedDateText}>
          每天重复：{dailyTimes.map(date => `${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`).join(', ')}
        </Text>
      )}
      <Portal>
        <Modal
          visible={visible}
          onDismiss={handleClose}
          contentContainerStyle={styles.modalContainer}
        >
          {mode === 'main' && (
            <>
              <Text style={styles.modalTitle}>请选择提醒类型</Text>
              <Button
                mode="contained"
                style={styles.modalButton}
                onPress={handleSingleReminder}
              >
                单次提醒
              </Button>
              <Button
                mode="outlined"
                style={styles.modalButton}
                onPress={() => setMode('repeat')}
              >
                重复提醒
              </Button>
            </>
          )}
          {mode === 'repeat' && (
            <>
              <Text style={styles.modalTitle}>请选择重复方式</Text>
              <Button mode="contained" style={styles.modalButton} onPress={() => setMode('daily')}>
                每天重复
              </Button>
              <Button mode="contained" style={styles.modalButton} onPress={() => {}}>
                每周重复
              </Button>
              <Button mode="contained" style={styles.modalButton} onPress={() => {}}>
                每月重复
              </Button>
              <Button mode="contained" style={styles.modalButton} onPress={() => {}}>
                自定义重复
              </Button>
              <Button mode="outlined" style={styles.modalButton} onPress={() => setMode('main')}>
                返回
              </Button>
            </>
          )}
          {mode === 'daily' && (
            <>
              <Text style={styles.modalTitle}>每天重复提醒</Text>
              {dailyTimes.map((date, index) => (
                <View key={index} style={styles.timeItem}>
                  <Text>{date.getHours().toString().padStart(2,'0')}:{date.getMinutes().toString().padStart(2,'0')}</Text>
                  <IconButton icon="delete" onPress={() => handleRemoveTime(index)} />
                </View>
              ))}
              {dailyTimes.length < 4 && (
                <Button mode="contained" style={styles.modalButton} onPress={handleAddTime}>
                  添加时间
                </Button>
              )}
              <Button mode="contained" style={styles.modalButton} onPress={handleDailyConfirm}>
                确定
              </Button>
              <Button mode="outlined" style={styles.modalButton} onPress={handleBack}>
                返回
              </Button>
            </>
          )}
        </Modal>
        <DateTimePickerModal
          isVisible={pickerVisible}
          mode={mode === 'daily' ? 'time' : 'datetime'}
          onConfirm={mode === 'daily' ? handleDailyTimeConfirm : handleDateConfirm}
          onCancel={() => setPickerVisible(false)}
        />
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    margin: 0,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalButton: {
    marginVertical: 8,
    width: '100%',
  },
  selectedDateText: {
    marginTop: 8,
    color: '#1976d2',
    fontSize: 16,
    fontWeight: '500',
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default SimpleModalButton; 
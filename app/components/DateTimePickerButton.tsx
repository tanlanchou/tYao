import React, { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Button, Modal, Portal, Text } from 'react-native-paper';

interface DateTimePickerButtonProps {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
  buttonStyle?: any;
}

const DateTimePickerButton: React.FC<DateTimePickerButtonProps> = ({ value, onChange, label = '提醒日期', buttonStyle }) => {
  const [visible, setVisible] = useState(false);
  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.container}>
      <Button
        mode="outlined"
        onPress={() => setVisible(true)}
        style={buttonStyle}
      >
        {label}: {value.toLocaleString()}
      </Button>
      {/* 移动端用 react-native-modal-datetime-picker */}
      {!isWeb && (
        <DateTimePickerModal
          isVisible={visible}
          mode="datetime"
          onConfirm={date => {
            setVisible(false);
            onChange(date);
          }}
          onCancel={() => setVisible(false)}
          date={value}
        />
      )}
      {/* Web 用自定义 Modal + input */}
      {isWeb && (
        <Portal>
          <Modal
            visible={visible}
            onDismiss={() => setVisible(false)}
            contentContainerStyle={styles.webModalContainer}
          >
            <Text style={{ marginBottom: 8 }}>{label}</Text>
            <input
              type="datetime-local"
              value={value.toISOString().slice(0, 16)}
              onChange={e => {
                const v = e.target.value;
                onChange(new Date(v));
              }}
              style={{
                padding: 10,
                borderRadius: 4,
                border: '1px solid #ccc',
                fontSize: 16,
                marginBottom: 16,
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <Button mode="outlined" onPress={() => setVisible(false)} style={{ marginRight: 8 }}>取消</Button>
              <Button mode="contained" onPress={() => setVisible(false)}>确认</Button>
            </View>
          </Modal>
        </Portal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  webModalContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    minWidth: 320,
    maxWidth: 400,
    alignSelf: 'center',
  },
});

export default DateTimePickerButton; 
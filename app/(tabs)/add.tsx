import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, IconButton, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import MedicineForm, { MedicineData } from '../components/MedicineForm';

export default function AddScreen() {
  const [alarmName, setAlarmName] = useState('');
  const [medicines, setMedicines] = useState<MedicineData[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'error' | 'warning' | 'success' | 'info'>('info');

  const theme = useTheme();

  useEffect(() => {
    if (snackbarVisible) {
      const timer = setTimeout(() => setSnackbarVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [snackbarVisible]);

  // 统一弹出提示
  const showSnackbar = (message: string, type: 'error' | 'warning' | 'success' | 'info' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const handleAddMedicine = (data: MedicineData) => {
    if (editingIndex !== null) {
      const newMedicines = [...medicines];
      newMedicines[editingIndex] = data;
      setMedicines(newMedicines);
      setEditingIndex(null);
      showSnackbar('编辑成功', 'success');
    } else {
      setMedicines([...medicines, data]);
      showSnackbar('添加成功', 'success');
    }
    setIsAdding(false);
  };

  const handleEditMedicine = (index: number) => {
    if (isAdding) {
      showSnackbar('请先保存或取消当前操作', 'warning');
      return;
    }
    setEditingIndex(index);
    setIsAdding(true);
  };

  const handleRequestDeleteMedicine = (index: number) => {
    if (isAdding) {
      showSnackbar('请先保存或取消当前操作', 'warning');
      return;
    }
    setDeleteIndex(index);
  };

  const handleConfirmDeleteMedicine = () => {
    if (deleteIndex !== null) {
      setMedicines(medicines.filter((_, i) => i !== deleteIndex));
      setDeleteIndex(null);
      showSnackbar('删除成功', 'success');
    }
  };

  const handleCancelDeleteMedicine = () => {
    setDeleteIndex(null);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingIndex(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <TextInput
          label="闹钟名称"
          value={alarmName}
          onChangeText={setAlarmName}
          style={styles.input}
          maxLength={20}
        />

        <View style={styles.medicineList}>
          <Text variant="titleLarge" style={styles.sectionTitle}>药品列表</Text>
          {medicines.length === 0 ? (
            <View style={styles.emptyList}>
              <Text style={styles.emptyText}>暂无记录</Text>
            </View>
          ) : (
            medicines.map((medicine, index) => (
              <View key={index} style={styles.medicineCard}>
                <View style={styles.medicineHeader}>
                  <Text variant="titleMedium" style={styles.medicineName}>{medicine.name}</Text>
                  <View style={styles.iconButtonGroup}>
                    <IconButton
                      icon="pencil"
                      size={22}
                      style={styles.iconButton}
                      containerColor={theme.colors.primary}
                      iconColor="#fff"
                      onPress={() => {
                        if (isAdding) {
                          showSnackbar('请先保存或取消当前操作', 'warning');
                        } else {
                          handleEditMedicine(index);
                        }
                      }}
                    />
                    <IconButton
                      icon="delete"
                      size={22}
                      style={styles.iconButton}
                      containerColor={theme.colors.error}
                      iconColor="#fff"
                      onPress={() => {
                        if (isAdding) {
                          showSnackbar('请先保存或取消当前操作', 'warning');
                        } else {
                          handleRequestDeleteMedicine(index);
                        }
                      }}
                    />
                  </View>
                </View>
                {medicine.image && (
                  <Image source={{ uri: medicine.image }} style={styles.medicineImage} />
                )}
                <View style={styles.medicineInfoRow}>
                  {medicine.dosage && (
                    <Chip icon="pill" style={styles.chip} textStyle={styles.chipText}>
                      药量: {medicine.dosage}
                    </Chip>
                  )}
                  <Chip icon="clock-outline" style={styles.chip} textStyle={styles.chipText}>
                    {medicine.reminderDate.toLocaleString()}
                  </Chip>
                </View>
              </View>
            ))
          )}
        </View>

        {isAdding ? (
          <MedicineForm
            onSubmit={handleAddMedicine}
            onCancel={handleCancel}
            initialData={editingIndex !== null ? medicines[editingIndex] : undefined}
            isEdit={editingIndex !== null}
            showSnackbar={showSnackbar}
          />
        ) : (
          <Button 
            mode="contained" 
            icon="plus"
            style={styles.addButton}
            onPress={() => setIsAdding(true)}
          >
            添加药品
          </Button>
        )}
      </ScrollView>
      <Portal>
        <Dialog
          visible={deleteIndex !== null}
          onDismiss={handleCancelDeleteMedicine}
        >
          <Dialog.Title>确认删除</Dialog.Title>
          <Dialog.Content>
            <Text>确定要删除该药品吗？此操作无法撤销。</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCancelDeleteMedicine}>取消</Button>
            <Button onPress={handleConfirmDeleteMedicine} textColor={theme.colors.error}>删除</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      {/* 顶部提示条 */}
      {snackbarVisible && (
        <View style={[
          styles.topNoticeBar,
          snackbarType === 'error' && { backgroundColor: '#d32f2f' },
          snackbarType === 'warning' && { backgroundColor: '#ffa000' },
          snackbarType === 'success' && { backgroundColor: '#388e3c' },
          snackbarType === 'info' && { backgroundColor: '#1976d2' },
        ]}>
          <Text style={styles.topNoticeText}>{snackbarMessage}</Text>
          <Button
            mode="text"
            onPress={() => setSnackbarVisible(false)}
            labelStyle={{ color: '#fff', fontWeight: 'bold' }}
            compact
          >
            确定
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  medicineList: {
    marginBottom: 5,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  emptyList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
  },
  medicineCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 3,
  },
  medicineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  medicineName: {
    fontWeight: 'bold',
    fontSize: 18,
    flex: 1,
    marginRight: 8,
  },
  iconButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    marginHorizontal: 0,
    marginVertical: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicineImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginVertical: 8,
    backgroundColor: '#f0f0f0',
  },
  medicineInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 8,
    backgroundColor: '#e3f2fd',
    marginBottom: 4,
  },
  chipText: {
    color: '#1976d2',
    fontSize: 14,
  },
  addButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  topNoticeBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1976d2',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 4,
  },
  topNoticeText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
}); 
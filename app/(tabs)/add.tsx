import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Button, FAB, Text, TextInput } from 'react-native-paper';
import MedicineForm, { MedicineData } from '../components/MedicineForm';

export default function AddScreen() {
  const [alarmName, setAlarmName] = useState('');
  const [medicines, setMedicines] = useState<MedicineData[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAddMedicine = (data: MedicineData) => {
    if (editingIndex !== null) {
      const newMedicines = [...medicines];
      newMedicines[editingIndex] = data;
      setMedicines(newMedicines);
      setEditingIndex(null);
    } else {
      setMedicines([...medicines, data]);
    }
    setIsAdding(false);
  };

  const handleEditMedicine = (index: number) => {
    setEditingIndex(index);
    setIsAdding(true);
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

        {medicines.map((medicine, index) => (
          <View key={index} style={styles.medicineCard}>
            <Text variant="titleMedium">{medicine.name}</Text>
            {medicine.image && (
              <Image source={{ uri: medicine.image }} style={styles.medicineImage} />
            )}
            {medicine.dosage && (
              <Text>药量: {medicine.dosage}</Text>
            )}
            <Text>提醒时间: {medicine.reminderDate.toLocaleString()}</Text>
            <Button onPress={() => handleEditMedicine(index)}>编辑</Button>
          </View>
        ))}

        {isAdding ? (
          <MedicineForm
            onSubmit={handleAddMedicine}
            onCancel={handleCancel}
            initialData={editingIndex !== null ? medicines[editingIndex] : undefined}
            isEdit={editingIndex !== null}
          />
        ) : (
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={() => setIsAdding(true)}
          />
        )}
      </ScrollView>
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
  medicineCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  medicineImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
}); 
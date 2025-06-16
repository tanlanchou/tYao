import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Modal, Portal } from 'react-native-paper';
import { useNotification } from '../services/NotificationContext';
import MedicineForm, { MedicineData } from './MedicineForm';

interface MedicineFormModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: MedicineData) => void;
  initialData?: MedicineData;
  isEdit?: boolean;
}

export default function MedicineFormModal({
  visible,
  onDismiss,
  onSubmit,
  initialData,
  isEdit = false
}: MedicineFormModalProps) {
  
  const { showNotification } = useNotification();
  
  const handleSubmit = (data: MedicineData) => {
    onSubmit(data);
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          Platform.OS === 'android' && styles.androidModalContainer
        ]}
        style={[
          styles.modal,
          Platform.OS === 'android' && styles.androidModal
        ]}
      >
        <MedicineForm
          onSubmit={handleSubmit}
          onCancel={onDismiss}
          initialData={initialData}
          isEdit={isEdit}
          showNotification={showNotification}
        />
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'center',
  },
  androidModal: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    margin: 0,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 0,
    margin: 20,
    borderRadius: 16,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
    overflow: 'hidden',
  },
  androidModalContainer: {
    margin: 30,
    maxWidth: 400,
    alignSelf: 'center',
  },
}); 
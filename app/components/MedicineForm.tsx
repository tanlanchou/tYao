import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Text, TextInput } from 'react-native-paper';
import SimpleModalButton from './SimpleModalButton';

interface MedicineFormProps {
  onSubmit: (data: MedicineData) => void;
  onCancel: () => void;
  initialData?: MedicineData;
  isEdit?: boolean;
  showSnackbar: (msg: string, type?: 'error' | 'warning' | 'success' | 'info') => void;
}

export interface MedicineData {
  name: string;
  image?: string;
  dosage?: string;
  reminderDate: Date;
}

export default function MedicineForm({ onSubmit, onCancel, initialData, isEdit = false, showSnackbar }: MedicineFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [image, setImage] = useState<string | undefined>(initialData?.image);
  const [dosage, setDosage] = useState(initialData?.dosage || '');
  const [reminderDate, setReminderDate] = useState(initialData?.reminderDate || new Date());
  const [isImagePickerVisible, setImagePickerVisible] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
    setImagePickerVisible(false);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showSnackbar('需要相机权限才能拍照', 'error');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
    setImagePickerVisible(false);
  };

  const handleFileUpload = () => {
    // 在 Web 平台上，我们可以使用 input type="file"
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
    setImagePickerVisible(false);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      showSnackbar('请输入药品名称', 'error');
      return;
    }
    if (!reminderDate) {
      showSnackbar('请选择提醒日期', 'error');
      return;
    }

    onSubmit({
      name,
      image,
      dosage,
      reminderDate,
    });
  };

  return (
    <View style={styles.container}>
      {isEdit && (
        <Text style={styles.editTitle}>正在编辑：{name}</Text>
      )}
      <TextInput
        label="药品名称"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <View style={styles.imageSection}>
        <Text style={styles.label}>添加照片（可选）</Text>
        <Button 
          mode="outlined" 
          onPress={() => setImagePickerVisible(true)}
          style={styles.imageButton}
        >
          选择图片
        </Button>
        {image && (
          <Image source={{ uri: image }} style={styles.previewImage} />
        )}
      </View>
      <TextInput
        label="药量（可选）"
        value={dosage}
        onChangeText={setDosage}
        keyboardType="numeric"
        style={styles.input}
      />
      {/* 提醒时间选择 */}
      <SimpleModalButton
        label="提醒日期"
        buttonStyle={styles.imageButton}
      />
      <Portal>
        <Modal
          visible={isImagePickerVisible}
          onDismiss={() => setImagePickerVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            Platform.OS === 'android' && styles.androidModalContainer
          ]}
          style={[
            styles.modal,
            Platform.OS === 'android' && styles.androidModal
          ]}
        >
          <View style={styles.modalContent}>
            {Platform.OS === 'web' ? (
              <Button mode="contained" onPress={handleFileUpload} style={styles.modalButton}>
                选择文件
              </Button>
            ) : (
              <>
                <Button mode="contained" onPress={pickImage} style={styles.modalButton}>
                  从相册选择
                </Button>
                <Button mode="contained" onPress={takePhoto} style={styles.modalButton}>
                  拍照
                </Button>
              </>
            )}
            <Button mode="outlined" onPress={() => setImagePickerVisible(false)} style={styles.modalButton}>
              取消
            </Button>
          </View>
        </Modal>
      </Portal>
      <View style={styles.buttonContainer}>
        <Button mode="outlined" onPress={onCancel} style={styles.button}>
          取消
        </Button>
        <Button mode="contained" onPress={handleSubmit} style={styles.button}>
          {isEdit ? '保存' : '确认'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    paddingBottom: 80,
  },
  editTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  imageSection: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  imageButton: {
    marginBottom: 8,
    width: '100%',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
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
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  androidModalContainer: {
    margin: 0,
    paddingBottom: Platform.OS === 'android' ? 20 : 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  modalContent: {
    gap: 10,
  },
  modalButton: {
    marginVertical: 4,
  },
  snackbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
}); 
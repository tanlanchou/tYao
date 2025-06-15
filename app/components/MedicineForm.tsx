import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Text, TextInput } from 'react-native-paper';
import vibrantColors from "../theme/colors";

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
}

export default function MedicineForm({ onSubmit, onCancel, initialData, isEdit = false, showSnackbar }: MedicineFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [image, setImage] = useState<string | undefined>(initialData?.image);
  const [dosage, setDosage] = useState(initialData?.dosage || '');
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

    onSubmit({
      name,
      image,
      dosage,
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
        mode="outlined"
      />
      <View style={styles.imageSection}>
        <Text style={styles.label}>添加照片（可选）</Text>
        <Button 
          mode="outlined" 
          onPress={() => setImagePickerVisible(true)}
          style={styles.imageButton}
          icon="camera"
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
        mode="outlined"
      />
      <View style={styles.buttonContainer}>
        <Button mode="outlined" onPress={onCancel} style={styles.button} icon="close">
          取消
        </Button>
        <Button mode="contained" onPress={handleSubmit} style={styles.button} icon="check">
          {isEdit ? '保存' : '确认'}
        </Button>
      </View>
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
          <Text style={styles.modalTitle}>选择图片</Text>
          <View style={styles.modalContent}>
            {Platform.OS === 'web' ? (
              <Button mode="contained" onPress={handleFileUpload} style={styles.modalButton} icon="file">
                选择文件
              </Button>
            ) : (
              <>
                <Button mode="contained" onPress={pickImage} style={styles.modalButton} icon="image">
                  从相册选择
                </Button>
                <Button mode="contained" onPress={takePhoto} style={styles.modalButton} icon="camera">
                  拍照
                </Button>
              </>
            )}
            <Button mode="outlined" onPress={() => setImagePickerVisible(false)} style={styles.modalButton} icon="close">
              取消
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  editTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: vibrantColors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  imageSection: {
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
  },
  label: {
    marginBottom: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  imageButton: {
    marginBottom: 12,
    borderColor: vibrantColors.primary,
    borderWidth: 1,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
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
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  androidModalContainer: {
    margin: 0,
    paddingBottom: Platform.OS === 'android' ? 24 : 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  modalContent: {
    gap: 12,
  },
  modalButton: {
    marginVertical: 6,
    borderRadius: 8,
    paddingVertical: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: vibrantColors.primary,
  },
}); 
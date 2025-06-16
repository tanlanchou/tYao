import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, IconButton, Modal, Portal, Text, TextInput } from 'react-native-paper';
import { NotificationType } from '../services/NotificationContext';
import vibrantColors from "../theme/colors";

interface MedicineFormProps {
  onSubmit: (data: MedicineData) => void;
  onCancel: () => void;
  initialData?: MedicineData;
  isEdit?: boolean;
  showNotification?: (message: string, type?: NotificationType) => void;
}

export interface MedicineData {
  name: string;
  image?: string;
  dosage?: string;
}

export default function MedicineForm({ 
  onSubmit, 
  onCancel, 
  initialData, 
  isEdit = false,
  showNotification 
}: MedicineFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [image, setImage] = useState<string | undefined>(initialData?.image);
  const [dosage, setDosage] = useState(initialData?.dosage || '');
  const [isImagePickerVisible, setImagePickerVisible] = useState(false);
  const [isDosagePickerVisible, setDosagePickerVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

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
      showNotification && showNotification('需要相机权限才能拍照', 'error');
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
      showNotification && showNotification('请输入药品名称', 'error');
      return;
    }

    onSubmit({
      name,
      image,
      dosage,
    });
  };

  const handleDosageSelect = (value: string) => {
    setDosage(value);
    setDosagePickerVisible(false);
  };

  // 生成1-50的药量选项
  const generateDosageOptions = () => {
    const options = [];
    for (let i = 1; i <= 50; i++) {
      options.push(i.toString());
    }
    return options;
  };

  // 药量选项
  const dosageOptions = generateDosageOptions();

  // 滚动到当前选中的药量
  const scrollToDosage = () => {
    const currentDosage = parseInt(dosage || '1');
    const index = Math.max(0, Math.min(currentDosage - 1, 49));
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: index * 50,
        animated: false
      });
    }, 100);
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
      <TouchableOpacity 
        onPress={() => {
          setDosagePickerVisible(true);
          scrollToDosage();
        }}
        style={styles.dosageInputContainer}
      >
        <Text style={styles.label}>药量（可选）</Text>
        <View style={styles.dosageInput}>
          <Text style={styles.dosageText}>
            {dosage ? `${dosage} 片/粒` : '点击选择药量'}
          </Text>
          <IconButton 
            icon="chevron-down" 
            size={20}
            style={styles.dosageButton}
          />
        </View>
      </TouchableOpacity>
      <View style={styles.buttonContainer}>
        <Button mode="outlined" onPress={onCancel} style={styles.button} icon="close">
          取消
        </Button>
        <Button mode="contained" onPress={handleSubmit} style={styles.button} icon="check">
          {isEdit ? '保存' : '确认'}
        </Button>
      </View>

      {/* 图片选择器模态框 */}
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

      {/* 药量选择器模态框 */}
      <Portal>
        <Modal
          visible={isDosagePickerVisible}
          onDismiss={() => setDosagePickerVisible(false)}
          contentContainerStyle={[
            styles.dosageModalContainer,
            Platform.OS === 'android' && styles.androidModalContainer
          ]}
          style={[
            styles.modal,
            Platform.OS === 'android' && styles.androidModal
          ]}
        >
          <Text style={styles.modalTitle}>选择药量</Text>
          <View style={styles.dosagePickerContainer}>
            <ScrollView 
              ref={scrollViewRef}
              showsVerticalScrollIndicator={true}
              style={styles.dosageScroller}
              contentContainerStyle={styles.dosageScrollerContent}
            >
              {dosageOptions.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.dosageOption,
                    dosage === value && styles.selectedDosageOption
                  ]}
                  onPress={() => handleDosageSelect(value)}
                >
                  <Text 
                    style={[
                      styles.dosageOptionText,
                      dosage === value && styles.selectedDosageOptionText
                    ]}
                  >
                    {value} 片/粒
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.dosageModalActions}>
            <Button 
              mode="outlined" 
              onPress={() => setDosagePickerVisible(false)} 
              style={styles.dosageModalButton}
            >
              取消
            </Button>
            <Button 
              mode="contained" 
              onPress={() => setDosagePickerVisible(false)} 
              style={styles.dosageModalButton}
            >
              确定
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
  // 药量选择器样式
  dosageInputContainer: {
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
  },
  dosageInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dosageText: {
    fontSize: 16,
    color: '#333',
  },
  dosageButton: {
    margin: 0,
    padding: 0,
  },
  dosageModalContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    alignSelf: 'center',
    maxHeight: '70%',
  },
  dosagePickerContainer: {
    height: 250,
    marginVertical: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  dosageScroller: {
    flex: 1,
  },
  dosageScrollerContent: {
    paddingVertical: 20,
  },
  dosageOption: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  selectedDosageOption: {
    backgroundColor: vibrantColors.primary + '20', // 添加透明度
  },
  dosageOptionText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
  },
  selectedDosageOptionText: {
    color: vibrantColors.primary,
    fontWeight: 'bold',
  },
  dosageModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  dosageModalButton: {
    flex: 1,
    borderRadius: 8,
  },
}); 
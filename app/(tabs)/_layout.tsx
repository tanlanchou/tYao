import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

export default function TabLayout() {
  const theme = useTheme();

  const handleAddPress = () => {
    // 清除 URL 参数并导航到添加页面
    router.replace('/add');
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          height: 60,
          position: 'relative',
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleAlign: 'center',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '服药闹钟',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '添加',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.addButtonContainer}>
              <View style={[styles.addButton, focused && styles.addButtonActive]}>
                <MaterialCommunityIcons 
                  name="plus" 
                  size={size * 1.2} 
                  color={focused ? '#fff' : color} 
                />
              </View>
            </View>
          ),
          headerLeft: () => (
            <MaterialCommunityIcons
              name="arrow-left"
              size={28}
              color={theme.colors.onSurface}
              style={{ marginLeft: 12 }}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/');
                }
              }}
            />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            // 阻止默认行为
            e.preventDefault();
            // 使用自定义处理函数
            handleAddPress();
          },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '设置',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addButtonContainer: {
    position: 'absolute',
    bottom: 5,
    alignSelf: 'center',
    left: '50%',
    transform: [{ translateX: -30 }], // 按钮宽度的一半
  },
  addButton: {
    backgroundColor: '#fff',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonActive: {
    backgroundColor: '#2196F3',
  },
});


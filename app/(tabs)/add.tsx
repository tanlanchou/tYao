import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

export default function AddScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">添加</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 
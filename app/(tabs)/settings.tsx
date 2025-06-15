import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Avatar, Caption, Divider, List, Surface, Switch, Text, Title } from 'react-native-paper';
import vibrantColors from '../theme/colors';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [vibrationEnabled, setVibrationEnabled] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.header}>
        <Avatar.Icon 
          size={80} 
          icon="cog" 
          color={vibrantColors.textLight}
          style={{backgroundColor: vibrantColors.primary}}
        />
        <Title style={styles.title}>设置</Title>
        <Caption style={styles.caption}>配置您的药品闹钟应用</Caption>
      </Surface>
      
      <Surface style={styles.section}>
        <Text style={styles.sectionTitle}>提醒设置</Text>
        <List.Item
          title="提醒通知"
          description="启用或禁用闹钟提醒通知"
          left={props => <List.Icon {...props} icon="bell" color={vibrantColors.primary} />}
          right={props => <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} color={vibrantColors.primary} />}
        />
        <Divider style={styles.divider} />
        <List.Item
          title="提醒声音"
          description="启用或禁用闹钟响铃声音"
          left={props => <List.Icon {...props} icon="volume-high" color={vibrantColors.secondary} />}
          right={props => <Switch value={soundEnabled} onValueChange={setSoundEnabled} color={vibrantColors.secondary} />}
        />
        <Divider style={styles.divider} />
        <List.Item
          title="振动提醒"
          description="启用或禁用闹钟振动提醒"
          left={props => <List.Icon {...props} icon="vibrate" color={vibrantColors.accent} />}
          right={props => <Switch value={vibrationEnabled} onValueChange={setVibrationEnabled} color={vibrantColors.accent} />}
        />
      </Surface>
      
      <Surface style={styles.section}>
        <Text style={styles.sectionTitle}>应用设置</Text>
        <List.Item
          title="深色模式"
          description="切换明暗主题显示"
          left={props => <List.Icon {...props} icon="theme-light-dark" color={vibrantColors.info} />}
          right={props => <Switch value={darkMode} onValueChange={setDarkMode} color={vibrantColors.info} />}
        />
        <Divider style={styles.divider} />
        <List.Item
          title="备份数据"
          description="将您的闹钟数据备份至云端"
          left={props => <List.Icon {...props} icon="cloud-upload" color={vibrantColors.success} />}
          onPress={() => {}}
        />
        <Divider style={styles.divider} />
        <List.Item
          title="恢复数据"
          description="从云端恢复您的闹钟数据"
          left={props => <List.Icon {...props} icon="cloud-download" color={vibrantColors.warning} />}
          onPress={() => {}}
        />
      </Surface>
      
      <Surface style={styles.section}>
        <Text style={styles.sectionTitle}>关于</Text>
        <List.Item
          title="应用版本"
          description="1.0.0"
          left={props => <List.Icon {...props} icon="information" color={vibrantColors.error} />}
        />
        <Divider style={styles.divider} />
        <List.Item
          title="联系我们"
          description="feedback@yaomedicine.app"
          left={props => <List.Icon {...props} icon="email" color={vibrantColors.primary} />}
          onPress={() => {}}
        />
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: vibrantColors.surfaceLight,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: vibrantColors.surface,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: vibrantColors.divider,
    elevation: 2,
  },
  title: {
    marginTop: 12,
    fontSize: 24,
    fontWeight: 'bold',
    color: vibrantColors.textPrimary,
  },
  caption: {
    fontSize: 14,
    color: vibrantColors.textSecondary,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: vibrantColors.primary,
    padding: 16,
    paddingBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: vibrantColors.divider,
  }
}); 
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Caption, Divider, List, Surface, Switch, Text } from 'react-native-paper';
import vibrantColors from '../theme/colors';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [vibrationEnabled, setVibrationEnabled] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);

  return (
    <View style={styles.container}>
      {/* 应用图标和描述 */}
      <View style={styles.iconSection}>
        <Avatar.Icon 
          size={100} 
          icon="cog" 
          color="#fff"
          style={{backgroundColor: vibrantColors.primary}}
        />
        <Caption style={[styles.caption, {marginTop: 12}]}>配置您的药品闹钟应用</Caption>
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        {/* 提醒设置区块 */}
        <Surface style={styles.section}>
          <Text style={styles.sectionTitle}>提醒设置</Text>
          
          {/* 提醒通知 */}
          <View style={styles.settingItem}>
            <View style={[styles.iconContainer, { backgroundColor: vibrantColors.primaryLight }]}>
              <List.Icon icon="bell" color={vibrantColors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>提醒通知</Text>
              <Text style={styles.settingDescription}>启用或禁用闹钟提醒通知</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              color={vibrantColors.primary}
              style={styles.switch}
            />
          </View>
          
          <Divider style={styles.divider} />
          
          {/* 提醒声音 */}
          <View style={styles.settingItem}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(78, 205, 196, 0.15)' }]}>
              <List.Icon icon="volume-high" color={vibrantColors.secondary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>提醒声音</Text>
              <Text style={styles.settingDescription}>启用或禁用闹钟响铃声音</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              color={vibrantColors.secondary}
              style={styles.switch}
            />
          </View>
          
          <Divider style={styles.divider} />
          
          {/* 振动提醒 */}
          <View style={styles.settingItem}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 209, 102, 0.15)' }]}>
              <List.Icon icon="vibrate" color={vibrantColors.accent} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>振动提醒</Text>
              <Text style={styles.settingDescription}>启用或禁用闹钟振动提醒</Text>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={setVibrationEnabled}
              color={vibrantColors.accent}
              style={styles.switch}
            />
          </View>
        </Surface>
        
        {/* 应用设置区块 */}
        <Surface style={styles.section}>
          <Text style={styles.sectionTitle}>应用设置</Text>
          
          {/* 深色模式 */}
          <View style={styles.settingItem}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(17, 138, 178, 0.15)' }]}>
              <List.Icon icon="theme-light-dark" color={vibrantColors.info} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>深色模式</Text>
              <Text style={styles.settingDescription}>切换明暗主题显示</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              color={vibrantColors.info}
              style={styles.switch}
            />
          </View>
          
          <Divider style={styles.divider} />
          
          {/* 备份数据 */}
          <View style={styles.settingItem}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(6, 214, 160, 0.15)' }]}>
              <List.Icon icon="cloud-upload" color={vibrantColors.success} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>备份数据</Text>
              <Text style={styles.settingDescription}>将您的闹钟数据备份至云端</Text>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          {/* 恢复数据 */}
          <View style={styles.settingItem}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 209, 102, 0.15)' }]}>
              <List.Icon icon="cloud-download" color={vibrantColors.warning} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>恢复数据</Text>
              <Text style={styles.settingDescription}>从云端恢复您的闹钟数据</Text>
            </View>
          </View>
        </Surface>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: vibrantColors.surfaceLight,
  },
  iconSection: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    paddingBottom: 10,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  scrollContainer: {
    flex: 1,
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
    marginTop: 4,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: vibrantColors.primary,
    padding: 16,
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: vibrantColors.textPrimary,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    color: vibrantColors.textSecondary,
    marginTop: 2,
  },
  switch: {
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: vibrantColors.divider,
    marginHorizontal: 16,
  },
}); 
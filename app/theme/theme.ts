import { MD3LightTheme } from 'react-native-paper';
import vibrantColors from './colors';

// 创建一个自定义主题，基于MD3主题，但使用我们的活泼颜色
export const vibrantTheme = {
  ...MD3LightTheme,
  // 使用我们自定义的颜色覆盖默认颜色
  colors: {
    ...MD3LightTheme.colors,
    primary: vibrantColors.primary,
    onPrimary: vibrantColors.textLight,
    primaryContainer: vibrantColors.primaryLight,
    onPrimaryContainer: vibrantColors.primary,
    
    secondary: vibrantColors.secondary,
    onSecondary: vibrantColors.textLight,
    secondaryContainer: vibrantColors.secondaryLight,
    onSecondaryContainer: vibrantColors.secondary,
    
    tertiary: vibrantColors.accent,
    onTertiary: vibrantColors.textPrimary,
    tertiaryContainer: vibrantColors.accentLight,
    onTertiaryContainer: vibrantColors.accent,
    
    error: vibrantColors.error,
    onError: vibrantColors.textLight,
    errorContainer: vibrantColors.errorLight,
    onErrorContainer: vibrantColors.error,
    
    background: vibrantColors.background,
    onBackground: vibrantColors.textPrimary,
    surface: vibrantColors.surface,
    onSurface: vibrantColors.textPrimary,
    surfaceVariant: vibrantColors.surfaceLight,
    onSurfaceVariant: vibrantColors.textSecondary,
    
    // 其他颜色
    outline: vibrantColors.divider,
    outlineVariant: vibrantColors.divider,
    scrim: 'rgba(0, 0, 0, 0.3)',
    inverseSurface: vibrantColors.neutral,
    inverseOnSurface: vibrantColors.textLight,
    inversePrimary: vibrantColors.primary,
    elevation: {
      level0: 'transparent',
      level1: 'rgba(0, 0, 0, 0.05)',
      level2: 'rgba(0, 0, 0, 0.08)',
      level3: 'rgba(0, 0, 0, 0.11)',
      level4: 'rgba(0, 0, 0, 0.12)',
      level5: 'rgba(0, 0, 0, 0.14)',
    }
  },
};

export default vibrantTheme; 
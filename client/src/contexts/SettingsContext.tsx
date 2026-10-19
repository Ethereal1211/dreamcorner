import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import * as userSettingsApi from '@client/src/api/user-settings';
import type { UserSettings } from '@shared/api.interface';

export const THEME_PRESETS: Record<string, ThemePreset> = {
  dream_purple: {
    name: '梦幻紫',
    primary: 'hsl(280 80% 72%)',
    accent: 'hsl(320 70% 70%)',
    background: 'hsl(270 40% 8%)',
    gradient: 'linear-gradient(135deg, hsl(260 50% 12%) 0%, hsl(280 50% 15%) 30%, hsl(300 45% 14%) 60%, hsl(270 50% 12%) 100%)',
    orb1: 'radial-gradient(circle, hsl(280 80% 60%) 0%, transparent 70%)',
    orb2: 'radial-gradient(circle, hsl(320 70% 60%) 0%, transparent 70%)',
    shadowColor: 'hsl(280 80% 30%)',
    gradientText: 'linear-gradient(135deg, hsl(280 80% 78%), hsl(320 75% 75%))',
    navGlow: 'hsl(280 80% 78%)',
    navFilter: 'drop-shadow(0 0 6px hsl(280 80% 70% / 0.6))',
    avatarGradient: 'from-violet-400 to-pink-400',
  },
  ocean_blue: {
    name: '海洋蓝',
    primary: 'hsl(200 80% 72%)',
    accent: 'hsl(180 70% 65%)',
    background: 'hsl(210 50% 8%)',
    gradient: 'linear-gradient(135deg, hsl(220 50% 12%) 0%, hsl(200 50% 15%) 30%, hsl(190 45% 14%) 60%, hsl(210 50% 12%) 100%)',
    orb1: 'radial-gradient(circle, hsl(200 80% 55%) 0%, transparent 70%)',
    orb2: 'radial-gradient(circle, hsl(180 70% 55%) 0%, transparent 70%)',
    shadowColor: 'hsl(200 80% 30%)',
    gradientText: 'linear-gradient(135deg, hsl(200 80% 78%), hsl(180 75% 70%))',
    navGlow: 'hsl(200 80% 78%)',
    navFilter: 'drop-shadow(0 0 6px hsl(200 80% 70% / 0.6))',
    avatarGradient: 'from-blue-400 to-cyan-400',
  },
  sunset_orange: {
    name: '落日橙',
    primary: 'hsl(30 90% 70%)',
    accent: 'hsl(350 80% 70%)',
    background: 'hsl(20 40% 8%)',
    gradient: 'linear-gradient(135deg, hsl(25 50% 12%) 0%, hsl(30 50% 15%) 30%, hsl(350 45% 14%) 60%, hsl(20 50% 12%) 100%)',
    orb1: 'radial-gradient(circle, hsl(30 90% 55%) 0%, transparent 70%)',
    orb2: 'radial-gradient(circle, hsl(350 80% 55%) 0%, transparent 70%)',
    shadowColor: 'hsl(30 80% 30%)',
    gradientText: 'linear-gradient(135deg, hsl(30 90% 75%), hsl(350 80% 70%))',
    navGlow: 'hsl(30 90% 75%)',
    navFilter: 'drop-shadow(0 0 6px hsl(30 90% 60% / 0.6))',
    avatarGradient: 'from-orange-400 to-rose-400',
  },
  forest_green: {
    name: '森林绿',
    primary: 'hsl(140 60% 65%)',
    accent: 'hsl(160 60% 60%)',
    background: 'hsl(150 40% 8%)',
    gradient: 'linear-gradient(135deg, hsl(150 50% 12%) 0%, hsl(140 50% 15%) 30%, hsl(170 45% 14%) 60%, hsl(150 50% 12%) 100%)',
    orb1: 'radial-gradient(circle, hsl(140 60% 50%) 0%, transparent 70%)',
    orb2: 'radial-gradient(circle, hsl(160 60% 50%) 0%, transparent 70%)',
    shadowColor: 'hsl(140 60% 25%)',
    gradientText: 'linear-gradient(135deg, hsl(140 70% 72%), hsl(160 65% 65%))',
    navGlow: 'hsl(140 70% 72%)',
    navFilter: 'drop-shadow(0 0 6px hsl(140 60% 60% / 0.6))',
    avatarGradient: 'from-emerald-400 to-teal-400',
  },
  sakura_pink: {
    name: '樱花粉',
    primary: 'hsl(340 80% 78%)',
    accent: 'hsl(300 70% 75%)',
    background: 'hsl(330 30% 10%)',
    gradient: 'linear-gradient(135deg, hsl(330 40% 14%) 0%, hsl(340 40% 18%) 30%, hsl(300 40% 16%) 60%, hsl(330 40% 14%) 100%)',
    orb1: 'radial-gradient(circle, hsl(340 80% 65%) 0%, transparent 70%)',
    orb2: 'radial-gradient(circle, hsl(300 70% 65%) 0%, transparent 70%)',
    shadowColor: 'hsl(340 70% 30%)',
    gradientText: 'linear-gradient(135deg, hsl(340 85% 82%), hsl(300 75% 78%))',
    navGlow: 'hsl(340 85% 82%)',
    navFilter: 'drop-shadow(0 0 6px hsl(340 80% 70% / 0.6))',
    avatarGradient: 'from-pink-400 to-purple-400',
  },
  starlight_navy: {
    name: '星光藏青',
    primary: 'hsl(220 70% 75%)',
    accent: 'hsl(260 60% 75%)',
    background: 'hsl(230 50% 6%)',
    gradient: 'linear-gradient(135deg, hsl(230 60% 10%) 0%, hsl(240 50% 12%) 30%, hsl(260 50% 11%) 60%, hsl(230 60% 10%) 100%)',
    orb1: 'radial-gradient(circle, hsl(220 70% 55%) 0%, transparent 70%)',
    orb2: 'radial-gradient(circle, hsl(260 60% 55%) 0%, transparent 70%)',
    shadowColor: 'hsl(230 70% 25%)',
    gradientText: 'linear-gradient(135deg, hsl(220 75% 80%), hsl(260 65% 78%))',
    navGlow: 'hsl(220 75% 80%)',
    navFilter: 'drop-shadow(0 0 6px hsl(220 70% 65% / 0.6))',
    avatarGradient: 'from-indigo-400 to-blue-500',
  },
};

export interface ThemePreset {
  name: string;
  primary: string;
  accent: string;
  background: string;
  gradient: string;
  orb1: string;
  orb2: string;
  shadowColor: string;
  gradientText: string;
  navGlow: string;
  navFilter: string;
  avatarGradient: string;
}

interface SettingsContextValue {
  settings: UserSettings | null;
  theme: ThemePreset;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  applyTheme: (themeKey: string) => Promise<void>;
  updateDreamRole: (patch: Partial<Pick<UserSettings, 'dreamRoleName' | 'dreamRoleAvatar' | 'dreamRoleAvatarColor' | 'dreamRoleAvatarUrl'>>) => Promise<void>;
  updateUserProfile: (patch: Partial<Pick<UserSettings, 'userName' | 'userAvatar' | 'userAvatarColor' | 'userAvatarUrl'>>) => Promise<void>;
  dreamRoleName: string;
  dreamRoleAvatar: string;
  dreamRoleAvatarColor: string;
  dreamRoleAvatarUrl: string;
  userName: string;
  userAvatar: string;
  userAvatarColor: string;
  userAvatarUrl: string;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const currentThemeKey = settings?.themeName ?? 'dream_purple';
  const theme = THEME_PRESETS[currentThemeKey] ?? THEME_PRESETS.dream_purple;

  const applyThemeToDom = useCallback((t: ThemePreset) => {
    const root = document.documentElement;
    root.style.setProperty('--primary', t.primary);
    root.style.setProperty('--accent', t.accent);
    root.style.setProperty('--background', t.background);
    root.style.setProperty('--ring', t.primary);
    root.style.setProperty('--chart-1', t.primary);
    root.style.setProperty('--chart-2', t.accent);
    root.style.setProperty('--sidebar-primary', t.primary);
    root.style.setProperty('--sidebar-ring', t.primary);
    root.style.setProperty('--shadow-color', t.shadowColor);
    root.style.setProperty('--sidebar-accent-foreground', t.primary);
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const data = await userSettingsApi.getSettings();
      setSettings(data);
      const t = THEME_PRESETS[data.themeName] ?? THEME_PRESETS.dream_purple;
      applyThemeToDom(t);
    } catch (error: unknown) {
      logger.error('加载设置失败', error);
      applyThemeToDom(THEME_PRESETS.dream_purple);
    } finally {
      setLoading(false);
    }
  }, [applyThemeToDom]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const refreshSettings = useCallback(async () => {
    setLoading(true);
    await loadSettings();
  }, [loadSettings]);

  const applyTheme = useCallback(async (themeKey: string) => {
    const preset = THEME_PRESETS[themeKey];
    if (!preset) return;
    applyThemeToDom(preset);
    try {
      const updated = await userSettingsApi.updateSettings({
        themeName: themeKey,
        primaryColor: preset.primary,
        accentColor: preset.accent,
        backgroundColor: preset.background,
      });
      setSettings(updated);
    } catch (error: unknown) {
      logger.error('保存主题失败', error);
    }
  }, [applyThemeToDom]);

  const updateDreamRole = useCallback(async (patch: Partial<Pick<UserSettings, 'dreamRoleName' | 'dreamRoleAvatar' | 'dreamRoleAvatarColor' | 'dreamRoleAvatarUrl'>>) => {
    try {
      const updated = await userSettingsApi.updateSettings(patch);
      setSettings(updated);
    } catch (error: unknown) {
      logger.error('更新梦角资料失败', error);
      throw error;
    }
  }, []);

  const updateUserProfile = useCallback(async (patch: Partial<Pick<UserSettings, 'userName' | 'userAvatar' | 'userAvatarColor' | 'userAvatarUrl'>>) => {
    try {
      const updated = await userSettingsApi.updateSettings(patch);
      setSettings(updated);
    } catch (error: unknown) {
      logger.error('更新个人资料失败', error);
      throw error;
    }
  }, []);

  const value: SettingsContextValue = {
    settings,
    theme,
    loading,
    refreshSettings,
    applyTheme,
    updateDreamRole,
    updateUserProfile,
    dreamRoleName: settings?.dreamRoleName ?? '梦角',
    dreamRoleAvatar: settings?.dreamRoleAvatar ?? '梦',
    dreamRoleAvatarColor: settings?.dreamRoleAvatarColor ?? 'from-violet-400 to-pink-400',
    dreamRoleAvatarUrl: settings?.dreamRoleAvatarUrl ?? '',
    userName: settings?.userName ?? '',
    userAvatar: settings?.userAvatar ?? '我',
    userAvatarColor: settings?.userAvatarColor ?? 'from-blue-400 to-cyan-400',
    userAvatarUrl: settings?.userAvatarUrl ?? '',
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
}

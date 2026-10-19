import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Palette,
  Sparkles,
  User as UserIcon,
  Check,
  Brain,
  Upload,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useSettings, THEME_PRESETS } from '@client/src/contexts/SettingsContext';
import { AvatarUpload } from '@client/src/components/ui/avatar-upload';
import * as aiSettingsApi from '@client/src/api/ai-settings';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import { Input } from '@client/src/components/ui/input';
import { Button } from '@client/src/components/ui/button';
import { Slider } from '@client/src/components/ui/slider';
import { Textarea } from '@client/src/components/ui/textarea';
import { Switch } from '@client/src/components/ui/switch';
import { Label } from '@client/src/components/ui/label';
import type { AiSettings } from '@shared/api.interface';

const AVATAR_GRADIENTS: { label: string; gradient: string }[] = [
  { label: '梦幻紫', gradient: 'from-violet-400 to-pink-400' },
  { label: '海洋蓝', gradient: 'from-blue-400 to-cyan-400' },
  { label: '落日橙', gradient: 'from-orange-400 to-rose-400' },
  { label: '森林绿', gradient: 'from-emerald-400 to-teal-400' },
  { label: '樱花粉', gradient: 'from-pink-400 to-purple-400' },
  { label: '星光藏青', gradient: 'from-indigo-400 to-blue-500' },
];

const SettingsPage = () => {
  const navigate = useNavigate();
  const {
    applyTheme,
    updateDreamRole,
    updateUserProfile,
    dreamRoleName,
    dreamRoleAvatar,
    dreamRoleAvatarColor,
    dreamRoleAvatarUrl,
    userName,
    userAvatar,
    userAvatarColor,
    userAvatarUrl,
    settings,
  } = useSettings();

  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await aiSettingsApi.getSettings();
        if (!cancelled) setAiSettings(data);
      } catch (error: unknown) {
        logger.error('加载AI设置失败', error);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Local editing state
  const [dreamNameInput, setDreamNameInput] = useState(dreamRoleName);
  const [dreamAvatarInput, setDreamAvatarInput] = useState(dreamRoleAvatar);
  const [dreamAvatarColorInput, setDreamAvatarColorInput] =
    useState(dreamRoleAvatarColor);
  const [dreamAvatarUrl, setDreamAvatarUrl] = useState(dreamRoleAvatarUrl);

  const [userNameInput, setUserNameInput] = useState(userName);
  const [userAvatarInput, setUserAvatarInput] = useState(userAvatar);
  const [userAvatarColorInput, setUserAvatarColorInput] =
    useState(userAvatarColor);
  const [userAvatarUrlInput, setUserAvatarUrlInput] = useState(userAvatarUrl);

  const [saveStatus, setSaveStatus] = useState<'' | 'saving' | 'saved'>('');

  // Sync from context when settings load
  useEffect(() => {
    setDreamNameInput(dreamRoleName);
    setDreamAvatarInput(dreamRoleAvatar);
    setDreamAvatarColorInput(dreamRoleAvatarColor);
    setDreamAvatarUrl(dreamRoleAvatarUrl);
    setUserNameInput(userName);
    setUserAvatarInput(userAvatar);
    setUserAvatarColorInput(userAvatarColor);
    setUserAvatarUrlInput(userAvatarUrl);
  }, [
    dreamRoleName,
    dreamRoleAvatar,
    dreamRoleAvatarColor,
    dreamRoleAvatarUrl,
    userName,
    userAvatar,
    userAvatarColor,
    userAvatarUrl,
  ]);

  const showSaved = useCallback(() => {
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus(''), 1500);
  }, []);

  const showSaving = useCallback(() => {
    setSaveStatus('saving');
  }, []);

  const [aiDebounceTimer, setAiDebounceTimer] =
    useState<ReturnType<typeof setTimeout> | null>(null);

  const handleAiPatch = useCallback(
    (patch: Partial<AiSettings>) => {
      setAiSettings((prev: AiSettings | null) =>
        prev ? { ...prev, ...patch } : prev,
      );
      if (aiDebounceTimer) clearTimeout(aiDebounceTimer);
      setAiSaving(true);
      const timer = setTimeout(async () => {
        try {
          const updated = await aiSettingsApi.updateSettings(patch);
          setAiSettings(updated);
          showSaved();
          toast.success('AI 设置已保存');
        } catch (error: unknown) {
          logger.error('保存AI设置失败', error);
          toast.error('保存失败');
        } finally {
          setAiSaving(false);
        }
      }, 800);
      setAiDebounceTimer(timer);
    },
    [aiDebounceTimer, showSaved],
  );

  // Theme switch
  const handleThemeChange = useCallback(
    async (themeKey: string) => {
      showSaving();
      try {
        await applyTheme(themeKey);
        showSaved();
      } catch {
        setSaveStatus('');
      }
    },
    [applyTheme, showSaved, showSaving],
  );

  // Dream role debounced save
  const [dreamDebounceTimer, setDreamDebounceTimer] =
    useState<ReturnType<typeof setTimeout> | null>(null);

  const scheduleDreamSave = useCallback(
    (patch: {
      dreamRoleName?: string;
      dreamRoleAvatar?: string;
      dreamRoleAvatarColor?: string;
    }) => {
      if (dreamDebounceTimer) clearTimeout(dreamDebounceTimer);
      const timer = setTimeout(async () => {
        showSaving();
        try {
          await updateDreamRole(patch);
          showSaved();
        } catch {
          setSaveStatus('');
        }
      }, 500);
      setDreamDebounceTimer(timer);
    },
    [dreamDebounceTimer, updateDreamRole, showSaved, showSaving],
  );

  // User profile debounced save
  const [userDebounceTimer, setUserDebounceTimer] =
    useState<ReturnType<typeof setTimeout> | null>(null);

  const scheduleUserSave = useCallback(
    (patch: {
      userName?: string;
      userAvatar?: string;
      userAvatarColor?: string;
    }) => {
      if (userDebounceTimer) clearTimeout(userDebounceTimer);
      const timer = setTimeout(async () => {
        showSaving();
        try {
          await updateUserProfile(patch);
          showSaved();
        } catch {
          setSaveStatus('');
        }
      }, 500);
      setUserDebounceTimer(timer);
    },
    [userDebounceTimer, updateUserProfile, showSaved, showSaving],
  );

  const handleDreamNameChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const v = e.target.value;
    setDreamNameInput(v);
    scheduleDreamSave({ dreamRoleName: v });
  };

  const handleDreamAvatarChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const v = e.target.value.slice(0, 2);
    setDreamAvatarInput(v);
    if (v.length > 0) {
      scheduleDreamSave({ dreamRoleAvatar: v });
    }
  };

  const handleDreamAvatarColorChange = (gradient: string) => {
    setDreamAvatarColorInput(gradient);
    scheduleDreamSave({ dreamRoleAvatarColor: gradient });
  };

  const handleUserNameChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const v = e.target.value;
    setUserNameInput(v);
    scheduleUserSave({ userName: v });
  };

  const handleUserAvatarChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const v = e.target.value.slice(0, 2);
    setUserAvatarInput(v);
    if (v.length > 0) {
      scheduleUserSave({ userAvatar: v });
    }
  };

  const handleUserAvatarColorChange = (gradient: string) => {
    setUserAvatarColorInput(gradient);
    scheduleUserSave({ userAvatarColor: gradient });
  };

  const currentThemeKey = settings?.themeName ?? 'dream_purple';

  return (
    <div className="flex flex-col h-full text-white">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between px-2 py-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl glass-card flex items-center justify-center text-white/80 hover:text-white transition-colors"
          aria-label="返回"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-sm font-medium">设置</div>
        <div className="w-9 h-9 flex items-center justify-center">
          {saveStatus === 'saving' && (
            <span className="text-xs text-white/50">保存中...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-emerald-300 flex items-center gap-1">
              <Check size={14} />
              已保存
            </span>
          )}
        </div>
      </div>

      {/* 滚动内容 */}
      <div className="flex-1 overflow-y-auto px-3 pb-24 space-y-4 scrollbar-hide">
        {/* 主题切换 */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Palette size={16} className="text-pink-300" />
            <div className="text-sm font-medium">主题预设</div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(THEME_PRESETS).map(
              ([key, preset]) => {
                const isActive = key === currentThemeKey;
                return (
                  <button
                    key={key}
                    onClick={() => handleThemeChange(key)}
                    className={`flex flex-col items-center gap-2 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'ring-2 ring-white/60 bg-white/5'
                        : 'hover:bg-white/5'
                    }`}
                    aria-label={`切换到${preset.name}主题`}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center gap-0.5 relative"
                      style={{
                        background: preset.gradient,
                        boxShadow: `0 4px 12px ${preset.shadowColor}`,
                      }}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: preset.accent }}
                      />
                      {isActive && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Check
                            size={18}
                            className="text-white drop-shadow"
                          />
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-white/80">
                      {preset.name}
                    </span>
                  </button>
                );
              },
            )}
          </div>
        </div>

        {/* 梦角资料 */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-pink-300" />
            <div className="text-sm font-medium">梦角资料</div>
          </div>

          {/* 实时预览 */}
          <div className="glass-card rounded-xl p-4 mb-4 flex items-center gap-3">
            <AvatarUpload
              currentUrl={dreamAvatarUrl || dreamRoleAvatarUrl}
              fallback={dreamAvatarInput || '梦'}
              size="md"
              label="梦角"
              onUploaded={async (url: string) => {
                setDreamAvatarUrl(url);
                showSaving();
                try {
                  await updateDreamRole({ dreamRoleAvatarUrl: url });
                  showSaved();
                } catch {
                  setSaveStatus('');
                }
              }}
            />
            <div className="flex flex-col">
              <div className="text-sm font-medium">
                {dreamNameInput || '梦角'}
              </div>
              <div className="text-xs text-white/50 mt-0.5">
                点击相机图标上传头像
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-white/60 block mb-1.5">
                梦角名字
              </label>
              <input
                type="text"
                value={dreamNameInput}
                onChange={handleDreamNameChange}
                maxLength={20}
                placeholder="给梦角起个名字"
                className="w-full glass-card rounded-xl px-3 py-2.5 text-sm bg-transparent text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-white/20 transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-white/60 block mb-1.5">
                头像文字（1-2个字）
              </label>
              <input
                type="text"
                value={dreamAvatarInput}
                onChange={handleDreamAvatarChange}
                maxLength={2}
                placeholder="梦"
                className="w-full glass-card rounded-xl px-3 py-2.5 text-sm bg-transparent text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-white/20 transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-white/60 block mb-2">
                头像颜色
              </label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_GRADIENTS.map((item) => {
                  const isActive = item.gradient === dreamAvatarColorInput;
                  return (
                    <button
                      key={item.gradient}
                      onClick={() =>
                        handleDreamAvatarColorChange(item.gradient)
                      }
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.gradient} transition-all ${
                        isActive
                          ? 'ring-2 ring-white/70 scale-110'
                          : 'hover:scale-105'
                      }`}
                      aria-label={`选择${item.label}头像颜色`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 个人资料 */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <UserIcon size={16} className="text-pink-300" />
            <div className="text-sm font-medium">我的资料</div>
          </div>

          {/* 实时预览 */}
          <div className="glass-card rounded-xl p-4 mb-4 flex items-center gap-3">
            <AvatarUpload
              currentUrl={userAvatarUrlInput || userAvatarUrl}
              fallback={userAvatarInput || '我'}
              size="md"
              label="我的"
              onUploaded={async (url: string) => {
                setUserAvatarUrlInput(url);
                showSaving();
                try {
                  await updateUserProfile({ userAvatarUrl: url });
                  showSaved();
                } catch {
                  setSaveStatus('');
                }
              }}
            />
            <div className="flex flex-col">
              <div className="text-sm font-medium">
                {userNameInput || '我'}
              </div>
              <div className="text-xs text-white/50 mt-0.5">
                点击相机图标上传头像
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-white/60 block mb-1.5">
                我的名字
              </label>
              <input
                type="text"
                value={userNameInput}
                onChange={handleUserNameChange}
                maxLength={20}
                placeholder="你的名字"
                className="w-full glass-card rounded-xl px-3 py-2.5 text-sm bg-transparent text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-white/20 transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-white/60 block mb-1.5">
                头像文字（1-2个字）
              </label>
              <input
                type="text"
                value={userAvatarInput}
                onChange={handleUserAvatarChange}
                maxLength={2}
                placeholder="我"
                className="w-full glass-card rounded-xl px-3 py-2.5 text-sm bg-transparent text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-white/20 transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-white/60 block mb-2">
                头像颜色
              </label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_GRADIENTS.map((item) => {
                  const isActive = item.gradient === userAvatarColorInput;
                  return (
                    <button
                      key={item.gradient}
                      onClick={() =>
                        handleUserAvatarColorChange(item.gradient)
                      }
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.gradient} transition-all ${
                        isActive
                          ? 'ring-2 ring-white/70 scale-110'
                          : 'hover:scale-105'
                      }`}
                      aria-label={`选择${item.label}头像颜色`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* AI 配置 */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={16} className="text-pink-300" />
            <div className="text-sm font-medium">AI 模型配置</div>
          </div>

          {!aiSettings ? (
            <div className="text-xs text-white/50">加载中...</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs text-white/80">启用 AI 回复</Label>
                  <p className="text-[10px] text-white/40 mt-0.5">
                    启用后聊天和解牌将使用配置的 AI 模型生成回复
                  </p>
                </div>
                <Switch
                  checked={aiSettings.isEnabled}
                  onCheckedChange={(checked: boolean) =>
                    handleAiPatch({ isEnabled: checked })
                  }
                />
              </div>

              <div>
                <Label className="text-xs text-white/60 block mb-1.5">
                  接口地址 (Base URL)
                </Label>
                <Input
                  value={aiSettings.baseUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleAiPatch({ baseUrl: e.target.value })
                  }
                  placeholder="https://api.example.com/v1"
                  className="glass-card bg-transparent border-white/10 text-white placeholder-white/30"
                />
                <p className="text-[10px] text-white/40 mt-1">
                  OpenAI 兼容接口，以 /v1 结尾
                </p>
              </div>

              <div>
                <Label className="text-xs text-white/60 block mb-1.5">
                  API Key
                </Label>
                <div className="relative">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={aiSettings.apiKey}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleAiPatch({ apiKey: e.target.value })
                    }
                    placeholder="sk-xxxxxxxxxxxxxxxx"
                    className="glass-card bg-transparent border-white/10 text-white placeholder-white/30 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((v: boolean) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                    aria-label={showApiKey ? '隐藏密钥' : '显示密钥'}
                  >
                    {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-xs text-white/60 block mb-1.5">
                  模型名称
                </Label>
                <Input
                  value={aiSettings.modelName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleAiPatch({ modelName: e.target.value })
                  }
                  placeholder="gpt-4o-mini"
                  className="glass-card bg-transparent border-white/10 text-white placeholder-white/30"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-white/60">
                    温度: {aiSettings.temperature.toFixed(1)}
                  </Label>
                </div>
                <Slider
                  value={[aiSettings.temperature * 10]}
                  min={0}
                  max={10}
                  step={1}
                  onValueChange={(val: number[]) =>
                    handleAiPatch({ temperature: val[0] / 10 })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <Label className="text-xs text-white/60 block mb-1.5">
                  系统提示词（可选）
                </Label>
                <Textarea
                  value={aiSettings.systemPrompt}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    handleAiPatch({ systemPrompt: e.target.value })
                  }
                  placeholder="自定义梦角的人设与语气，留空使用默认的温柔知心人设"
                  className="glass-card bg-transparent border-white/10 text-white placeholder-white/30 min-h-[80px] resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-white/40">
                  {aiSaving ? '保存中...' : '自动保存'}
                </span>
                {!aiSaving && saveStatus === 'saved' && (
                  <span className="text-xs text-emerald-300 flex items-center gap-1">
                    <Check size={12} /> 已保存
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

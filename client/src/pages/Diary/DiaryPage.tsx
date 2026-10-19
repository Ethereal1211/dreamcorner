import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  BookOpen,
  Plus,
  Send,
  ChevronDown,
  ChevronUp,
  Trash2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { logger } from '@client/src/api';
import { diary } from '@client/src/api';
import type { DiaryEntry } from '@shared/api.interface';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { Switch } from '@client/src/components/ui/switch';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { Badge } from '@client/src/components/ui/badge';
import { useSettings } from '@client/src/contexts/SettingsContext';

const MOOD_OPTIONS = [
  { key: 'happy', label: '开心', emoji: '😊' },
  { key: 'calm', label: '平静', emoji: '😌' },
  { key: 'sad', label: '难过', emoji: '😢' },
  { key: 'anxious', label: '焦虑', emoji: '😰' },
  { key: 'angry', label: '生气', emoji: '😠' },
  { key: 'excited', label: '期待', emoji: '✨' },
  { key: 'tired', label: '疲惫', emoji: '😴' },
  { key: 'missing', label: '思念', emoji: '💭' },
];

const getMoodInfo = (moodKey: string) => {
  return MOOD_OPTIONS.find((m) => m.key === moodKey) ?? {
    label: moodKey,
    emoji: '🌙',
  };
};

const DiaryPage = () => {
  const { theme, dreamRoleName, dreamRoleAvatar, dreamRoleAvatarColor } =
    useSettings();

  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // 表单状态
  const [formDate, setFormDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [formMood, setFormMood] = useState('calm');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formIsDream, setFormIsDream] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await diary.getDiaryList(1, 20);
      setEntries(res.items);
    } catch (err) {
      logger.error('加载日记失败', err);
      toast.error('加载日记列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const resetForm = () => {
    const today = new Date();
    setFormDate(today.toISOString().split('T')[0]);
    setFormMood('calm');
    setFormTitle('');
    setFormContent('');
    setFormIsDream(true);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim()) {
      toast.error('请输入日记标题');
      return;
    }
    if (!formContent.trim()) {
      toast.error('请输入日记内容');
      return;
    }

    setSubmitting(true);
    try {
      await diary.createDiary({
        title: formTitle.trim(),
        content: formContent.trim(),
        mood: formMood,
        entryDate: formDate,
        isDream: formIsDream,
      });
      toast.success('日记已保存');
      resetForm();
      setShowEditor(false);
      loadEntries();
    } catch (err) {
      logger.error('保存日记失败', err);
      toast.error('保存日记失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await diary.deleteDiary(id);
      toast.success('日记已删除');
      setEntries((prev) => prev.filter((e) => e.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      logger.error('删除日记失败', err);
      toast.error('删除失败');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${year}年${month}月${day}日 ${weekdays[d.getDay()]}`;
  };

  const formatShortDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${month}/${day}`;
  };

  return (
    <div
      className="relative min-h-full w-full overflow-hidden"
      style={{ background: theme.gradient }}
    >
      {/* 背景光晕 */}
      <div
        className="glow-orb -top-10 -left-10 size-48"
        style={{ background: theme.orb1 }}
      />
      <div
        className="glow-orb top-1/2 -right-16 size-60"
        style={{ background: theme.orb2 }}
      />
      <div
        className="glow-orb bottom-10 left-5 size-48"
        style={{ background: theme.orb1 }}
      />

      <div className="relative z-10 mx-auto flex h-full max-w-[390px] flex-col px-5 pb-24 pt-6">
        {/* 顶部标题 */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{
                background: theme.gradientText,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {dreamRoleName}日记
            </h1>
            <p className="mt-1 text-xs text-white/50">记录心情，倾听梦角的回应</p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
            <BookOpen className="size-5 text-purple-300" />
          </div>
        </div>

        {/* 日记列表 */}
        <div className="scrollbar-hide flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="glass-card mt-10 rounded-2xl py-12 text-center">
              <BookOpen className="mx-auto mb-3 size-10 text-white/30" />
              <p className="text-sm text-white/40">还没有日记</p>
              <p className="mt-1 text-xs text-white/30">
                点击右下角按钮，写下今天的心情
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => {
                const moodInfo = getMoodInfo(entry.mood);
                const isExpanded = expandedId === entry.id;
                return (
                  <div
                    key={entry.id}
                    className="glass-card rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <button
                      onClick={() => toggleExpand(entry.id)}
                      className="w-full text-left"
                    >
                      {/* 头部：日期 + 心情 */}
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="size-3.5 text-white/40" />
                          <span className="text-xs text-white/50">
                            {formatShortDate(entry.entryDate)}
                          </span>
                          <span className="text-lg leading-none">
                            {moodInfo.emoji}
                          </span>
                          <span className="text-xs text-white/50">
                            {moodInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {entry.dreamRoleMessage && (
                              <Badge
                                variant="outline"
                                className="border-purple-400/40 text-[10px] text-purple-300"
                              >
                                <Sparkles className="mr-1 size-3" />
                                {dreamRoleName}回信
                              </Badge>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="size-4 text-white/40" />
                          ) : (
                            <ChevronDown className="size-4 text-white/40" />
                          )}
                        </div>
                      </div>

                      {/* 标题 */}
                      <h3 className="mb-1 truncate text-sm font-semibold text-white">
                        {entry.title}
                      </h3>

                      {/* 摘要 */}
                      {!isExpanded && (
                        <p className="line-clamp-2 text-xs leading-relaxed text-white/50">
                          {entry.content}
                        </p>
                      )}
                    </button>

                    {/* 展开详情 */}
                    {isExpanded && (
                      <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="border-t border-white/10 pt-3">
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/70">
                            {entry.content}
                          </p>

                          {/* 梦角回信 */}
                          {entry.dreamRoleMessage && (
                            <div className="relative mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 p-4">
                              {/* 左侧紫色竖线 */}
                              <div className="absolute left-0 top-0 h-full w-1 rounded-full bg-gradient-to-b from-violet-400 to-pink-400" />
                                <div className="mb-2 flex items-center gap-2">
                                  <div
                                    className={`flex size-6 items-center justify-center text-xs font-bold rounded-full bg-gradient-to-br ${dreamRoleAvatarColor}`}
                                  >
                                    {dreamRoleAvatar}
                                  </div>
                                  <span
                                    className="text-xs font-semibold"
                                    style={{
                                      background: theme.gradientText,
                                      WebkitBackgroundClip: 'text',
                                      WebkitTextFillColor: 'transparent',
                                      backgroundClip: 'text',
                                    }}
                                  >
                                    {dreamRoleName}的回信
                                  </span>
                                </div>
                              <p className="text-sm leading-relaxed text-white/80">
                                {entry.dreamRoleMessage}
                              </p>
                            </div>
                          )}

                          {/* 删除按钮 */}
                          <div className="mt-3 flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(entry.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="size-3.5" />
                              删除
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 浮动 + 按钮 */}
        <button
          onClick={() => {
            resetForm();
            setShowEditor(true);
          }}
          className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white shadow-[0_4px_20px_rgba(168_85_247_0.5)] transition-all hover:scale-105 active:scale-95"
          aria-label="写日记"
        >
          <Plus className="size-6" />
        </button>
      </div>

      {/* 写日记弹窗 */}
      {showEditor && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowEditor(false)}
        >
          <div
            className="glass-card-strong w-full max-w-[390px] rounded-t-3xl p-5 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 拖拽条 */}
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

            <h2 className="mb-4 text-center text-lg font-bold text-white">
              写日记
            </h2>

            {/* 日期选择 */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs text-white/60">日期</label>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="border-white/10 bg-white/5 text-white focus:border-purple-400"
              />
            </div>

            {/* 心情选择 */}
            <div className="mb-4">
              <label className="mb-2 block text-xs text-white/60">心情</label>
              <div className="flex flex-wrap gap-2">
                {MOOD_OPTIONS.map((mood) => (
                  <button
                    key={mood.key}
                    onClick={() => setFormMood(mood.key)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all ${
                      formMood === mood.key
                        ? 'border-purple-400/50 bg-purple-500/20 text-white shadow-[0_0_15px_rgba(168_85_247_0.3)]'
                        : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-base leading-none">{mood.emoji}</span>
                    <span>{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 标题 */}
            <div className="mb-3">
              <label className="mb-1.5 block text-xs text-white/60">标题</label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="今天的标题..."
                className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-purple-400"
              />
            </div>

            {/* 内容 */}
            <div className="mb-3">
              <label className="mb-1.5 block text-xs text-white/60">内容</label>
              <Textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="写下今天的心情和故事..."
                className="h-32 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-purple-400"
              />
            </div>

            {/* 梦角日记开关 */}
            <div className="mb-5 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-purple-300" />
                <div>
                  <p className="text-xs font-medium text-white">
                    {dreamRoleName}日记
                  </p>
                  <p className="text-[10px] text-white/40">
                    开启后会收到{dreamRoleName}的回信
                  </p>
                </div>
              </div>
              <Switch
                checked={formIsDream}
                onCheckedChange={setFormIsDream}
              />
            </div>

            {/* 提交按钮 */}
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-[0_4px_20px_rgba(168_85_247_0.5)] hover:opacity-90"
            >
              {submitting ? (
                <>保存中...</>
              ) : (
                <>
                  <Send className="size-4" />
                  保存日记
                </>
              )}
            </Button>

            {/* 取消按钮 */}
            <button
              onClick={() => setShowEditor(false)}
              className="mt-2 w-full py-2 text-xs text-white/40 hover:text-white/60"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiaryPage;

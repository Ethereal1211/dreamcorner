import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Droplets,
  Heart,
  Clock,
  Settings,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { schedule, period, logger } from '@/api';
import type {
  Schedule as ScheduleType,
  PeriodRecord,
  PeriodPrediction,
} from '@shared/api.interface';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: '工作', label: '工作', color: 'bg-blue-400/20 text-blue-300' },
  { value: '生活', label: '生活', color: 'bg-green-400/20 text-green-300' },
  { value: '健康', label: '健康', color: 'bg-pink-400/20 text-pink-300' },
  { value: '其他', label: '其他', color: 'bg-violet-400/20 text-violet-300' },
];

function getCategoryColor(category: string): string {
  const found = CATEGORIES.find((c) => c.value === category);
  return found?.color ?? 'bg-violet-400/20 text-violet-300';
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function CalendarView({
  currentMonth,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  markedDates,
}: {
  currentMonth: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  markedDates: Set<string>;
}) {
  const weeks = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const firstWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result: Date[][] = [];
    let week: Date[] = [];
    for (let i = 0; i < firstWeekday; i++) {
      week.push(new Date(year, month, -firstWeekday + i + 1));
    }
    for (let d = 1; d <= daysInMonth; d++) {
      week.push(new Date(year, month, d));
      if (week.length === 7) {
        result.push(week);
        week = [];
      }
    }
    if (week.length > 0) {
      let next = 1;
      while (week.length < 7) {
        week.push(new Date(year, month + 1, next++));
      }
      result.push(week);
    }
    return result;
  }, [currentMonth]);

  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrevMonth}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 transition-colors"
          aria-label="上个月"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-white font-medium">
          {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
        </span>
        <button
          onClick={onNextMonth}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 transition-colors"
          aria-label="下个月"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {weekdays.map((w) => (
          <div key={w} className="text-xs text-white/40 py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((date, idx) => {
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
          const dateStr = formatDate(date);
          const isSelected =
            formatDate(selectedDate) === dateStr && isCurrentMonth;
          const hasSchedule = markedDates.has(dateStr);
          const isToday = formatDate(new Date()) === dateStr;

          return (
            <button
              key={idx}
              onClick={() => isCurrentMonth && onSelectDate(date)}
              disabled={!isCurrentMonth}
              className={cn(
                'relative h-9 rounded-lg text-sm flex items-center justify-center transition-all',
                isCurrentMonth
                  ? 'text-white hover:bg-white/10'
                  : 'text-white/20 cursor-default',
                isSelected &&
                  'bg-gradient-to-r from-violet-400 to-pink-400 text-white font-medium',
                isToday && !isSelected && 'ring-1 ring-violet-400/50',
              )}
            >
              {date.getDate()}
              {hasSchedule && isCurrentMonth && (
                <span
                  className={cn(
                    'absolute bottom-1 w-1 h-1 rounded-full',
                    isSelected ? 'bg-white' : 'bg-violet-400',
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScheduleItem({
  item,
  onToggle,
  onDelete,
}: {
  item: ScheduleType;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        'glass-card rounded-xl p-3 flex items-start gap-3 transition-all',
        item.isDone && 'opacity-50',
      )}
    >
      <Checkbox
        checked={item.isDone}
        onCheckedChange={(checked) => onToggle(item.id, Boolean(checked))}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              'text-sm font-medium text-white',
              item.isDone && 'line-through',
            )}
          >
            {item.title}
          </span>
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.5 rounded-md font-medium',
              getCategoryColor(item.category || '其他'),
            )}
          >
            {item.category || '其他'}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-1 text-xs text-white/50">
          <Clock className="w-3 h-3" />
          {item.scheduleTime}
        </div>
        {item.description && (
          <p
            className={cn(
              'text-xs text-white/60 mt-2 break-words',
              item.isDone && 'line-through',
            )}
          >
            {item.description}
          </p>
        )}
      </div>
      <button
        onClick={() => onDelete(item.id)}
        className="p-1.5 text-white/40 hover:text-red-400 transition-colors"
        aria-label="删除"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function PeriodRing({ days, total }: { days: number; total: number }) {
  const progress = Math.min(1, Math.max(0, 1 - days / total));
  const size = 160;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#periodGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <defs>
          <linearGradient id="periodGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(280 80% 75%)" />
            <stop offset="100%" stopColor="hsl(320 75% 72%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-gradient">{days}</span>
        <span className="text-xs text-white/60 mt-1">天后到来</span>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'period'>('schedule');

  // Schedule state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedules, setSchedules] = useState<ScheduleType[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [allMonthSchedules, setAllMonthSchedules] = useState<ScheduleType[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [newCategory, setNewCategory] = useState('生活');
  const [newDesc, setNewDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Period state
  const [records, setRecords] = useState<PeriodRecord[]>([]);
  const [prediction, setPrediction] = useState<PeriodPrediction | null>(null);
  const [periodLoading, setPeriodLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [cycleLen, setCycleLen] = useState(28);
  const [periodLen, setPeriodLen] = useState(5);

  const markedDates = useMemo(() => {
    const set = new Set<string>();
    allMonthSchedules.forEach((s) => {
      if (s.scheduleDate) set.add(s.scheduleDate);
    });
    return set;
  }, [allMonthSchedules]);

  const fetchSchedules = useCallback(async (date: Date) => {
    try {
      setSchedulesLoading(true);
      const dateStr = formatDate(date);
      const result = await schedule.getSchedules(dateStr);
      setSchedules(result.items || []);
    } catch (err) {
      logger.error('获取日程失败', err);
    } finally {
      setSchedulesLoading(false);
    }
  }, []);

  const fetchMonthSchedules = useCallback(async (month: Date) => {
    try {
      const year = month.getFullYear();
      const m = month.getMonth();
      const start = formatDate(new Date(year, m, 1));
      const end = formatDate(new Date(year, m + 1, 0));
      // 为了标记有日程的日期，获取整个月范围的
      const result = await schedule.getSchedules();
      const all = result.items || [];
      const inMonth = all.filter(
        (s) => s.scheduleDate >= start && s.scheduleDate <= end,
      );
      setAllMonthSchedules(inMonth);
    } catch (err) {
      logger.error('获取月度日程失败', err);
    }
  }, []);

  const fetchPeriodData = useCallback(async () => {
    try {
      setPeriodLoading(true);
      const [recordsRes, predRes] = await Promise.all([
        period.getRecords(),
        period.getPrediction(),
      ]);
      setRecords(recordsRes.items || []);
      setPrediction(predRes);
    } catch (err) {
      logger.error('获取经期数据失败', err);
    } finally {
      setPeriodLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'schedule') {
      void fetchSchedules(selectedDate);
      void fetchMonthSchedules(currentMonth);
    } else {
      void fetchPeriodData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    void fetchSchedules(date);
  };

  const handlePrevMonth = () => {
    const next = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      1,
    );
    setCurrentMonth(next);
    void fetchMonthSchedules(next);
  };

  const handleNextMonth = () => {
    const next = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      1,
    );
    setCurrentMonth(next);
    void fetchMonthSchedules(next);
  };

  const handleToggleSchedule = async (id: string, done: boolean) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isDone: done } : s)),
    );
    try {
      await schedule.updateSchedule(id, { isDone: done });
    } catch (err) {
      logger.error('更新日程失败', err);
      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isDone: !done } : s)),
      );
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    try {
      await schedule.deleteSchedule(id);
      void fetchMonthSchedules(currentMonth);
    } catch (err) {
      logger.error('删除日程失败', err);
    }
  };

  const handleAddSchedule = async () => {
    if (!newTitle.trim()) return;
    try {
      setSubmitting(true);
      const result = await schedule.createSchedule({
        title: newTitle.trim(),
        scheduleDate: formatDate(selectedDate),
        scheduleTime: newTime,
        category: newCategory,
        description: newDesc.trim() || '',
      });
      setSchedules((prev) =>
        [...prev, result].sort((a, b) =>
          a.scheduleTime.localeCompare(b.scheduleTime),
        ),
      );
      setAllMonthSchedules((prev) => [...prev, result]);
      setNewTitle('');
      setNewDesc('');
      setNewTime('09:00');
      setNewCategory('生活');
      setShowAddDialog(false);
    } catch (err) {
      logger.error('创建日程失败', err);
    } finally {
      setSubmitting(false);
    }
  };

  const activeRecord = records.find((r) => r.startDate && !r.endDate);

  const handleRecordStart = async () => {
    try {
      const today = formatDate(new Date());
      const result = await period.createRecord({
        startDate: today,
        cycleLength: cycleLen,
        periodLength: periodLen,
        notes: '',
        symptoms: [],
      });
      setRecords((prev) => [result, ...prev]);
      void fetchPeriodData();
    } catch (err) {
      logger.error('记录经期开始失败', err);
    }
  };

  const handleRecordEnd = async () => {
    if (!activeRecord) return;
    try {
      const today = formatDate(new Date());
      const result = await period.updateRecord(activeRecord.id, {
        endDate: today,
      });
      setRecords((prev) =>
        prev.map((r) => (r.id === activeRecord.id ? result : r)),
      );
      void fetchPeriodData();
    } catch (err) {
      logger.error('记录经期结束失败', err);
    }
  };

  const phaseLabel: Record<string, { label: string; color: string }> = {
    经期: { label: '经期', color: 'text-pink-300' },
    卵泡期: { label: '卵泡期', color: 'text-violet-300' },
    排卵期: { label: '排卵期', color: 'text-fuchsia-300' },
    黄体期: { label: '黄体期', color: 'text-amber-300' },
  };

  const currentPhaseInfo =
    prediction?.currentPhase && phaseLabel[prediction.currentPhase]
      ? phaseLabel[prediction.currentPhase]
      : { label: prediction?.currentPhase || '—', color: 'text-white/70' };

  const daySchedules = useMemo(() => {
    return [...schedules].sort((a, b) =>
      a.scheduleTime.localeCompare(b.scheduleTime),
    );
  }, [schedules]);

  return (
    <div className="h-full flex flex-col bg-dream-gradient relative overflow-hidden">
      <div className="glow-orb w-64 h-64 bg-violet-500 top-0 -left-20" />
      <div className="glow-orb w-48 h-48 bg-pink-500 bottom-20 right-0" />

      <div className="relative z-10 px-5 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-gradient">日程与提醒</h1>
        <p className="text-xs text-white/50 mt-1">
          规划每一天，遇见更好的自己 ✨
        </p>
      </div>

      <div className="relative z-10 px-5 pb-2">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'schedule' | 'period')}
          className="w-full"
        >
          <TabsList className="w-full glass-card bg-white/5 border border-white/10 h-10 p-1 rounded-xl">
            <TabsTrigger
              value="schedule"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-400/80 data-[state=active]:to-pink-400/80 data-[state=active]:text-white rounded-lg h-8"
            >
              <Calendar className="w-3.5 h-3.5 mr-1" />
              日程
            </TabsTrigger>
            <TabsTrigger
              value="period"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-400/80 data-[state=active]:to-pink-400/80 data-[state=active]:text-white rounded-lg h-8"
            >
              <Heart className="w-3.5 h-3.5 mr-1" />
              经期
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="flex-1 flex flex-col min-h-0 relative z-10">
          <div className="px-5 pb-3">
            <CalendarView
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              markedDates={markedDates}
            />
          </div>

          <div className="px-5 flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-white/90 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-300" />
              {formatDate(selectedDate)} 的日程
            </h3>
            <span className="text-xs text-white/40">
              共 {daySchedules.length} 项
            </span>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-24 space-y-2">
            {schedulesLoading && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="glass-card rounded-xl p-3 flex items-center gap-3"
                  >
                    <Skeleton className="w-4 h-4 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!schedulesLoading && daySchedules.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full glass-card-strong flex items-center justify-center mb-3">
                  <Calendar className="w-8 h-8 text-violet-300" />
                </div>
                <p className="text-sm text-white/60">
                  今天还没有日程安排
                </p>
                <p className="text-xs text-white/40 mt-1">
                  点击右下角 + 添加
                </p>
              </div>
            )}

            {!schedulesLoading &&
              daySchedules.map((s) => (
                <ScheduleItem
                  key={s.id}
                  item={s}
                  onToggle={handleToggleSchedule}
                  onDelete={handleDeleteSchedule}
                />
              ))}
          </div>

          {/* FAB */}
          <button
            onClick={() => setShowAddDialog(true)}
            className="absolute bottom-6 right-6 z-20 w-14 h-14 rounded-full bg-gradient-to-r from-violet-400 to-pink-400 text-white shadow-lg shadow-violet-500/30 flex items-center justify-center hover:scale-105 transition-transform"
            aria-label="添加日程"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Period Tab */}
      {activeTab === 'period' && (
        <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-24 relative z-10 space-y-4">
          {periodLoading ? (
            <div className="space-y-4 pt-4">
              <Skeleton className="h-56 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          ) : (
            <>
              {/* 预测卡片 */}
              <div className="glass-card-strong rounded-3xl p-6 relative overflow-hidden">
                <div className="glow-orb w-32 h-32 bg-pink-400/40 -top-8 -right-8" />
                <div className="relative z-10 flex flex-col items-center">
                  <span
                    className={cn(
                      'text-sm font-medium mb-2',
                      currentPhaseInfo.color,
                    )}
                  >
                    当前阶段：{currentPhaseInfo.label}
                  </span>
                  <PeriodRing
                    days={prediction?.daysUntilNext ?? 0}
                    total={cycleLen}
                  />
                  <div className="grid grid-cols-3 gap-3 w-full mt-6">
                    <div className="text-center">
                      <div className="text-[10px] text-white/50">下次经期</div>
                      <div className="text-xs text-white/80 mt-0.5">
                        {prediction?.nextStartDate
                          ? prediction.nextStartDate.slice(5)
                          : '—'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-white/50">排卵日</div>
                      <div className="text-xs text-white/80 mt-0.5">
                        {prediction?.ovulationDate
                          ? prediction.ovulationDate.slice(5)
                          : '—'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-white/50">易孕期</div>
                      <div className="text-xs text-white/80 mt-0.5">
                        {prediction?.fertileStart && prediction.fertileEnd
                          ? `${prediction.fertileStart.slice(5)}-${prediction.fertileEnd.slice(5)}`
                          : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 记录按钮 */}
              <div className="glass-card rounded-2xl p-4">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-pink-300" />
                  记录经期
                </h3>
                {activeRecord ? (
                  <div className="space-y-3">
                    <div className="text-xs text-white/60">
                      本次经期从 {activeRecord.startDate} 开始
                    </div>
                    <Button
                      onClick={handleRecordEnd}
                      className="w-full bg-gradient-to-r from-pink-400 to-rose-400 text-white border-0 hover:opacity-90"
                    >
                      记录本次经期结束
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleRecordStart}
                    className="w-full bg-gradient-to-r from-pink-400 to-rose-400 text-white border-0 hover:opacity-90"
                  >
                    记录本次经期开始
                  </Button>
                )}
              </div>

              {/* 设置 */}
              <div className="glass-card rounded-2xl p-4">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="w-full flex items-center justify-between"
                >
                  <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <Settings className="w-4 h-4 text-violet-300" />
                    周期设置
                  </h3>
                  <ChevronRight
                    className={cn(
                      'w-4 h-4 text-white/50 transition-transform',
                      showSettings && 'rotate-90',
                    )}
                  />
                </button>
                {showSettings && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-white/70">
                        周期长度（天）
                      </Label>
                      <Input
                        type="number"
                        value={cycleLen}
                        onChange={(e) =>
                          setCycleLen(Math.max(20, Math.min(45, Number(e.target.value) || 28)))
                        }
                        className="w-20 h-8 text-center text-white/90 bg-white/5 border-white/10 text-sm"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-white/70">
                        经期长度（天）
                      </Label>
                      <Input
                        type="number"
                        value={periodLen}
                        onChange={(e) =>
                          setPeriodLen(Math.max(2, Math.min(10, Number(e.target.value) || 5)))
                        }
                        className="w-20 h-8 text-center text-white/90 bg-white/5 border-white/10 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 历史记录 */}
              <div className="glass-card rounded-2xl p-4">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-violet-300" />
                  历史记录
                </h3>
                {records.length === 0 ? (
                  <p className="text-xs text-white/50 text-center py-4">
                    暂无记录
                  </p>
                ) : (
                  <div className="space-y-2">
                    {records.slice(0, 5).map((r) => {
                      const start = new Date(r.startDate);
                      const end = r.endDate ? new Date(r.endDate) : null;
                      const duration = end
                        ? Math.ceil(
                            (end.getTime() - start.getTime()) / 86400000 + 1,
                          )
                        : null;
                      return (
                        <div
                          key={r.id}
                          className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                        >
                          <div>
                            <div className="text-sm text-white/80">
                              {r.startDate.slice(5)}
                              {r.endDate ? ` - ${r.endDate.slice(5)}` : ' ~'}
                            </div>
                            <div className="text-[11px] text-white/50 mt-0.5">
                              {duration ? `持续 ${duration} 天` : '进行中'}
                              {r.cycleLength ? ` · 周期 ${r.cycleLength} 天` : ''}
                            </div>
                          </div>
                          {r.symptoms && r.symptoms.length > 0 && (
                            <div className="flex gap-1">
                              {r.symptoms.slice(0, 2).map((sym) => (
                                <span
                                  key={sym}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-pink-400/20 text-pink-300"
                                >
                                  {sym}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Add Schedule Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-popover/95 backdrop-blur-xl border-white/10 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-gradient text-lg">
              添加日程
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-white/70">标题</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="日程标题"
                className="text-white/90 bg-white/5 border-white/10"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-white/70">日期</Label>
                <div className="h-9 px-3 rounded-md border border-white/10 bg-white/5 flex items-center text-sm text-white/80">
                  {formatDate(selectedDate)}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-white/70">时间</Label>
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="text-white/90 bg-white/5 border-white/10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-white/70">分类</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger className="w-full text-white/90 bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-white/70">描述（可选）</Label>
              <Textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="添加描述..."
                className="min-h-[60px] text-white/90 bg-white/5 border-white/10 text-sm resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowAddDialog(false)}
              className="text-white/70 hover:text-white"
            >
              取消
            </Button>
            <Button
              onClick={handleAddSchedule}
              disabled={!newTitle.trim() || submitting}
              className="bg-gradient-to-r from-violet-400 to-pink-400 text-white border-0 hover:opacity-90"
            >
              {submitting ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

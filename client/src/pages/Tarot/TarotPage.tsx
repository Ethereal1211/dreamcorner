import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Sparkles,
  BookOpen,
  Heart,
  Briefcase,
  Coins,
  Star,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { logger } from '@client/src/api';
import { tarot } from '@client/src/api';
import type { TarotDrawRecord, TarotDrawResponse } from '@shared/api.interface';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { useSettings } from '@client/src/contexts/SettingsContext';

interface TarotContext {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const CONTEXTS: TarotContext[] = [
  { key: 'daily', label: '今日运势', icon: <Sparkles className="size-4" /> },
  { key: 'love', label: '感情', icon: <Heart className="size-4" /> },
  { key: 'career', label: '事业', icon: <Briefcase className="size-4" /> },
  { key: 'wealth', label: '财运', icon: <Coins className="size-4" /> },
  { key: 'general', label: '综合', icon: <Star className="size-4" /> },
];

const TarotPage = () => {
  const [context, setContext] = useState<string>('daily');
  const [drawnCard, setDrawnCard] = useState<TarotDrawResponse | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [history, setHistory] = useState<TarotDrawRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { theme, dreamRoleName, dreamRoleAvatar, dreamRoleAvatarColor } =
    useSettings();

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await tarot.getDraws(1, 10);
      setHistory(res.items);
    } catch (err) {
      logger.error('加载抽牌历史失败', err);
      toast.error('加载历史记录失败');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDraw = async () => {
    if (isDrawing) return;
    setIsDrawing(true);
    setIsFlipped(false);
    setDrawnCard(null);

    try {
      const result = await tarot.drawCard(context);
      setDrawnCard(result);
      // 翻牌动画延迟
      setTimeout(() => {
        setIsFlipped(true);
      }, 100);
      // 刷新历史
      setTimeout(() => {
        loadHistory();
      }, 500);
    } catch (err) {
      logger.error('抽牌失败', err);
      toast.error('抽牌失败，请稍后再试');
    } finally {
      setTimeout(() => setIsDrawing(false), 800);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hours}:${minutes}`;
  };

  return (
    <div
      className="relative min-h-full w-full overflow-hidden"
      style={{ background: theme.gradient }}
    >
      {/* 背景光晕 */}
      <div
        className="glow-orb -top-20 -left-20 size-60"
        style={{ background: theme.orb1 }}
      />
      <div
        className="glow-orb top-1/3 -right-20 size-72"
        style={{ background: theme.orb2 }}
      />
      <div
        className="glow-orb bottom-20 left-10 size-56"
        style={{ background: theme.orb1 }}
      />

      <div className="relative z-10 mx-auto flex h-full max-w-[390px] flex-col px-5 pb-8 pt-6">
        {/* 顶部标题 */}
        <div className="mb-5 text-center">
          <h1
            className="text-2xl font-bold"
            style={{
              background: theme.gradientText,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            塔罗占卜
          </h1>
          <p className="mt-1 text-xs text-white/50">让梦角为你解读命运的指引</p>
        </div>

        {/* 场景选择 */}
        <div className="scrollbar-hide mb-6 flex gap-2 overflow-x-auto pb-1">
          {CONTEXTS.map((ctx) => (
            <button
              key={ctx.key}
             onClick={() => setContext(ctx.key)}
               style={
                 context === ctx.key
                   ? {
                       borderColor: theme.primary + '66',
                       background: theme.primary + '33',
                       boxShadow: `0 0 20px ${theme.primary}4d`,
                     }
                   : undefined
               }
               className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs transition-all ${
                 context === ctx.key
                   ? 'text-white'
                   : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
               }`}
             >
              {ctx.icon}
              <span>{ctx.label}</span>
            </button>
          ))}
        </div>

        {/* 抽牌区 */}
        <div className="mb-6 flex flex-col items-center">
          {/* 牌 */}
          <div className="relative mb-5 h-56 w-40" style={{ perspective: '1000px' }}>
            {isDrawing || drawnCard ? (
              <div
                className="relative h-full w-full transition-transform duration-700"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* 牌背 */}
                <div
                  className="absolute inset-0 rounded-2xl border-2 border-amber-400/60 bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 shadow-[0_0_30px_rgba(139_92_246_0.4)]"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="relative">
                      <Star className="size-10 text-amber-300/80" />
                      <Star className="absolute -top-2 -right-2 size-4 text-amber-200/60" />
                      <Star className="absolute -bottom-1 -left-3 size-3 text-amber-200/50" />
                    </div>
                  </div>
                  {/* 装饰边框 */}
                  <div className="absolute inset-2 rounded-xl border border-amber-400/30" />
                </div>
                {/* 牌面 */}
                <div
                  className="absolute inset-0 rounded-2xl border-2 border-amber-400/60 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 shadow-[0_0_30px_rgba(251_191_36_0.3)]"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  {drawnCard && (
                    <div
                      className={`flex h-full w-full flex-col items-center justify-between p-4 ${
                        drawnCard.isReversed ? 'rotate-180' : ''
                      }`}
                    >
                      <div className="text-center">
                        <p className="text-[10px] font-semibold text-purple-800/70">
                          {drawnCard.card.number.toString().padStart(2, '0')} ·{' '}
                          {drawnCard.card.suit}
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="mb-2 flex justify-center">
                          <Sparkles className="size-8 text-purple-600" />
                        </div>
                        <h3 className="text-base font-bold text-purple-900">
                          {drawnCard.card.name}
                        </h3>
                        <p className="mt-1 text-[10px] text-purple-700/70">
                          {drawnCard.isReversed ? '逆位' : '正位'}
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-1">
                        {drawnCard.card.keywords.slice(0, 3).map((kw: string) => (
                          <span
                            key={kw}
                            className="rounded-full bg-purple-200/60 px-2 py-0.5 text-[9px] text-purple-800"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* 初始牌堆 */
              <div className="relative h-full w-full">
                <div className="absolute left-1 top-1 h-full w-full rounded-2xl border-2 border-amber-400/40 bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 opacity-50" />
                <div className="absolute left-0.5 top-0.5 h-full w-full rounded-2xl border-2 border-amber-400/50 bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 opacity-70" />
                <div className="absolute left-0 top-0 h-full w-full rounded-2xl border-2 border-amber-400/60 bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 shadow-[0_0_30px_rgba(139_92_246_0.4)]">
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="relative">
                      <Star className="size-12 text-amber-300/80" />
                      <Star className="absolute -top-2 -right-2 size-5 text-amber-200/60" />
                      <Star className="absolute -bottom-1 -left-3 size-4 text-amber-200/50" />
                    </div>
                  </div>
                  <div className="absolute inset-2 rounded-xl border border-amber-400/30" />
                </div>
              </div>
            )}
          </div>

          {/* 抽牌按钮 */}
          <Button
            onClick={handleDraw}
            disabled={isDrawing}
            className="rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-8 text-white shadow-[0_4px_20px_rgba(168_85_247_0.5)] hover:opacity-90"
          >
            {isDrawing ? (
              <>
                <RotateCcw className="size-4 animate-spin" />
                抽取中...
              </>
            ) : drawnCard ? (
              <>
                <Sparkles className="size-4" />
                再抽一张
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                点击抽一张牌
              </>
            )}
          </Button>
        </div>

        {/* 牌意解读 + 梦角消息（抽到牌后显示） */}
        {drawnCard && isFlipped && (
          <div className="mb-6 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 牌意解读 */}
            <div className="glass-card rounded-2xl p-4">
              <div className="mb-2 flex items-center gap-2">
                <BookOpen className="size-4 text-purple-300" />
                <span className="text-sm font-semibold text-white">
                  牌意解读
                </span>
                <Badge
                  variant="outline"
                  className={`ml-auto text-[10px] ${
                    drawnCard.isReversed
                      ? 'border-pink-400/40 text-pink-300'
                      : 'border-purple-400/40 text-purple-300'
                  }`}
                >
                  {drawnCard.isReversed ? '逆位' : '正位'}
                </Badge>
              </div>
              <p className="text-sm leading-relaxed text-white/70">
                {drawnCard.isReversed
                  ? drawnCard.card.reversedMeaning
                  : drawnCard.card.meaning}
              </p>
            </div>

            {/* 梦角消息 */}
            <div className="relative glass-card rounded-2xl p-4">
              <div className="absolute -top-1 -left-1 h-10 w-10 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 opacity-50 blur-xl" />
              <div className="relative">
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
                     {dreamRoleName}想说...
                   </span>
                 </div>
                <p className="text-sm leading-relaxed text-white/80">
                  {drawnCard.dreamMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 历史记录 */}
        <div className="flex-1">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="size-4 text-white/50" />
            <h2 className="text-sm font-semibold text-white/80">最近抽牌</h2>
          </div>

          {historyLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="glass-card rounded-2xl py-8 text-center">
              <Star className="mx-auto mb-2 size-8 text-white/30" />
              <p className="text-sm text-white/40">还没有抽牌记录</p>
              <p className="mt-1 text-xs text-white/30">点击上方按钮开始占卜吧</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="glass-card rounded-2xl p-3 transition-all"
                >
                  <button
                    onClick={() => toggleExpand(record.id)}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/40 to-purple-700/40">
                      <Sparkles
                        className={`size-4 ${
                          record.isReversed ? 'text-pink-300' : 'text-amber-200'
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-white">
                          {record.cardName}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${
                            record.isReversed
                              ? 'bg-pink-500/20 text-pink-300'
                              : 'bg-purple-500/20 text-purple-300'
                          }`}
                        >
                          {record.isReversed ? '逆位' : '正位'}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-white/40">
                        {formatDate(record.createdAt)} · {record.context}
                      </p>
                    </div>
                    {expandedId === record.id ? (
                      <ChevronUp className="size-4 text-white/40" />
                    ) : (
                      <ChevronDown className="size-4 text-white/40" />
                    )}
                  </button>
                  {expandedId === record.id && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="border-t border-white/10 pt-3">
                        <p className="text-xs leading-relaxed text-white/60">
                          {record.message}
                        </p>
                        {record.dreamMessage && (
                           <div className="mt-2 rounded-xl bg-purple-500/10 p-2">
                             <p className="text-[11px] font-medium text-purple-300">
                               💫 {dreamRoleName}说
                             </p>
                            <p className="mt-1 text-xs text-white/70">
                              {record.dreamMessage}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TarotPage;

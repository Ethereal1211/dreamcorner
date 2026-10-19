import { useState, useEffect, useCallback } from 'react';
import {
  Heart,
  ImagePlus,
  Send,
  Sparkles,
  User,
  X,
  MessageCircle,
} from 'lucide-react';
import { moments, logger } from '@/api';
import type { Moment } from '@shared/api.interface';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Image } from '@client/src/components/ui/image';
import { useSettings } from '@client/src/contexts/SettingsContext';

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
}

function ImageGrid({ images }: { images: string[] }) {
  const displayImages = images.slice(0, 4);
  const gridClass =
    displayImages.length === 1
      ? 'grid-cols-1'
      : displayImages.length === 2
        ? 'grid-cols-2'
        : 'grid-cols-2';

  return (
    <div className={cn('grid gap-2 mt-3', gridClass)}>
      {displayImages.map((img: string, idx: number) => (
        <div
          key={idx}
          className={cn(
            'aspect-square rounded-xl overflow-hidden bg-gradient-to-br',
            displayImages.length === 1
              ? 'from-violet-400/30 to-pink-400/30'
              : idx % 3 === 0
                ? 'from-violet-400/30 to-fuchsia-400/30'
                : idx % 3 === 1
                  ? 'from-pink-400/30 to-rose-400/30'
                  : 'from-indigo-400/30 to-violet-400/30',
          )}
        >
          <Image
            src={img}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ))}
    </div>
  );
}

function MomentCard({
  moment,
  onLike,
  dreamRoleName,
  dreamRoleAvatar,
  dreamRoleAvatarColor,
  userAvatar,
  userAvatarColor,
  theme,
}: {
  moment: Moment;
  onLike: (id: string) => void;
  dreamRoleName: string;
  dreamRoleAvatar: string;
  dreamRoleAvatarColor: string;
  userAvatar: string;
  userAvatarColor: string;
  theme: { primary: string; accent: string; gradientText: string; navGlow: string; navFilter: string };
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(moment.likes);

  const handleLike = () => {
    if (liked) return;
    setLiked(true);
    setLikeCount((c) => c + 1);
    onLike(moment.id);
  };

  const displayName = moment.isFromDream ? dreamRoleName : '我';
  const avatarText = moment.isFromDream ? dreamRoleAvatar : userAvatar;
  const avatarColor = moment.isFromDream ? dreamRoleAvatarColor : userAvatarColor;

  return (
    <div
      className={cn(
        'glass-card rounded-2xl p-4 transition-all duration-300',
        moment.isFromDream &&
          'ring-2 ring-violet-400/50 shadow-lg shadow-violet-500/10',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold shrink-0',
            avatarColor,
          )}
        >
          {avatarText}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white">
              {displayName}
            </span>
            {moment.isFromDream && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-400 to-pink-400 text-white font-medium">
                {dreamRoleName}
              </span>
            )}
          </div>
          <div className="text-xs text-white/50 mt-0.5">
            {formatTime(moment.createdAt)}
          </div>
        </div>
      </div>

      {moment.content && (
        <p className="mt-3 text-white/90 text-sm leading-relaxed whitespace-pre-wrap break-words">
          {moment.content}
        </p>
      )}

      {moment.images && moment.images.length > 0 && (
        <ImageGrid images={moment.images} />
      )}

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
        <button
          onClick={handleLike}
          className={cn(
            'flex items-center gap-1.5 text-sm transition-all duration-200',
            liked ? 'text-pink-400' : 'text-white/60 hover:text-pink-400',
          )}
          aria-label={liked ? '已点赞' : '点赞'}
        >
          <Heart
            className={cn('w-4 h-4', liked && 'fill-current')}
          />
          <span>{likeCount}</span>
        </button>
        <button
          className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white/80 transition-colors"
          aria-label="评论"
        >
          <MessageCircle className="w-4 h-4" />
          <span>评论</span>
        </button>
      </div>
    </div>
  );
}

export default function MomentsPage() {
  const [momentList, setMomentList] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const {
    theme,
    dreamRoleName,
    dreamRoleAvatar,
    dreamRoleAvatarColor,
    userAvatar,
    userAvatarColor,
    userName,
  } = useSettings();

  const fetchMoments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await moments.getMoments(1, 20);
      setMomentList(result.items || []);
    } catch (err) {
      logger.error('获取朋友圈失败', err);
      setError('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMoments();
  }, [fetchMoments]);

  const handleLike = async (id: string) => {
    try {
      await moments.likeMoment(id);
    } catch (err) {
      logger.error('点赞失败', err);
    }
  };

  const handleSubmit = async () => {
    if (!newContent.trim()) return;
    try {
      setSubmitting(true);
      const result = await moments.createMoment({
        content: newContent.trim(),
        images: [],
      });
      setMomentList((prev) => [result, ...prev]);
      setNewContent('');
      setShowComposer(false);
    } catch (err) {
      logger.error('发布失败', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden" style={{ background: theme.gradient }}>
      {/* 背景装饰 */}
      <div className="glow-orb w-64 h-64 top-0 -left-20" style={{ background: theme.orb1 }} />
      <div className="glow-orb w-48 h-48 bottom-20 right-0" style={{ background: theme.orb2 }} />

      {/* 头部 */}
      <div className="relative z-10 px-5 pt-6 pb-3">
        <h1 className="text-2xl font-bold" style={{ background: theme.gradientText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{dreamRoleName}朋友圈</h1>
        <p className="text-xs text-white/50 mt-1">
          记录每一个闪亮的瞬间 ✨
        </p>
      </div>

      {/* 发布区 */}
      <div className="relative z-10 px-5 pb-3">
        {!showComposer ? (
          <button
            onClick={() => setShowComposer(true)}
            className="w-full glass-card rounded-2xl p-4 text-left text-white/50 text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            分享此刻的心情...
          </button>
        ) : (
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm text-white/80 font-medium">
                发布朋友圈
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white/60 hover:text-white"
                onClick={() => setShowComposer(false)}
                aria-label="关闭"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <Textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="说点什么吧..."
              className="min-h-[80px] text-white/90 placeholder:text-white/30 bg-white/5 border-white/10 rounded-xl resize-none text-sm"
            />
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white/80 h-8"
                aria-label="添加图片"
              >
                <ImagePlus className="w-4 h-4 mr-1" />
                图片
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!newContent.trim() || submitting}
                className="h-8 bg-gradient-to-r from-violet-400 to-pink-400 text-white border-0 hover:opacity-90"
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                {submitting ? '发布中...' : '发布'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 列表 */}
      <div className="relative z-10 flex-1 overflow-y-auto scrollbar-hide px-5 pb-24 space-y-4">
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full mt-4 rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-8 text-white/60 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && momentList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full glass-card-strong flex items-center justify-center mb-4">
              <Sparkles className="w-10 h-10 text-violet-300" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              还没有动态
            </h3>
            <p className="text-sm text-white/50 max-w-[240px]">
              发布第一条朋友圈，
              <br />
              和梦角一起记录美好时光吧 ✨
            </p>
            <Button
              onClick={() => setShowComposer(true)}
              className="mt-6 bg-gradient-to-r from-violet-400 to-pink-400 text-white border-0 hover:opacity-90"
            >
              发布第一条动态
            </Button>
          </div>
        )}

        {!loading &&
          !error &&
         momentList.map((m) => (
            <MomentCard
              key={m.id}
              moment={m}
              onLike={handleLike}
              dreamRoleName={dreamRoleName}
              dreamRoleAvatar={dreamRoleAvatar}
              dreamRoleAvatarColor={dreamRoleAvatarColor}
              userAvatar={userAvatar}
              userAvatarColor={userAvatarColor}
              theme={theme}
            />
          ))}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Volume2,
  Music2,
  ListMusic,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number; // 秒
  coverGradient: string;
  accentColor: string;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  songs: string[]; // song ids
  gradient: string;
}

const SONGS: Song[] = [
  {
    id: 's1',
    title: '星夜低语',
    artist: '梦角',
    duration: 218,
    coverGradient: 'from-violet-500 via-fuchsia-500 to-pink-500',
    accentColor: 'hsl(280 80% 75%)',
  },
  {
    id: 's2',
    title: '月光漫步',
    artist: 'Dreamy',
    duration: 195,
    coverGradient: 'from-indigo-500 via-violet-500 to-purple-500',
    accentColor: 'hsl(260 80% 75%)',
  },
  {
    id: 's3',
    title: '云朵棉花糖',
    artist: '晚安星球',
    duration: 242,
    coverGradient: 'from-pink-400 via-rose-400 to-red-400',
    accentColor: 'hsl(330 80% 75%)',
  },
  {
    id: 's4',
    title: '深海梦境',
    artist: 'Ocean Blue',
    duration: 276,
    coverGradient: 'from-blue-500 via-indigo-500 to-violet-500',
    accentColor: 'hsl(230 80% 75%)',
  },
  {
    id: 's5',
    title: '樱花落雨',
    artist: '梦角',
    duration: 203,
    coverGradient: 'from-pink-300 via-fuchsia-400 to-violet-500',
    accentColor: 'hsl(300 70% 75%)',
  },
  {
    id: 's6',
    title: '温柔时光',
    artist: '晚安星球',
    duration: 234,
    coverGradient: 'from-amber-400 via-pink-400 to-rose-500',
    accentColor: 'hsl(10 80% 75%)',
  },
  {
    id: 's7',
    title: '银河列车',
    artist: 'Dreamy',
    duration: 267,
    coverGradient: 'from-slate-500 via-violet-500 to-indigo-600',
    accentColor: 'hsl(250 70% 75%)',
  },
  {
    id: 's8',
    title: '晨曦微光',
    artist: '梦角',
    duration: 189,
    coverGradient: 'from-cyan-400 via-violet-400 to-pink-400',
    accentColor: 'hsl(190 80% 75%)',
  },
];

const PLAYLISTS: Playlist[] = [
  {
    id: 'p1',
    name: '深夜治愈',
    description: '陪伴你度过每一个安静的夜晚',
    songs: ['s1', 's4', 's2', 's7'],
    gradient: 'from-indigo-600 via-violet-600 to-fuchsia-600',
  },
  {
    id: 'p2',
    name: '梦境漫游',
    description: '在梦幻旋律中自由漂浮',
    songs: ['s1', 's5', 's8', 's3', 's7'],
    gradient: 'from-violet-500 via-pink-500 to-rose-500',
  },
  {
    id: 'p3',
    name: '温柔时光',
    description: '适合一个人静静聆听',
    songs: ['s3', 's6', 's5', 's8'],
    gradient: 'from-pink-400 via-rose-400 to-amber-400',
  },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function VinylRecord({
  song,
  isPlaying,
}: {
  song: Song;
  isPlaying: boolean;
}) {
  return (
    <div className="relative flex items-center justify-center py-6">
      {/* 光晕 */}
      <div
        className="absolute w-56 h-56 rounded-full blur-3xl opacity-40"
        style={{ backgroundColor: song.accentColor }}
      />
      {/* 唱片 */}
      <div
        className={cn(
          'relative w-52 h-52 rounded-full shadow-2xl',
          isPlaying
            ? 'animate-[spin_8s_linear_infinite]'
            : 'animate-none',
        )}
        style={{
          background: `
            radial-gradient(circle at center, ${song.accentColor} 0%, transparent 25%),
            repeating-radial-gradient(circle, rgba(0,0,0,0.8) 0px, rgba(20,10,30,0.9) 2px, rgba(0,0,0,0.8) 4px)
          `,
        }}
      >
        {/* 中心封面 */}
        <div
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-28 h-28 rounded-full bg-gradient-to-br overflow-hidden',
            song.coverGradient,
          )}
        >
          <div className="w-full h-full flex items-center justify-center">
            <Music2 className="w-12 h-12 text-white/70" />
          </div>
        </div>
        {/* 中心孔 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-black/80 border-2 border-white/20" />
      </div>
    </div>
  );
}

function ProgressBar({
  current,
  total,
  onSeek,
}: {
  current: number;
  total: number;
  onSeek: (val: number) => void;
}) {
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="w-full">
      <div
        className="relative h-1.5 bg-white/10 rounded-full cursor-pointer group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          onSeek(Math.max(0, Math.min(1, ratio)) * total);
        }}
        role="slider"
        aria-label="进度条"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-400 to-pink-400 transition-all"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-[11px] text-white/50">
        <span>{formatTime(current)}</span>
        <span>{formatTime(total)}</span>
      </div>
    </div>
  );
}

function PlaylistCard({
  playlist,
  isActive,
  onClick,
}: {
  playlist: Playlist;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'glass-card rounded-2xl p-4 text-left w-full transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/10',
        isActive && 'ring-2 ring-violet-400/50',
      )}
      aria-label={`歌单 ${playlist.name}`}
    >
      <div
        className={cn(
          'w-full aspect-square rounded-xl mb-3 bg-gradient-to-br relative overflow-hidden',
          playlist.gradient,
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <ListMusic className="w-12 h-12 text-white/40" />
        </div>
        <div className="absolute bottom-2 right-2 text-[10px] text-white/60 bg-black/20 backdrop-blur px-1.5 py-0.5 rounded">
          {playlist.songs.length} 首
        </div>
      </div>
      <h4 className="text-sm font-medium text-white truncate">
        {playlist.name}
      </h4>
      <p className="text-[11px] text-white/50 mt-0.5 line-clamp-1">
        {playlist.description}
      </p>
    </button>
  );
}

function SongRow({
  song,
  isActive,
  isPlaying,
  onPlay,
}: {
  song: Song;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
}) {
  return (
    <button
      onClick={onPlay}
      className={cn(
        'w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left',
        isActive ? 'bg-white/10' : 'hover:bg-white/5',
      )}
      aria-label={`播放 ${song.title}`}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-lg bg-gradient-to-br shrink-0 flex items-center justify-center',
          song.coverGradient,
        )}
      >
        {isActive && isPlaying ? (
          <Play className="w-4 h-4 text-white" />
        ) : (
          <Music2 className="w-4 h-4 text-white/70" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'text-sm truncate',
            isActive ? 'text-violet-300 font-medium' : 'text-white/90',
          )}
        >
          {song.title}
        </div>
        <div className="text-[11px] text-white/50 truncate">
          {song.artist}
        </div>
      </div>
      <div className="text-[11px] text-white/40 shrink-0">
        {formatTime(song.duration)}
      </div>
    </button>
  );
}

export default function MusicPage() {
  const [currentSong, setCurrentSong] = useState<Song>(SONGS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState<Set<string>>(new Set(['s1', 's3']));
  const [activePlaylist, setActivePlaylist] = useState<Playlist>(PLAYLISTS[0]);
  const [volume, setVolume] = useState(70);
  const intervalRef = useRef<number | null>(null);

  // 进度条动画
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= currentSong.duration) {
            // 自动下一首
            handleNext();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentSong.id]);

  const playSong = useCallback((song: Song) => {
    setCurrentSong(song);
    setProgress(0);
    setIsPlaying(true);
  }, []);

  const handlePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const handlePrev = () => {
    const playlistSongIds = activePlaylist.songs;
    const currentIdx = playlistSongIds.indexOf(currentSong.id);
    const prevIdx =
      currentIdx <= 0 ? playlistSongIds.length - 1 : currentIdx - 1;
    const prevSong = SONGS.find((s) => s.id === playlistSongIds[prevIdx]);
    if (prevSong) {
      playSong(prevSong);
    }
  };

  const handleNext = () => {
    const playlistSongIds = activePlaylist.songs;
    const currentIdx = playlistSongIds.indexOf(currentSong.id);
    const nextIdx = (currentIdx + 1) % playlistSongIds.length;
    const nextSong = SONGS.find((s) => s.id === playlistSongIds[nextIdx]);
    if (nextSong) {
      playSong(nextSong);
    }
  };

  const handleSeek = (val: number) => {
    setProgress(val);
  };

  const toggleLike = () => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(currentSong.id)) {
        next.delete(currentSong.id);
      } else {
        next.add(currentSong.id);
      }
      return next;
    });
  };

  const playlistSongs = activePlaylist.songs
    .map((id) => SONGS.find((s) => s.id === id))
    .filter((s): s is Song => !!s);

  return (
    <div className="h-full flex flex-col bg-dream-gradient relative overflow-hidden">
      {/* 背景装饰 */}
      <div
        className="glow-orb w-72 h-72 top-0 -left-20"
        style={{ backgroundColor: currentSong.accentColor }}
      />
      <div className="glow-orb w-56 h-56 bg-pink-500 bottom-32 right-0" />

      {/* 头部 */}
      <div className="relative z-10 px-5 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-gradient">梦角音乐</h1>
        <p className="text-xs text-white/50 mt-1">
          让旋律陪你入梦 🎵
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide relative z-10">
        {/* 播放器 */}
        <div className="px-5 pt-2 pb-6">
          <div className="glass-card-strong rounded-3xl p-6 relative overflow-hidden">
            <VinylRecord song={currentSong} isPlaying={isPlaying} />

            <div className="text-center mt-2">
              <h2 className="text-lg font-bold text-white truncate">
                {currentSong.title}
              </h2>
              <p className="text-sm text-white/60 mt-0.5">
                {currentSong.artist}
              </p>
            </div>

            <div className="mt-5">
              <ProgressBar
                current={progress}
                total={currentSong.duration}
                onSeek={handleSeek}
              />
            </div>

            {/* 控制按钮 */}
            <div className="flex items-center justify-center gap-6 mt-5">
              <button
                onClick={toggleLike}
                className="p-2 text-white/70 hover:text-pink-400 transition-colors"
                aria-label={liked.has(currentSong.id) ? '取消喜欢' : '喜欢'}
              >
                <Heart
                  className={cn(
                    'w-5 h-5',
                    liked.has(currentSong.id) &&
                      'text-pink-400 fill-current',
                  )}
                />
              </button>
              <button
                onClick={handlePrev}
                className="p-2 text-white/80 hover:text-white transition-colors"
                aria-label="上一首"
              >
                <SkipBack className="w-6 h-6" />
              </button>
              <button
                onClick={handlePlayPause}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-violet-400 to-pink-400 text-white shadow-lg shadow-violet-500/30 flex items-center justify-center hover:scale-105 transition-transform"
                aria-label={isPlaying ? '暂停' : '播放'}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-0.5" />
                )}
              </button>
              <button
                onClick={handleNext}
                className="p-2 text-white/80 hover:text-white transition-colors"
                aria-label="下一首"
              >
                <SkipForward className="w-6 h-6" />
              </button>
              <button
                className="p-2 text-white/70 hover:text-white transition-colors"
                aria-label="音量"
                onClick={() => setVolume((v) => (v > 0 ? 0 : 70))}
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 歌单 */}
        <div className="px-5 pb-4">
          <h3 className="text-sm font-medium text-white/90 mb-3 flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-violet-300" />
            梦角推荐歌单
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {PLAYLISTS.map((pl) => (
              <PlaylistCard
                key={pl.id}
                playlist={pl}
                isActive={activePlaylist.id === pl.id}
                onClick={() => setActivePlaylist(pl)}
              />
            ))}
          </div>
        </div>

        {/* 歌曲列表 */}
        <div className="px-5 pb-24">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-white/90 flex items-center gap-2">
              <Music2 className="w-4 h-4 text-pink-300" />
              {activePlaylist.name}
            </h3>
            <span className="text-xs text-white/40">
              {playlistSongs.length} 首
            </span>
          </div>
          <div className="glass-card rounded-2xl p-2 space-y-1">
            {playlistSongs.map((song) => (
              <SongRow
                key={song.id}
                song={song}
                isActive={currentSong.id === song.id}
                isPlaying={isPlaying}
                onPlay={() => playSong(song)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

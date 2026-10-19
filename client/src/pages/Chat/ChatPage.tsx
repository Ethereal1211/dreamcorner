import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Sparkles, Circle, ChevronDown, ChevronUp, BookOpen, Heart, Briefcase } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import * as dreamChatApi from '@client/src/api/dream-chat';
import { useSettings } from '@client/src/contexts/SettingsContext';
import type { ChatMessage } from '@shared/api.interface';
import { Image } from '@client/src/components/ui/image';

interface TarotCardData {
  cardName: string;
  cardNumber: number;
  isReversed: boolean;
  meaning: string;
  keywords: string[];
  story: string;
  uprightDetail: string;
  reversedDetail: string;
  loveUpright: string;
  loveReversed: string;
  careerUpright: string;
  careerReversed: string;
}

const ChatPage = () => {
  const navigate = useNavigate();
  const { theme, dreamRoleName, dreamRoleAvatar, dreamRoleAvatarColor, dreamRoleAvatarUrl, userAvatar, userAvatarColor, userAvatarUrl } = useSettings();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await dreamChatApi.getMessages(1, 50);
        setMessages(response.items ?? []);
      } catch (error: unknown) {
        logger.error('加载消息失败', error);
      } finally {
        setIsInitialLoading(false);
      }
    };
    void loadMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isDrawing, scrollToBottom]);

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: trimmed,
      messageType: 'text',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev: ChatMessage[]) => [...prev, tempUserMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const result = await dreamChatApi.sendMessage(trimmed, 'text');
      setMessages((prev: ChatMessage[]) => {
        const filtered = prev.filter(
          (m: ChatMessage) => !m.id.startsWith('temp-'),
        );
        return [...filtered, ...result];
      });
    } catch (error: unknown) {
      logger.error('发送消息失败', error);
      setMessages((prev: ChatMessage[]) =>
        prev.filter((m: ChatMessage) => !m.id.startsWith('temp-')),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrawTarot = async () => {
    if (isDrawing) return;
    setIsDrawing(true);
    setIsLoading(true);

    try {
      const result = await dreamChatApi.drawTarotInChat('general');
      setMessages((prev: ChatMessage[]) => [...prev, ...result]);
    } catch (error: unknown) {
      logger.error('抽牌失败', error);
    } finally {
      setIsDrawing(false);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-full text-white/60">
        加载中...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 顶部头像区 */}
      <div className="flex flex-col items-center py-3 mb-1">
        <div className="relative">
          <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${dreamRoleAvatarColor} flex items-center justify-center text-white text-xl font-bold shadow-lg overflow-hidden`}>
            {dreamRoleAvatarUrl ? (
              <Image src={dreamRoleAvatarUrl} alt={dreamRoleName} className="w-full h-full object-cover" />
            ) : (
              dreamRoleAvatar
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-green-400 border-2 flex items-center justify-center" style={{ borderColor: theme.background }}>
            <Circle size={6} className="fill-white text-white" />
          </div>
        </div>
        <div className="mt-1.5 text-white font-medium text-sm">{dreamRoleName}</div>
        <div className="text-xs text-white/50">在线，随时陪你聊天</div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 flex flex-col gap-3 pb-3">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-white/40 text-sm">
              <p>今天想聊点什么呢？</p>
              <p className="mt-1">我是{dreamRoleName}，一直在你身边 ✨</p>
            </div>
          </div>
        )}

        {messages.map((msg: ChatMessage) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            dreamRoleAvatar={dreamRoleAvatar}
            dreamRoleAvatarColor={dreamRoleAvatarColor}
            dreamRoleAvatarUrl={dreamRoleAvatarUrl}
            userAvatar={userAvatar}
            userAvatarColor={userAvatarColor}
            userAvatarUrl={userAvatarUrl}
            theme={theme}
          />
        ))}

        {(isLoading || isDrawing) && (
          <div className="flex items-start gap-2">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${dreamRoleAvatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
              {dreamRoleAvatar}
            </div>
            <div className="glass-card rounded-2xl rounded-tl-md px-4 py-2.5">
              <div className="flex items-center gap-1 text-white/70 text-sm">
                <span className="animate-pulse">{dreamRoleName}正在输入</span>
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 快捷按钮 */}
      <button
        onClick={handleDrawTarot}
        disabled={isDrawing || isLoading}
        className="glass-card rounded-2xl px-4 py-2.5 mb-3 flex items-center justify-center gap-2 text-white/80 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Sparkles size={16} style={{ color: theme.accent }} />
        <span className="text-sm">抽一张牌，看看今日运势</span>
      </button>

      {/* 输入区 */}
      <div className="glass-card rounded-2xl p-2 flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setInputValue(e.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder={`和${dreamRoleName}说点什么...`}
          className="flex-1 bg-transparent text-white placeholder-white/40 text-sm px-3 py-1.5 outline-none"
        />
        <button
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
          style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)` }}
          aria-label="发送"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

interface MessageBubbleProps {
  message: ChatMessage;
  dreamRoleAvatar: string;
  dreamRoleAvatarColor: string;
  dreamRoleAvatarUrl: string;
  userAvatar: string;
  userAvatarColor: string;
  userAvatarUrl: string;
  theme: { primary: string; accent: string; gradientText: string };
}

const MessageBubble = ({ message, dreamRoleAvatar, dreamRoleAvatarColor, dreamRoleAvatarUrl, userAvatar, userAvatarColor, userAvatarUrl, theme }: MessageBubbleProps) => {
  const isUser = message.role === 'user';

    if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[75%] rounded-2xl rounded-br-md px-4 py-2.5 text-white text-sm leading-relaxed shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`,
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  function DreamAvatar() {
    return (
      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${dreamRoleAvatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden`}>
        {dreamRoleAvatarUrl ? (
          <Image src={dreamRoleAvatarUrl} alt="梦角" className="w-full h-full object-cover" />
        ) : (
          dreamRoleAvatar
        )}
      </div>
    );
  }

  if (message.messageType === 'tarot') {
    const [expanded, setExpanded] = useState(false);
    let cardData: TarotCardData | null = null;
    try {
      cardData = JSON.parse(message.content) as TarotCardData;
    } catch {
      cardData = null;
    }

    if (!cardData) {
      return (
        <div className="flex items-start gap-2">
          <DreamAvatar />
          <div className="glass-card rounded-2xl rounded-tl-md px-4 py-2.5 max-w-[75%]">
            <p className="text-white text-sm">{message.content}</p>
          </div>
        </div>
      );
    }

    const detail = cardData.isReversed ? cardData.reversedDetail : cardData.uprightDetail;
    const loveDetail = cardData.isReversed ? cardData.loveReversed : cardData.loveUpright;
    const careerDetail = cardData.isReversed ? cardData.careerReversed : cardData.careerUpright;

    return (
      <div className="flex items-start gap-2">
        <DreamAvatar />
        <div className="glass-card rounded-2xl rounded-tl-md p-3.5 max-w-[82%] w-72">
          <div className="flex items-start gap-3">
            <div
              className="w-14 h-20 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`,
                boxShadow: `0 2px 8px ${theme.primary}40`,
                transform: cardData.isReversed ? 'rotate(180deg)' : 'none',
              }}
            >
              <span className="text-lg leading-none opacity-80">✦</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white flex items-center gap-1.5">
                <span>{cardData.cardName}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: cardData.isReversed ? 'hsl(0 60% 50% / 0.3)' : 'hsl(140 60% 50% / 0.3)', color: cardData.isReversed ? 'hsl(0 80% 85%)' : 'hsl(140 70% 80%)' }}>
                  {cardData.isReversed ? '逆位' : '正位'}
                </span>
              </div>
              <div className="text-xs text-white/60 mt-1 line-clamp-2 leading-relaxed">
                {detail}
              </div>
              <div className="flex gap-1 mt-2 flex-wrap">
                {cardData.keywords.slice(0, 3).map((kw: string) => (
                  <span
                    key={kw}
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full mt-3 flex items-center justify-center gap-1 text-[11px] text-white/50 hover:text-white/70 transition-colors pt-2 border-t border-white/10"
            aria-label={expanded ? '收起解读' : '展开完整解读'}
          >
            {expanded ? (
              <><ChevronUp size={12} /> 收起</>  
            ) : (
              <><ChevronDown size={12} /> 查看完整解读</>
            )}
          </button>

          {expanded && (
            <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* 牌面故事 */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles size={11} className="text-amber-300" />
                  <span className="text-xs font-medium text-white/80">牌面故事</span>
                </div>
                <p className="text-xs leading-relaxed text-white/50">
                  {cardData.story}
                </p>
              </div>

              {/* 详细解读 */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <BookOpen size={11} className="text-purple-300" />
                  <span className="text-xs font-medium text-white/80">
                    {cardData.isReversed ? '逆位详解' : '正位详解'}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-white/60">
                  {detail}
                </p>
              </div>

              {/* 感情事业 */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-white/5 p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Heart size={10} className="text-pink-400" />
                    <span className="text-[11px] font-medium text-white/70">感情</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-white/50">
                    {loveDetail}
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Briefcase size={10} className="text-blue-400" />
                    <span className="text-[11px] font-medium text-white/70">事业</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-white/50">
                    {careerDetail}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <DreamAvatar />
      <div className="glass-card rounded-2xl rounded-tl-md px-4 py-2.5 max-w-[75%]">
        <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    </div>
  );
};

export default ChatPage;

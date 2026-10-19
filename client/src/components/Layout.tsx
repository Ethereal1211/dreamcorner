import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  Sparkles,
  BookOpen,
  Calendar,
  Users,
  Signal,
  BatteryFull,
  Music2,
  Settings as SettingsIcon,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useSettings } from '@client/src/contexts/SettingsContext';

const PAGE_TITLES: Record<string, string> = {
  '/chat': '',
  '/tarot': '塔罗牌',
  '/diary': '梦角日记',
  '/schedule': '日程提醒',
  '/moments': '梦的空间',
  '/settings': '设置',
};

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, dreamRoleName } = useSettings();
  const [currentTime, setCurrentTime] = useState<string>(
    dayjs().format('HH:mm'),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('HH:mm'));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const pageTitle = location.pathname === '/chat' || location.pathname === '/' 
    ? dreamRoleName 
    : (PAGE_TITLES[location.pathname] ?? '梦角');

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: theme.gradient }}>
      {/* 光晕装饰 */}
      <div
        className="glow-orb"
        style={{
          top: '-10%',
          left: '-10%',
          width: '300px',
          height: '300px',
          background: theme.orb1,
        }}
      />
      <div
        className="glow-orb"
        style={{
          bottom: '-10%',
          right: '-10%',
          width: '350px',
          height: '350px',
          background: theme.orb2,
        }}
      />

      {/* 手机框架 */}
      <div className="phone-frame flex flex-col" style={{ background: theme.gradient }}>
        {/* 状态栏 */}
        <div className="flex items-center justify-between px-6 pt-3 pb-1 text-white text-xs font-medium">
          <span>{currentTime}</span>
          <div className="flex items-center gap-1.5">
            <Signal size={14} />
            <BatteryFull size={16} />
          </div>
        </div>

        {/* 页面标题栏 */}
        <div className="flex items-center justify-between px-5 py-3">
          <h1 className="text-lg font-semibold text-white">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            <NavLink
              to="/music"
              className="text-white/70 hover:text-white transition-colors"
              aria-label="音乐"
            >
              <Music2 size={20} />
            </NavLink>
            <button
              onClick={() => navigate('/settings')}
              className="text-white/70 hover:text-white transition-colors"
              aria-label="设置"
            >
              <SettingsIcon size={20} />
            </button>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-2">
          <Outlet />
        </div>

        {/* 底部导航 */}
        <nav className="glass-card-strong border-t border-white/10 px-2 py-2">
          <div className="flex items-center justify-around">
            <NavItem to="/chat" icon={MessageCircle} label="聊天" theme={theme} />
            <NavItem to="/tarot" icon={Sparkles} label="塔罗" theme={theme} />
            <NavItem to="/diary" icon={BookOpen} label="日记" theme={theme} />
            <NavItem to="/schedule" icon={Calendar} label="日程" theme={theme} />
            <NavItem to="/moments" icon={Users} label="空间" theme={theme} />
          </div>
        </nav>
      </div>
    </div>
  );
};

interface NavItemProps {
  to: string;
  icon: ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  theme: { navGlow: string; navFilter: string; gradientText: string };
}

const NavItem = ({ to, icon: Icon, label, theme }: NavItemProps) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-300 ${
          isActive
            ? 'scale-110'
            : 'text-white/50 hover:text-white/80'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={22}
             style={
                isActive
                  ? {
                      color: theme.navGlow,
                      filter: theme.navFilter,
                    }
                  : undefined
              }
          />
           <span
             className={`text-[10px] font-medium ${
               isActive ? 'text-gradient' : ''
             }`}
             style={isActive ? { background: theme.gradientText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' } : undefined}
           >
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
};

export default Layout;

import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { SettingsProvider } from './contexts/SettingsContext';
import Layout from './components/Layout';
import ChatPage from './pages/Chat/ChatPage';
import TarotPage from './pages/Tarot/TarotPage';
import DiaryPage from './pages/Diary/DiaryPage';
import MomentsPage from './pages/Moments/MomentsPage';
import SchedulePage from './pages/Schedule/SchedulePage';
import MusicPage from './pages/Music/MusicPage';
import SettingsPage from './pages/Settings/SettingsPage';
import NotFound from './pages/NotFound/NotFound';

const RoutesComponent = () => {
  return (
    <SettingsProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<ChatPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="tarot" element={<TarotPage />} />
          <Route path="diary" element={<DiaryPage />} />
          <Route path="moments" element={<MomentsPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="music" element={<MusicPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="ai-settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SettingsProvider>
  );
};

export default RoutesComponent;

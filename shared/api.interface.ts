export interface TarotCard {
  id: string;
  name: string;
  number: number;
  suit: string;
  meaning: string;
  reversedMeaning: string;
  keywords: string[];
}

export interface TarotDrawRecord {
  id: string;
  cardName: string;
  cardNumber: number;
  isReversed: boolean;
  position: string;
  message: string;
  dreamMessage: string;
  context: string;
  createdAt: string;
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  mood: string;
  entryDate: string;
  isDream: boolean;
  dreamRoleMessage: string;
  createdAt: string;
}

export interface Moment {
  id: string;
  content: string;
  images: string[];
  likes: number;
  isFromDream: boolean;
  createdAt: string;
}

export interface Schedule {
  id: string;
  title: string;
  description: string;
  scheduleDate: string;
  scheduleTime: string;
  isDone: boolean;
  category: string;
  createdAt: string;
}

export interface PeriodRecord {
  id: string;
  startDate: string;
  endDate: string | null;
  cycleLength: number;
  periodLength: number;
  notes: string;
  symptoms: string[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'dream';
  content: string;
  tarotDrawId?: string | null;
  messageType: string;
  createdAt: string;
}

export interface TarotDrawResponse {
  card: TarotCard;
  isReversed: boolean;
  dreamMessage: string;
  recordId: string;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
}

export interface PeriodPrediction {
  nextStartDate: string;
  nextEndDate: string;
  ovulationDate: string;
  fertileStart: string;
  fertileEnd: string;
  daysUntilNext: number;
  currentPhase: string;
}

export interface UserSettings {
  id: string;
  themeName: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  dreamRoleName: string;
  dreamRoleAvatar: string;
  dreamRoleAvatarColor: string;
  dreamRoleAvatarUrl: string;
  userName: string;
  userAvatar: string;
  userAvatarColor: string;
  userAvatarUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface TarotChatDrawResult {
  userMessage: ChatMessage;
  tarotMessage: ChatMessage;
  dreamMessage: ChatMessage;
  recordId: string;
}

export interface AiSettings {
  id: string;
  provider: string;
  apiKey: string;
  baseUrl: string;
  modelName: string;
  temperature: number;
  systemPrompt: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Vibe & Habit Enums ───────────────────────────────────────────────────────
export type AudioEnvironment =
  | 'Absolute Silence'
  | 'Headphones On / Ignored World'
  | 'Lo-fi Café Buzz'
  | 'I Read Aloud / Mumble';

export type StudyPacing =
  | 'Strict Pomodoro (25/5)'
  | '3-Hour Marathon'
  | 'Free Flowing'
  | 'Night Owl';

export type StudyFuel =
  | 'Black Filter Coffee'
  | 'Endless Tea'
  | 'Energy Drinks'
  | 'Just Water';

// ── Stamp metadata ────────────────────────────────────────────────────────────
export interface StampMeta {
  icon: string; // emoji
  label: string;
  rotation: number; // slight tilt in degrees
  category: 'audio' | 'pacing' | 'fuel';
}

export const AUDIO_STAMPS: Record<AudioEnvironment, StampMeta> = {
  'Absolute Silence': {
    icon: '🔇',
    label: 'Absolute Silence',
    rotation: -3,
    category: 'audio',
  },
  'Headphones On / Ignored World': {
    icon: '🎧',
    label: 'Headphones On',
    rotation: 2,
    category: 'audio',
  },
  'Lo-fi Café Buzz': {
    icon: '📻',
    label: 'Lo-fi Café Buzz',
    rotation: -4,
    category: 'audio',
  },
  'I Read Aloud / Mumble': {
    icon: '🗣️',
    label: 'Reads Aloud',
    rotation: 3,
    category: 'audio',
  },
};

export const PACING_STAMPS: Record<StudyPacing, StampMeta> = {
  'Strict Pomodoro (25/5)': {
    icon: '🍅',
    label: 'Pomodoro',
    rotation: 4,
    category: 'pacing',
  },
  '3-Hour Marathon': {
    icon: '🏃',
    label: '3-Hr Marathon',
    rotation: -2,
    category: 'pacing',
  },
  'Free Flowing': {
    icon: '🌊',
    label: 'Free Flowing',
    rotation: 3,
    category: 'pacing',
  },
  'Night Owl': {
    icon: '🌙',
    label: 'Night Owl',
    rotation: -5,
    category: 'pacing',
  },
};

export const FUEL_STAMPS: Record<StudyFuel, StampMeta> = {
  'Black Filter Coffee': {
    icon: '☕',
    label: 'Filter Coffee',
    rotation: -3,
    category: 'fuel',
  },
  'Endless Tea': {
    icon: '🍵',
    label: 'Endless Tea',
    rotation: 4,
    category: 'fuel',
  },
  'Energy Drinks': {
    icon: '⚡',
    label: 'Energy Drinks',
    rotation: -2,
    category: 'fuel',
  },
  'Just Water': {
    icon: '💧',
    label: 'Just Water',
    rotation: 2,
    category: 'fuel',
  },
};

export interface User {
  id: string;
  name: string;
  university: string;
  department: string;
  grade: number;
  year: 'Freshman' | 'Sophomore' | 'Junior' | 'Senior';
  trustScore: number;
  badges: Record<string, number>;
  currentGoalText: string;
  currentTags: string[];
  // Vibe & Habits
  audioEnvironment?: AudioEnvironment;
  studyPacing?: StudyPacing;
  studyFuel?: StudyFuel;
  photoUrl?: string;
  photos?: string[];
  bio?: string;
  availability?: string[];
  city?: string;
  birthdate?: string;
  activeMatchId?: string | null;
}

/**
 * `public.users`' email-verification columns, mapped separately from `User` —
 * neither `User` (display profile data) nor `RegistrationData` (the signup
 * form's shape) has a natural home for verification status. Used by
 * AppNavigator.tsx's session-routing check and RegisterEmailCodeScreen.tsx's
 * own-row read, so a future consumer has one sanctioned place to read these
 * columns from instead of adding another raw row read.
 */
export interface EmailVerificationStatus {
  emailVerified: boolean;
  verificationCode: string;
}

/**
 * A Discovery candidate's ranked, viewer-relative view — distinct from `User`
 * (your own profile) since age/sameCity/matchScore only mean something
 * relative to the person querying `discoverable_users` (Phase 7). Never merge
 * these onto `User` itself.
 */
export interface DiscoveryCandidate extends User {
  age?: number;
  sameCity?: boolean;
  matchScore: number;
}

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  status: 'active' | 'completed' | 'terminated' | 'expired';
  user1Revealed: boolean;
  user2Revealed: boolean;
  partnerAlias: string;
  messageCount: number;
  revealThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface StudyDate {
  id: string;
  matchId: string;
  proposedBy: string;
  location: string;
  scheduledTime: string;
  focusSubject: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface SessionCard {
  id: string;
  subject: string;
  location: string;
  partnerName: string;
  partnerPhoto?: string;
  timeLabel: string;
  timeRange: string;
}

export interface DiscoveryFilters {
  institution: string;
  selectedUni: string;
  sameCityOnly: boolean;
  minAge: number;
  maxAge: number;
  departments: string[];
}

export interface RegistrationData {
  email: string;
  fullName: string;
  institution: string;
  department: string;
  traits: string[];
  focusGoal: string;
}

// Navigation param types
export type RootStackParamList = {
  MainTabs: undefined;
  StudentProfile: { userId: string };
  Chat: { matchId: string };
  StudyDatePlanner: { matchId: string };
  EditProfile: undefined;
  Filter: { current?: DiscoveryFilters } | undefined;
  MatchFound: undefined;
  RegisterVerification: undefined;
  RegisterEmailCode: { data: Partial<RegistrationData> };
  RegisterProfile: { data: Partial<RegistrationData> };
  RegisterTraits: { data: Partial<RegistrationData> };
  RegisterFinal: { data: Partial<RegistrationData> };
  PostDateSurvey: { studyDateId: string; partnerName?: string };
};

export type TabParamList = {
  Dashboard: undefined;
  Match: { filters?: DiscoveryFilters } | undefined;
  Chats: undefined;
  Planner: undefined;
  Profile: undefined;
};

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
  photoUrl?: string;
  photos?: string[];
  bio?: string;
  availability?: string[];
  city?: string;
  activeMatchId?: string | null;
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

// Navigation param types
export type RootStackParamList = {
  MainTabs: undefined;
  StudentProfile: { userId: string };
  Chat: { matchId: string };
  StudyDatePlanner: { matchId: string };
};

export type TabParamList = {
  Dashboard: undefined;
  Match: undefined;
  Chats: undefined;
  Planner: undefined;
  Profile: undefined;
};

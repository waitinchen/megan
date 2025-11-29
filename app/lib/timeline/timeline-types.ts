/**
 * Timeline Types (V4)
 * 
 * Conversation Timeline Engine Data Models
 */

export interface TimelineEvent {
  id: string;
  userId: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
  emotion?: string;          // joy, sad, calm, stressed, excited, etc.
  topic?: string[];          // ["relationship", "work", "daily", etc.]
  memoryHooks?: string[];    // ["preferences", "tone", "profile", etc.]
  embedding?: number[];      // optional vector embedding for search
  metadata?: {
    conversationId?: string;
    messageIndex?: number;
    audioUrl?: string;
    [key: string]: any;
  };
}

export interface TimelineResponse {
  success: boolean;
  data?: TimelineEvent[];
  error?: {
    code: string;
    message: string;
  };
}

export interface TimelineIndex {
  userId: string;
  eventIds: string[];
  lastUpdated: number;
}

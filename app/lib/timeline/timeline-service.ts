/**
 * Timeline Service v4 (Final Version)
 * 
 * Client-side service for interacting with the Timeline API
 */

import type { TimelineEvent } from './timeline-types';

const TIMELINE_API_URL = process.env.NEXT_PUBLIC_TIMELINE_URL || '';

/**
 * Save a timeline event
 */
export async function saveTimeline(userId: string, event: TimelineEvent): Promise<{ ok: boolean; saved?: { key: string; timestamp: number }; error?: string }> {
  try {
    if (!TIMELINE_API_URL) {
      console.warn('[Timeline Service] NEXT_PUBLIC_TIMELINE_URL not configured');
      return { ok: false, error: 'Timeline API URL not configured' };
    }

    const res = await fetch(`${TIMELINE_API_URL}/timeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, event }),
    });

    return await res.json();
  } catch (error: any) {
    console.error('[Timeline Service] Error saving timeline event:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * List all timeline events for a user
 */
export async function listTimeline(userId: string): Promise<{ ok: boolean; events?: Array<{ key: string; timestamp: number; data: TimelineEvent }>; error?: string }> {
  try {
    if (!TIMELINE_API_URL) {
      console.warn('[Timeline Service] NEXT_PUBLIC_TIMELINE_URL not configured');
      return { ok: false, error: 'Timeline API URL not configured' };
    }

    const res = await fetch(
      `${TIMELINE_API_URL}/timeline?user=${encodeURIComponent(userId)}`,
      { method: "GET" }
    );

    return await res.json();
  } catch (error: any) {
    console.error('[Timeline Service] Error fetching timeline events:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Save a timeline event (alias for compatibility)
 * @deprecated Use saveTimeline instead
 */
export async function saveTimelineEvent(event: TimelineEvent): Promise<boolean> {
  if (!event.userId) {
    console.error('[Timeline Service] Event missing userId');
    return false;
  }
  const result = await saveTimeline(event.userId, event);
  return result.ok === true;
}

/**
 * Get all timeline events (alias for compatibility)
 * @deprecated Use listTimeline instead
 */
export async function getTimelineEvents(userId: string): Promise<TimelineEvent[]> {
  const result = await listTimeline(userId);
  if (!result.ok || !result.events) {
    return [];
  }
  return result.events.map(e => e.data);
}

/**
 * Create a timeline event from a chat message
 */
export function createTimelineEventFromMessage(
  userId: string,
  role: 'user' | 'ai',
  text: string,
  metadata?: TimelineEvent['metadata']
): TimelineEvent {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
    userId,
    role,
    text,
    timestamp: Date.now(),
    metadata,
  };
}
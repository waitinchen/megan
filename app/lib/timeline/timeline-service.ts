/**
 * Timeline Service v4 (Simplified)
 * 
 * Client-side service for interacting with the Timeline API
 */

import type { TimelineEvent } from './timeline-types';

const TIMELINE_API_URL = process.env.NEXT_PUBLIC_TIMELINE_URL || '';

/**
 * Save a timeline event
 */
export async function saveTimeline(userId: string, event: TimelineEvent): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    if (!TIMELINE_API_URL) {
      console.warn('[Timeline Service] NEXT_PUBLIC_TIMELINE_URL not configured');
      return { ok: false, error: 'Timeline API URL not configured' };
    }

    const response = await fetch(`${TIMELINE_API_URL}/timeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, event }),
    });

    return await response.json();
  } catch (error: any) {
    console.error('[Timeline Service] Error saving timeline event:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * List all timeline events for a user
 */
export async function listTimeline(userId: string): Promise<{ events: Array<{ id: string; event: TimelineEvent }> }> {
  try {
    if (!TIMELINE_API_URL) {
      console.warn('[Timeline Service] NEXT_PUBLIC_TIMELINE_URL not configured');
      return { events: [] };
    }

    const response = await fetch(`${TIMELINE_API_URL}/timeline?userId=${encodeURIComponent(userId)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      console.error('[Timeline Service] Failed to fetch timeline events');
      return { events: [] };
    }

    return await response.json();
  } catch (error) {
    console.error('[Timeline Service] Error fetching timeline events:', error);
    return { events: [] };
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
  return result.events.map(e => e.event);
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
/**
 * Timeline Service (V4)
 * 
 * Client-side service for interacting with the Timeline API
 */

import type { TimelineEvent, TimelineResponse } from './timeline-types';

const TIMELINE_API_URL = process.env.NEXT_PUBLIC_TIMELINE_API_URL || '';

/**
 * Save a timeline event
 */
export async function saveTimelineEvent(event: TimelineEvent): Promise<boolean> {
  try {
    if (!TIMELINE_API_URL) {
      console.warn('[Timeline Service] TIMELINE_API_URL not configured');
      return false;
    }

    const response = await fetch(`${TIMELINE_API_URL}/timeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: event.userId,
        event,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to save timeline event' }));
      console.error('[Timeline Service] Failed to save event:', error);
      return false;
    }

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('[Timeline Service] Error saving timeline event:', error);
    return false;
  }
}

/**
 * Get all timeline events for a user
 */
export async function getTimelineEvents(userId: string): Promise<TimelineEvent[]> {
  try {
    if (!TIMELINE_API_URL) {
      console.warn('[Timeline Service] TIMELINE_API_URL not configured');
      return [];
    }

    const response = await fetch(`${TIMELINE_API_URL}/timeline?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[Timeline Service] Failed to fetch timeline events');
      return [];
    }

    const result: TimelineResponse = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('[Timeline Service] Error fetching timeline events:', error);
    return [];
  }
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

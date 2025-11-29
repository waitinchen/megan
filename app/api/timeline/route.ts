export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { ok, fail, unauthorized, serverError } from '@/app/lib/api/response';
import { ERROR_CODES } from '@/app/lib/api/errors';

const TIMELINE_API_URL = process.env.NEXT_PUBLIC_TIMELINE_API_URL || '';

/**
 * POST /api/timeline
 * Save a timeline event
 */
export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return unauthorized();
    }

    if (!TIMELINE_API_URL) {
      return fail(ERROR_CODES.TIMELINE_ERROR, 'Timeline API URL not configured', 500);
    }

    const body = await request.json();
    const { userId, event } = body;

    if (!userId || !event) {
      return fail(ERROR_CODES.VALIDATION_ERROR, 'Missing required fields: userId, event');
    }

    // Forward to Cloudflare Worker
    const response = await fetch(`${TIMELINE_API_URL}/timeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, event }),
    });

    if (!response.ok) {
      const error = await response.text();
      return fail(ERROR_CODES.TIMELINE_ERROR, `Failed to save timeline event: ${error}`, response.status);
    }

    const result = await response.json();
    return ok(result);
  } catch (error: any) {
    console.error('[API Timeline] POST Error:', error);
    return serverError(error.message || 'Failed to save timeline event');
  }
}

/**
 * GET /api/timeline?userId=xxx
 * Get all timeline events for a user
 */
export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return unauthorized();
    }

    if (!TIMELINE_API_URL) {
      return fail(ERROR_CODES.TIMELINE_ERROR, 'Timeline API URL not configured', 500);
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return fail(ERROR_CODES.VALIDATION_ERROR, 'Missing required parameter: userId');
    }

    // Forward to Cloudflare Worker
    const response = await fetch(`${TIMELINE_API_URL}/timeline?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return fail(ERROR_CODES.TIMELINE_ERROR, `Failed to fetch timeline events: ${error}`, response.status);
    }

    const result = await response.json();
    return ok(result.data || []);
  } catch (error: any) {
    console.error('[API Timeline] GET Error:', error);
    return serverError(error.message || 'Failed to fetch timeline events');
  }
}

/**
 * Helper function to get the current active System Prompt from database
 * Falls back to code file if database is unavailable
 */

import { createClient } from '@supabase/supabase-js';
import { SYSTEM_PROMPT as FALLBACK_SYSTEM_PROMPT } from './system-prompt';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let cachedSystemPrompt: string | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute cache

/**
 * Get the current active system prompt from database
 * Uses caching to avoid excessive database queries
 */
export async function getSystemPrompt(): Promise<string> {
    const now = Date.now();

    // Return cached prompt if still valid
    if (cachedSystemPrompt && (now - lastFetchTime) < CACHE_DURATION) {
        return cachedSystemPrompt;
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        const { data, error } = await supabase
            .from('personality_configs')
            .select('system_prompt')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.warn('[System Prompt] Failed to fetch from database, using fallback:', error.message);
            return FALLBACK_SYSTEM_PROMPT;
        }

        if (data && data.system_prompt) {
            cachedSystemPrompt = data.system_prompt;
            lastFetchTime = now;
            console.log('[System Prompt] Loaded from database:', data.system_prompt.substring(0, 100) + '...');
            return data.system_prompt;
        }

        console.warn('[System Prompt] No active prompt in database, using fallback');
        return FALLBACK_SYSTEM_PROMPT;

    } catch (error) {
        console.error('[System Prompt] Error fetching from database:', error);
        return FALLBACK_SYSTEM_PROMPT;
    }
}

/**
 * Clear the cached system prompt (useful after updates)
 */
export function clearSystemPromptCache() {
    cachedSystemPrompt = null;
    lastFetchTime = 0;
    console.log('[System Prompt] Cache cleared');
}

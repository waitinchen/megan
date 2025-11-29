/**
 * Timeline Worker (V4)
 * 
 * Cloudflare Worker for storing conversation timeline events
 * 
 * Setup:
 * 1. Create a new Cloudflare Worker
 * 2. Bind a KV namespace named "MEGAN_TIMELINE"
 * 3. Deploy this code
 * 4. Set NEXT_PUBLIC_TIMELINE_API_URL to your worker URL
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    // CORS headers
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle preflight
    if (method === "OPTIONS") {
      return new Response("", { headers: cors });
    }

    // POST /timeline → Save a timeline event
    if (method === "POST") {
      try {
        const body = await request.json();
        const { userId, event } = body;

        if (!userId || !event || !event.id) {
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: "VALIDATION_ERROR", message: "Missing required fields: userId, event.id" }
            }),
            {
              status: 400,
              headers: { ...cors, "Content-Type": "application/json" }
            }
          );
        }

        // Store event with TTL (7 days)
        const key = `timeline:v1:users:${userId}:${event.id}`;
        await env.MEGAN_TIMELINE.put(key, JSON.stringify(event), {
          expirationTtl: 60 * 60 * 24 * 7, // 7 days
        });

        // Update index
        const indexKey = `timeline:v1:index:${userId}`;
        const existing = await env.MEGAN_TIMELINE.get(indexKey);
        const list = existing ? JSON.parse(existing) : [];
        
        // Add event ID if not already present
        if (!list.includes(event.id)) {
          list.push(event.id);
          await env.MEGAN_TIMELINE.put(
            indexKey,
            JSON.stringify(list),
            {
              expirationTtl: 60 * 60 * 24 * 7, // 7 days
            }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          {
            headers: { ...cors, "Content-Type": "application/json" }
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: "INTERNAL_ERROR", message: error.message }
          }),
          {
            status: 500,
            headers: { ...cors, "Content-Type": "application/json" }
          }
        );
      }
    }

    // GET /timeline?userId=xxx → Get all events for a user
    if (method === "GET") {
      try {
        const userId = url.searchParams.get("userId");

        if (!userId) {
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: "VALIDATION_ERROR", message: "Missing required parameter: userId" }
            }),
            {
              status: 400,
              headers: { ...cors, "Content-Type": "application/json" }
            }
          );
        }

        const indexKey = `timeline:v1:index:${userId}`;
        const indexData = await env.MEGAN_TIMELINE.get(indexKey);
        const ids = indexData ? JSON.parse(indexData) : [];

        // Fetch all events
        const events = [];
        for (const id of ids) {
          const key = `timeline:v1:users:${userId}:${id}`;
          const raw = await env.MEGAN_TIMELINE.get(key);
          if (raw) {
            try {
              events.push(JSON.parse(raw));
            } catch (e) {
              // Skip invalid JSON
              console.error(`Failed to parse event ${id}:`, e);
            }
          }
        }

        // Sort by timestamp (newest first)
        events.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        return new Response(
          JSON.stringify({
            success: true,
            data: events
          }),
          {
            headers: { ...cors, "Content-Type": "application/json" }
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: "INTERNAL_ERROR", message: error.message }
          }),
          {
            status: 500,
            headers: { ...cors, "Content-Type": "application/json" }
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "NOT_FOUND", message: "Method not allowed" }
      }),
      {
        status: 404,
        headers: { ...cors, "Content-Type": "application/json" }
      }
    );
  },
};

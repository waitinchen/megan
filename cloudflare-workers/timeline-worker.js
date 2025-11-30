/**
 * Timeline Worker v4 (Final Version)
 * 
 * Cloudflare Worker for storing conversation timeline events
 * 
 * Setup:
 * 1. Create a new Cloudflare Worker named "megan-timeline"
 * 2. Bind KV namespace with variable name "MEGAN_TIMELINE"
 * 3. Deploy this code
 * 4. Set NEXT_PUBLIC_TIMELINE_URL to your worker URL
 */

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      };

      // Preflight
      if (request.method === "OPTIONS") {
        return new Response("OK", { status: 200, headers });
      }

      // ============
      // 1) POST /timeline
      // ============
      if (path === "/timeline" && request.method === "POST") {
        const body = await request.json();
        const { userId, event } = body;

        if (!userId || !event) {
          return new Response(JSON.stringify({ ok: false, error: "Invalid payload" }), {
            status: 400,
            headers,
          });
        }

        const timestamp = Date.now();
        const key = `${userId}:${timestamp}`;

        await env.MEGAN_TIMELINE.put(key, JSON.stringify(event), {
          expirationTtl: 60 * 60 * 24 * 7, // 7 days
        });

        return new Response(JSON.stringify({ ok: true, saved: { key, timestamp } }), {
          status: 200,
          headers,
        });
      }

      // ============
      // 2) GET /timeline?user=<id>
      // ============
      if (path === "/timeline" && request.method === "GET") {
        const userId = url.searchParams.get("user");

        if (!userId) {
          return new Response(JSON.stringify({ ok: false, error: "Missing user" }), {
            status: 400,
            headers,
          });
        }

        const list = await env.MEGAN_TIMELINE.list({ prefix: `${userId}:` });

        const events = [];
        for (const key of list.keys) {
          const raw = await env.MEGAN_TIMELINE.get(key.name);
          if (!raw) continue;

          events.push({
            key: key.name,
            timestamp: Number(key.name.split(":")[1]),
            data: JSON.parse(raw),
          });
        }

        events.sort((a, b) => b.timestamp - a.timestamp);

        return new Response(JSON.stringify({ ok: true, events }), {
          status: 200,
          headers,
        });
      }

      // Default Route
      return new Response("Megan Timeline API v4 is running.", {
        status: 200,
        headers,
      });
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, error: err.stack }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
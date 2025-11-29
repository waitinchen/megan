/**
 * Timeline Worker v4 (Simplified Version)
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
    const url = new URL(request.url);
    const path = url.pathname;

    // POST /timeline
    if (request.method === "POST" && path === "/timeline") {
      const body = await request.json().catch(() => null);

      if (!body || !body.userId || !body.event) {
        return new Response(JSON.stringify({ error: "Missing fields" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const id = `${body.userId}:${Date.now()}`;
      await env.MEGAN_TIMELINE.put(id, JSON.stringify(body.event), {
        expirationTtl: 60 * 60 * 24 * 7, // 7 days
      });

      return new Response(JSON.stringify({ ok: true, id }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // GET /timeline?userId=xxx
    if (request.method === "GET" && path === "/timeline") {
      const userId = url.searchParams.get("userId");

      if (!userId) {
        return new Response(JSON.stringify({ error: "Missing userId" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const prefix = `${userId}:`;
      const list = await env.MEGAN_TIMELINE.list({ prefix });

      const events = await Promise.all(
        list.keys.map(async (k) => {
          const v = await env.MEGAN_TIMELINE.get(k.name);
          return { id: k.name, event: JSON.parse(v) };
        })
      );

      return new Response(JSON.stringify({ events }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Timeline v4 running");
  },
};
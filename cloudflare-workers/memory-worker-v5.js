/**
 * Memory Worker v5 (Simplified Version)
 * 
 * Cloudflare Worker for storing user memories
 * 
 * Setup:
 * 1. Create a new Cloudflare Worker named "megan-memory-v5"
 * 2. Bind KV namespace "MEGAN_MEMORY" with variable name "MEGAN_MEMORY"
 * 3. Deploy this code
 * 4. Set NEXT_PUBLIC_MEMORY_URL to your worker URL
 */

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // GET /memory?key=xxx
      if (request.method === "GET" && path === "/memory") {
        const key = url.searchParams.get("key");

        if (!key) {
          return new Response(JSON.stringify({ error: "Missing key" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const value = await env.MEGAN_MEMORY.get(key);

        return new Response(
          JSON.stringify({ key, value }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // POST /memory
      if (request.method === "POST" && path === "/memory") {
        const body = await request.json().catch(() => null);

        if (!body || !body.key) {
          return new Response(JSON.stringify({ error: "Missing key/value" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        await env.MEGAN_MEMORY.put(body.key, String(body.value));

        return new Response(
          JSON.stringify({ ok: true, stored: body }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // Default route
      return new Response("Megan Memory v5 API is running.", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.stack }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
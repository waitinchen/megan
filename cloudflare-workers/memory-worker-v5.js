/**
 * Memory Service Worker v5 (Enterprise Grade)
 * 
 * Cloudflare Worker for storing user memories with:
 * - Multi-user partitions
 * - TTL (Time To Live)
 * - Memory versioning
 * - Structured keys
 * 
 * Setup:
 * 1. Create a new Cloudflare Worker (or update existing)
 * 2. Bind a KV namespace named "MEGAN_MEMORY"
 * 3. Deploy this code
 * 4. Set NEXT_PUBLIC_MEMORY_API_URL to your worker URL
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
    if (request.method === "OPTIONS") {
      return new Response("", { headers: cors });
    }

    // POST /memory → Save memory with version and TTL
    if (request.method === "POST") {
      try {
        const body = await request.json();
        const { key, value, ttl } = body;

        if (!key) {
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: "VALIDATION_ERROR", message: "Missing required field: key" }
            }),
            {
              status: 400,
              headers: { ...cors, "Content-Type": "application/json" }
            }
          );
        }

        // Validate that value has the correct structure
        if (!value || typeof value !== 'object' || !value.__memory_version) {
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: "VALIDATION_ERROR", message: "Invalid memory value structure. Expected { __memory_version, updatedAt, value }" }
            }),
            {
              status: 400,
              headers: { ...cors, "Content-Type": "application/json" }
            }
          );
        }

        // Default TTL: 30 days (in seconds)
        const expirationTtl = ttl || (60 * 60 * 24 * 30);

        await env.MEGAN_MEMORY.put(key, JSON.stringify(value), {
          expirationTtl,
        });

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

    // GET /memory?key=xxx → Get memory by key
    if (request.method === "GET") {
      try {
        const key = url.searchParams.get("key");

        if (!key) {
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: "VALIDATION_ERROR", message: "Missing required parameter: key" }
            }),
            {
              status: 400,
              headers: { ...cors, "Content-Type": "application/json" }
            }
          );
        }

        const raw = await env.MEGAN_MEMORY.get(key);

        if (!raw) {
          return new Response(
            JSON.stringify({
              success: true,
              data: null
            }),
            {
              headers: { ...cors, "Content-Type": "application/json" }
            }
          );
        }

        try {
          const data = JSON.parse(raw);
          return new Response(
            JSON.stringify({
              success: true,
              data
            }),
            {
              headers: { ...cors, "Content-Type": "application/json" }
            }
          );
        } catch (parseError) {
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: "PARSE_ERROR", message: "Failed to parse stored memory" }
            }),
            {
              status: 500,
              headers: { ...cors, "Content-Type": "application/json" }
            }
          );
        }
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

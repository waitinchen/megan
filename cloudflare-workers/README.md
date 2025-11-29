# Cloudflare Workers Setup Guide

## Timeline Worker (V4)

### Setup Steps:

1. **Create a new Cloudflare Worker**
   - Go to Cloudflare Dashboard → Workers & Pages
   - Click "Create application" → "Create Worker"
   - Name it: `megan-timeline`

2. **Create KV Namespace**
   - In the Worker settings, go to "KV"
   - Click "Create a namespace"
   - Name: `MEGAN_TIMELINE`
   - Bind it to the worker with variable name: `MEGAN_TIMELINE`

3. **Deploy the Code**
   - Copy contents from `timeline-worker.js`
   - Paste into the Worker editor
   - Click "Deploy"

4. **Get Worker URL**
   - Copy the worker URL (e.g., `https://megan-timeline.your-subdomain.workers.dev`)

5. **Set Environment Variable**
   - Add to `.env.local`:
     ```
     NEXT_PUBLIC_TIMELINE_API_URL=https://megan-timeline.your-subdomain.workers.dev
     ```

## Memory Worker v5

### Setup Steps:

1. **Update Existing Memory Worker** (or create new)
   - Go to your existing Memory Worker (or create new: `megan-memory-v5`)
   - Copy contents from `memory-worker-v5.js`
   - Replace the existing code

2. **Ensure KV Namespace is Bound**
   - In Worker settings → KV
   - Make sure `MEGAN_MEMORY` namespace is bound
   - If not, create and bind it

3. **Deploy**
   - Click "Deploy"
   - Verify URL matches `NEXT_PUBLIC_MEMORY_API_URL` in `.env.local`

## Key Structure Reference

### Timeline Keys:
- Event: `timeline:v1:users:${userId}:${eventId}`
- Index: `timeline:v1:index:${userId}`

### Memory Keys (v5):
- Profile: `memory:v5:users:${userId}:profile`
- Tone: `memory:v5:users:${userId}:tone`
- Preferences: `memory:v5:users:${userId}:preferences`
- Relationship: `memory:v5:users:${userId}:relationship`
- Longterm: `memory:v5:users:${userId}:longterm`
- Session Context: `memory:v5:session:${sessionId}:context`

## TTL Settings

- **Timeline Events**: 7 days
- **Memory**: 30 days (default, can be customized per save)

## Testing

After deployment, test the endpoints:

```bash
# Test Timeline
curl -X POST https://your-timeline-worker.workers.dev/timeline \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","event":{"id":"1","role":"user","text":"Hello"}}'

# Test Memory
curl -X POST https://your-memory-worker.workers.dev/memory \
  -H "Content-Type: application/json" \
  -d '{"key":"memory:v5:users:test:profile","value":{"__memory_version":5,"updatedAt":1234567890,"value":{"name":"Test"}},"ttl":2592000}'
```

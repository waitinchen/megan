# Cloudflare Workers Setup Guide (v2025.11)

## Memory Worker v5

### Setup Steps:

1. **Create a new Cloudflare Worker**
   - Go to Cloudflare Dashboard → Workers & Pages
   - Click "Create application" → "Create Worker"
   - Name it: `megan-memory-v5`

2. **Bind KV Namespace**
   - In the Worker settings, go to "KV"
   - Click "Add binding"
   - Variable name: `MEGAN_MEMORY`
   - KV namespace: Select your existing memory namespace (or create new)

3. **Deploy the Code**
   - Copy contents from `memory-worker-v5.js`
   - Paste into the Worker editor
   - Click "Save and Deploy"

4. **Get Worker URL**
   - Copy the worker URL (e.g., `https://megan-memory-v5.your-subdomain.workers.dev`)

5. **Set Environment Variable**
   - Add to `.env.local`:
     ```
     NEXT_PUBLIC_MEMORY_URL=https://megan-memory-v5.your-subdomain.workers.dev
     ```

### API Endpoints:

- **GET** `/memory?key=xxx` - Get memory value by key
- **POST** `/memory` - Save memory with key and value

### Example:

```bash
# Save memory
curl -X POST https://megan-memory-v5.your-subdomain.workers.dev/memory \
  -H "Content-Type: application/json" \
  -d '{"key":"memory:v5:users:123:profile","value":"{\"name\":\"Test\"}"}'

# Get memory
curl "https://megan-memory-v5.your-subdomain.workers.dev/memory?key=memory:v5:users:123:profile"
```

---

## Timeline Worker v4

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
   - Click "Save and Deploy"

4. **Get Worker URL**
   - Copy the worker URL (e.g., `https://megan-timeline.your-subdomain.workers.dev`)

5. **Set Environment Variable**
   - Add to `.env.local`:
     ```
     NEXT_PUBLIC_TIMELINE_URL=https://megan-timeline.your-subdomain.workers.dev
     ```

### API Endpoints:

- **POST** `/timeline` - Save a timeline event
- **GET** `/timeline?userId=xxx` - Get all timeline events for a user

### Example:

```bash
# Save timeline event
curl -X POST https://megan-timeline.your-subdomain.workers.dev/timeline \
  -H "Content-Type: application/json" \
  -d '{"userId":"123","event":{"id":"1","role":"user","text":"Hello","timestamp":1234567890}}'

# Get timeline events
curl "https://megan-timeline.your-subdomain.workers.dev/timeline?userId=123"
```

---

## Key Structure Reference

### Timeline Keys:
- Format: `${userId}:${timestamp}`
- TTL: 7 days

### Memory Keys (v5):
- Profile: `memory:v5:users:${userId}:profile`
- Tone: `memory:v5:users:${userId}:tone`
- Preferences: `memory:v5:users:${userId}:preferences`
- Relationship: `memory:v5:users:${userId}:relationship`
- Longterm: `memory:v5:users:${userId}:longterm`

---

## Environment Variables

Make sure to set these in your `.env.local` or Railway environment:

```env
NEXT_PUBLIC_MEMORY_URL=https://megan-memory-v5.your-subdomain.workers.dev
NEXT_PUBLIC_TIMELINE_URL=https://megan-timeline.your-subdomain.workers.dev
```

---

## Testing Checklist

### Memory v5
- [ ] Worker deployed and accessible
- [ ] KV namespace bound correctly
- [ ] POST `/memory` works
- [ ] GET `/memory?key=xxx` works
- [ ] Environment variable set correctly

### Timeline v4
- [ ] Worker deployed and accessible
- [ ] KV namespace created and bound
- [ ] POST `/timeline` works
- [ ] GET `/timeline?userId=xxx` works
- [ ] TTL set to 7 days
- [ ] Environment variable set correctly

### Next.js Integration
- [ ] Memory Service v5 imported correctly
- [ ] Timeline Service imported correctly
- [ ] API routes return unified format
- [ ] Frontend saves to Timeline when chatting
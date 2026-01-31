---
name: Mock API Server CLI
description: Spin up mock REST APIs instantly. JSON file to API. OpenAPI support. Hot reload. Free mock server.
tags: [mock, api, server, rest, testing, openapi, cli, development]
---

# Mock API Server CLI

Spin up mock APIs in seconds.

**JSON → API. OpenAPI → Server. Just works.**

## Quick Start

```bash
npm install -g mockapi-cli
```

```bash
# From JSON file
mockapi start db.json

# From OpenAPI spec
mockapi start openapi.yaml

# Quick mock
mockapi quick '{"users": [{"id": 1, "name": "John"}]}'
```

## JSON File Format

```json
// db.json
{
  "users": [
    { "id": 1, "name": "John" },
    { "id": 2, "name": "Jane" }
  ],
  "posts": [
    { "id": 1, "title": "Hello", "userId": 1 }
  ]
}
```

**Generated Routes:**
- GET /users
- GET /users/:id
- POST /users
- PUT /users/:id
- DELETE /users/:id
- (same for posts)

## Commands

```bash
# Start server
mockapi start db.json

# Custom port
mockapi start db.json --port 4000

# With delay (simulate latency)
mockapi start db.json --delay 500

# With random errors
mockapi start db.json --chaos 10

# Watch for changes
mockapi start db.json --watch

# CORS enabled
mockapi start db.json --cors
```

## Advanced Features

```bash
# Custom routes
mockapi start --routes routes.js

# Middleware
mockapi start db.json --middleware auth.js

# Record mode (save requests)
mockapi start db.json --record

# Replay mode
mockapi replay recorded.json
```

## Route Customization

```javascript
// routes.js
module.exports = {
  '/api/auth/login': (req, res) => {
    res.json({ token: 'mock-token' });
  },
  '/api/slow': {
    delay: 2000,
    response: { status: 'ok' }
  }
};
```

## When to Use This

- Frontend development
- API prototyping
- Integration testing
- Demo environments
- Offline development

---

**Built by [LXGIC Studios](https://lxgicstudios.com)**

🔗 [GitHub](https://github.com/lxgicstudios/mockapi) · [Twitter](https://x.com/lxgicstudios)

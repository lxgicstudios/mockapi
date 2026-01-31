# @lxgicstudios/mockapi

Spin up a mock REST API server from JSON files in seconds.

No config needed. Just run it.

## Installation

```bash
# Use directly with npx (recommended)
npx @lxgicstudios/mockapi db.json

# Or install globally
npm install -g @lxgicstudios/mockapi
```

## Quick Start

```bash
# Create example db.json
npx @lxgicstudios/mockapi --init

# Start the server
npx @lxgicstudios/mockapi db.json
```

## Usage

```bash
# Basic usage
npx @lxgicstudios/mockapi data.json

# Custom port
npx @lxgicstudios/mockapi db.json -p 8080

# Watch for changes
npx @lxgicstudios/mockapi db.json --watch

# Read-only mode
npx @lxgicstudios/mockapi db.json --readonly

# Simulate latency
npx @lxgicstudios/mockapi db.json --delay 500
```

## Data File Format

```json
{
  "users": [
    { "id": 1, "name": "Alice", "email": "alice@example.com" },
    { "id": 2, "name": "Bob", "email": "bob@example.com" }
  ],
  "posts": [
    { "id": 1, "title": "Hello", "body": "Content", "userId": 1 }
  ]
}
```

## Generated Routes

For each resource (e.g., `users`), you get:

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/users` | List all users |
| GET | `/users/:id` | Get user by id |
| POST | `/users` | Create user |
| PUT | `/users/:id` | Replace user |
| PATCH | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |

## Query Parameters

```bash
# Filter
GET /users?name=Alice

# Pagination
GET /users?_page=1&_limit=10

# Sorting
GET /users?_sort=name&_order=asc
```

## Options

| Option | Description |
|--------|-------------|
| `-p, --port <number>` | Port (default: 3001) |
| `-d, --delay <ms>` | Response delay |
| `-w, --watch` | Watch file for changes |
| `-r, --readonly` | Disable mutations |
| `--no-cors` | Disable CORS |
| `--init` | Create example db.json |

## Features

- ✅ Full CRUD operations
- ✅ Automatic ID generation
- ✅ Filtering and pagination
- ✅ Sorting
- ✅ CORS enabled by default
- ✅ Hot reload with `--watch`
- ✅ Zero config
- ✅ Persistent changes to JSON file

## Programmatic API

```typescript
import { createMockServer } from '@lxgicstudios/mockapi';

const server = createMockServer('db.json', {
  port: 3001,
  delay: 100,
  cors: true,
  watch: true,
  readonly: false
});

server.listen();

// Later...
server.close();
```

---

**Built by [LXGIC Studios](https://lxgicstudios.com)**

🔗 [GitHub](https://github.com/lxgicstudios/mockapi) · [Twitter](https://x.com/lxgicstudios)

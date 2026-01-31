#!/usr/bin/env node

import { existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { createMockServer } from './index.js';

const args = process.argv.slice(2);

const HELP = `
mockapi - Spin up a mock REST API server from JSON files

USAGE:
  npx @lxgicstudios/mockapi <file.json>        Start server with data file
  npx @lxgicstudios/mockapi --init             Create example db.json
  npx @lxgicstudios/mockapi db.json -p 3001    Custom port

OPTIONS:
  -p, --port <number>      Port to listen on (default: 3001)
  -d, --delay <ms>         Add delay to responses (default: 0)
  -w, --watch              Watch file for changes
  -r, --readonly           Disable POST/PUT/PATCH/DELETE
  --no-cors                Disable CORS headers
  --init                   Create example db.json file
  -h, --help               Show this help message
  -v, --version            Show version

DATA FILE FORMAT:
  {
    "users": [
      { "id": 1, "name": "Alice" },
      { "id": 2, "name": "Bob" }
    ],
    "posts": [
      { "id": 1, "title": "Hello", "userId": 1 }
    ]
  }

GENERATED ROUTES:
  GET    /users          List all users
  GET    /users/:id      Get user by id
  POST   /users          Create user
  PUT    /users/:id      Replace user
  PATCH  /users/:id      Update user
  DELETE /users/:id      Delete user

QUERY PARAMS:
  ?name=Alice             Filter by field
  ?_page=1&_limit=10      Pagination
  ?_sort=name&_order=asc  Sorting

EXAMPLES:
  npx @lxgicstudios/mockapi db.json
  npx @lxgicstudios/mockapi api/data.json -p 8080 --watch
  npx @lxgicstudios/mockapi --init && npx @lxgicstudios/mockapi db.json

Built by LXGIC Studios · https://github.com/lxgicstudios/mockapi
`;

const EXAMPLE_DATA = {
  users: [
    { id: 1, name: "Alice", email: "alice@example.com" },
    { id: 2, name: "Bob", email: "bob@example.com" },
    { id: 3, name: "Charlie", email: "charlie@example.com" }
  ],
  posts: [
    { id: 1, title: "Hello World", body: "First post content", userId: 1 },
    { id: 2, title: "Second Post", body: "More content here", userId: 1 },
    { id: 3, title: "Bob's Post", body: "Bob's content", userId: 2 }
  ],
  comments: [
    { id: 1, body: "Great post!", postId: 1, userId: 2 },
    { id: 2, body: "Thanks!", postId: 1, userId: 1 }
  ]
};

function colorize(text: string, color: string): string {
  const colors: Record<string, string> = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m',
    reset: '\x1b[0m',
  };
  return `${colors[color] || ''}${text}${colors.reset}`;
}

function printError(msg: string): void {
  console.error(colorize('✗ ', 'red') + msg);
}

function printSuccess(msg: string): void {
  console.log(colorize('✓ ', 'green') + msg);
}

function printInfo(msg: string): void {
  console.log(colorize('ℹ ', 'blue') + msg);
}

function getArg(flags: string[]): string | undefined {
  for (const flag of flags) {
    const idx = args.indexOf(flag);
    if (idx !== -1 && args[idx + 1]) {
      return args[idx + 1];
    }
  }
  return undefined;
}

function hasFlag(flags: string[]): boolean {
  return flags.some(f => args.includes(f));
}

async function main(): Promise<void> {
  if (hasFlag(['-h', '--help'])) {
    console.log(HELP);
    process.exit(0);
  }

  if (hasFlag(['-v', '--version'])) {
    console.log('1.0.0');
    process.exit(0);
  }

  // Init mode
  if (hasFlag(['--init'])) {
    const dbPath = resolve(process.cwd(), 'db.json');
    if (existsSync(dbPath)) {
      printError('db.json already exists');
      process.exit(1);
    }
    writeFileSync(dbPath, JSON.stringify(EXAMPLE_DATA, null, 2));
    printSuccess('Created db.json with example data');
    printInfo('Run: npx @lxgicstudios/mockapi db.json');
    process.exit(0);
  }

  // Get data file
  let dataFile = args.find(a => !a.startsWith('-') && a.endsWith('.json'));
  if (!dataFile) {
    // Check for positional arg
    const positional = args.find(a => !a.startsWith('-'));
    if (positional) {
      dataFile = positional;
    } else if (existsSync('db.json')) {
      dataFile = 'db.json';
    } else {
      printError('Please specify a JSON data file');
      printInfo('Run with --init to create an example db.json');
      console.log(HELP);
      process.exit(1);
    }
  }

  const dataPath = resolve(process.cwd(), dataFile);
  if (!existsSync(dataPath)) {
    printError(`File not found: ${dataFile}`);
    process.exit(1);
  }

  // Parse options
  const port = parseInt(getArg(['-p', '--port']) || '3001');
  const delay = parseInt(getArg(['-d', '--delay']) || '0');
  const watch = hasFlag(['-w', '--watch']);
  const readonly = hasFlag(['-r', '--readonly']);
  const cors = !hasFlag(['--no-cors']);

  try {
    console.log('');
    console.log(colorize('  Mock API Server', 'cyan'));
    console.log(colorize('  ───────────────', 'dim'));
    console.log('');
    
    if (readonly) {
      printInfo('Running in read-only mode');
    }
    if (delay > 0) {
      printInfo(`Simulating ${delay}ms latency`);
    }
    if (watch) {
      printInfo('Watching for file changes');
    }
    console.log('');

    const server = createMockServer(dataPath, {
      port,
      delay,
      cors,
      watch,
      readonly
    });

    server.listen();

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n');
      printInfo('Shutting down...');
      server.close();
      process.exit(0);
    });

  } catch (err) {
    printError(err instanceof Error ? err.message : 'Unknown error');
    process.exit(1);
  }
}

main().catch(err => {
  printError(err.message || 'An unexpected error occurred');
  process.exit(1);
});

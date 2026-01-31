import { createServer, IncomingMessage, ServerResponse } from 'http';
import { readFileSync, existsSync, writeFileSync, watchFile } from 'fs';
import { parse } from 'url';

export interface MockApiOptions {
  port?: number;
  delay?: number;
  cors?: boolean;
  watch?: boolean;
  readonly?: boolean;
}

export interface RouteHandler {
  method: string;
  path: RegExp;
  handler: (req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body?: any) => void;
}

type DataStore = Record<string, any[]>;

/**
 * Create a mock API server
 */
export function createMockServer(dataFile: string, options: MockApiOptions = {}) {
  const {
    port = 3001,
    delay = 0,
    cors = true,
    watch = false,
    readonly = false
  } = options;

  let data: DataStore = {};

  function loadData() {
    if (!existsSync(dataFile)) {
      throw new Error(`Data file not found: ${dataFile}`);
    }
    const content = readFileSync(dataFile, 'utf-8');
    data = JSON.parse(content);
  }

  function saveData() {
    if (!readonly) {
      writeFileSync(dataFile, JSON.stringify(data, null, 2));
    }
  }

  loadData();

  if (watch) {
    watchFile(dataFile, () => {
      try {
        loadData();
        console.log('Data reloaded');
      } catch (e) {
        console.error('Failed to reload data:', e);
      }
    });
  }

  // Generate routes from data
  const routes: RouteHandler[] = [];

  for (const resource of Object.keys(data)) {
    // GET /resource - list all
    routes.push({
      method: 'GET',
      path: new RegExp(`^/${resource}$`),
      handler: (req, res) => {
        const url = parse(req.url || '', true);
        let items = data[resource] || [];

        // Simple filtering
        for (const [key, value] of Object.entries(url.query)) {
          if (key !== '_page' && key !== '_limit' && key !== '_sort' && key !== '_order') {
            items = items.filter(item => String(item[key]) === String(value));
          }
        }

        // Pagination
        const page = parseInt(url.query._page as string) || 1;
        const limit = parseInt(url.query._limit as string) || items.length;
        const start = (page - 1) * limit;
        const paged = items.slice(start, start + limit);

        // Sorting
        if (url.query._sort) {
          const sortKey = url.query._sort as string;
          const order = url.query._order === 'desc' ? -1 : 1;
          paged.sort((a, b) => {
            if (a[sortKey] < b[sortKey]) return -1 * order;
            if (a[sortKey] > b[sortKey]) return 1 * order;
            return 0;
          });
        }

        res.setHeader('X-Total-Count', items.length.toString());
        sendJson(res, 200, paged);
      }
    });

    // GET /resource/:id - get one
    routes.push({
      method: 'GET',
      path: new RegExp(`^/${resource}/([^/]+)$`),
      handler: (req, res, params) => {
        const items = data[resource] || [];
        const item = items.find(i => String(i.id) === params.id);
        
        if (!item) {
          sendJson(res, 404, { error: 'Not found' });
          return;
        }
        
        sendJson(res, 200, item);
      }
    });

    // POST /resource - create
    routes.push({
      method: 'POST',
      path: new RegExp(`^/${resource}$`),
      handler: (req, res, params, body) => {
        if (readonly) {
          sendJson(res, 403, { error: 'Server is in read-only mode' });
          return;
        }

        const items = data[resource] || [];
        const newId = items.length > 0 ? Math.max(...items.map(i => i.id || 0)) + 1 : 1;
        const newItem = { id: newId, ...body };
        
        items.push(newItem);
        data[resource] = items;
        saveData();
        
        sendJson(res, 201, newItem);
      }
    });

    // PUT /resource/:id - replace
    routes.push({
      method: 'PUT',
      path: new RegExp(`^/${resource}/([^/]+)$`),
      handler: (req, res, params, body) => {
        if (readonly) {
          sendJson(res, 403, { error: 'Server is in read-only mode' });
          return;
        }

        const items = data[resource] || [];
        const idx = items.findIndex(i => String(i.id) === params.id);
        
        if (idx === -1) {
          sendJson(res, 404, { error: 'Not found' });
          return;
        }
        
        const updated = { id: items[idx].id, ...body };
        items[idx] = updated;
        data[resource] = items;
        saveData();
        
        sendJson(res, 200, updated);
      }
    });

    // PATCH /resource/:id - partial update
    routes.push({
      method: 'PATCH',
      path: new RegExp(`^/${resource}/([^/]+)$`),
      handler: (req, res, params, body) => {
        if (readonly) {
          sendJson(res, 403, { error: 'Server is in read-only mode' });
          return;
        }

        const items = data[resource] || [];
        const idx = items.findIndex(i => String(i.id) === params.id);
        
        if (idx === -1) {
          sendJson(res, 404, { error: 'Not found' });
          return;
        }
        
        const updated = { ...items[idx], ...body };
        items[idx] = updated;
        data[resource] = items;
        saveData();
        
        sendJson(res, 200, updated);
      }
    });

    // DELETE /resource/:id - delete
    routes.push({
      method: 'DELETE',
      path: new RegExp(`^/${resource}/([^/]+)$`),
      handler: (req, res, params) => {
        if (readonly) {
          sendJson(res, 403, { error: 'Server is in read-only mode' });
          return;
        }

        const items = data[resource] || [];
        const idx = items.findIndex(i => String(i.id) === params.id);
        
        if (idx === -1) {
          sendJson(res, 404, { error: 'Not found' });
          return;
        }
        
        items.splice(idx, 1);
        data[resource] = items;
        saveData();
        
        sendJson(res, 200, {});
      }
    });
  }

  function sendJson(res: ServerResponse, status: number, data: any) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  }

  function handleRequest(req: IncomingMessage, res: ServerResponse) {
    // CORS
    if (cors) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');
    }

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    const url = parse(req.url || '', true);
    const pathname = url.pathname || '/';

    // Find matching route
    for (const route of routes) {
      if (req.method !== route.method) continue;
      
      const match = pathname.match(route.path);
      if (!match) continue;

      const params: Record<string, string> = {};
      if (match[1]) params.id = match[1];

      // Parse body for POST/PUT/PATCH
      if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          let parsed;
          try {
            parsed = body ? JSON.parse(body) : {};
          } catch {
            sendJson(res, 400, { error: 'Invalid JSON' });
            return;
          }

          if (delay > 0) {
            setTimeout(() => route.handler(req, res, params, parsed), delay);
          } else {
            route.handler(req, res, params, parsed);
          }
        });
        return;
      }

      if (delay > 0) {
        setTimeout(() => route.handler(req, res, params), delay);
      } else {
        route.handler(req, res, params);
      }
      return;
    }

    // 404
    sendJson(res, 404, { error: 'Not found' });
  }

  const server = createServer(handleRequest);

  return {
    listen: () => {
      server.listen(port, () => {
        console.log(`Mock API running at http://localhost:${port}`);
        console.log('');
        console.log('Resources:');
        for (const resource of Object.keys(data)) {
          console.log(`  http://localhost:${port}/${resource}`);
        }
      });
    },
    close: () => server.close(),
    server
  };
}

# Hono My Router Module

An advanced routing module for Hono that provides automatic route file scanning, typed parameter extraction, and robust error handling.

## 🚀 Features

- **Automatic Scanning**: Automatically detects route files in your folder structure
- **TypeScript Typing**: Full TypeScript support with type safety
- **Dynamic Routes**: Support for single, multiple, and variable segment parameters
- **Parameter Validation**: Automatic parameter validation with customizable configuration
- **Error Handling**: Robust 404 and validation error handling system
- **Nested Routes**: Full support for complex nested routes
- **Route Metadata**: Metadata system for documentation and configuration

## 🔧 Performance Optimization

### Using path-to-regexp to Maximize Response Times

This module uses the `path-to-regexp` library to significantly optimize routing performance through advanced pattern compilation and matching techniques:


#### ⚡ Optimized Matching with Regular Expressions

- **Single Compilation**: Route patterns are compiled to optimized regular expressions during router initialization
- **Native Matching**: Uses the native JavaScript RegExp engine for ultra-fast matching
- **Efficient Extraction**: Parameters are extracted in a single pass using named capture groups

#### 📊 Performance Advantages

| Aspect | Manual String Matching | path-to-regexp |
|---------|----------------------|----------------|
| **Compilation** | On each request | Once only |
| **Matching** | O(n) iterative | O(1) native RegExp |
| **Parameter Extraction** | Manual parsing | Capture groups |
| **Memory** | Constant recalculation | Optimized cache |
| **CPU** | High usage per request | Minimal usage per request |

## 📦 Installation

```bash
npm install hono-my-router
# or
pnpm add hono-my-router
# or
yarn add hono-my-router
```

## 🛠️ Basic Usage

### Quick Setup

```typescript
import { createHonoRouterApp } from 'hono-my-router';

// Create application with configured router
const { app, router, result } = await createHonoRouterApp({
  routesDirectory: './src/routes',
  enableLogging: true,
  enableParameterValidation: true
});

// Start server
export default {
  port: 3000,
  fetch: app.fetch
};
```

### Manual Configuration

```typescript
import { Router } from 'hono-my-router';
import { Hono } from 'hono';

const app = new Hono();
const router = new Router({
  routesDirectory: './src/routes',
  enableLogging: true,
  enableParameterValidation: true,
  errorHandling: {
    enable404Handler: true,
    enableValidationErrors: true
  }
});

// Initialize router
const result = await router.initialize();

// Mount routes
app.route('/', router.getApp());

console.log(`Router initialized with ${result.totalRoutes} routes`);
```

## 📁 Route File Structure

### Supported Route Types

#### 1. Simple Routes
```
src/routes/api/users/index.ts → /api/users
src/routes/api/health.ts → /api/health
```

#### 2. Single Parameters
```
src/routes/api/users/[id].ts → /api/users/:id
src/routes/api/posts/[slug].ts → /api/posts/:slug
```

#### 3. Nested Routes
```
src/routes/api/users/[id]/profile.ts → /api/users/:id/profile
src/routes/api/users/[id]/posts/[postId].ts → /api/users/:id/posts/:postId
```

#### 4. Variable Segments
```
src/routes/api/products/[...segments].ts → /api/products/*
```

## 📝 Handler Definition

### Basic Handler

```typescript
// src/routes/api/users/index.ts
import { ExtendedContext } from 'hono-my-router/types';

export async function get(c: ExtendedContext) {
  return c.json({
    success: true,
    data: await getUsers(),
    route: c.route
  });
}

export async function post(c: ExtendedContext) {
  const body = await c.req.json();
  const user = await createUser(body);
  
  return c.json({
    success: true,
    data: user
  }, 201);
}
```

### Handler with Parameters

```typescript
// src/routes/api/users/[id].ts
import { ExtendedContext } from 'hono-my-router/types';

export async function get(c: ExtendedContext) {
  const { id } = c.params; // Automatic typing
  const user = await getUserById(parseInt(id));
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  return c.json({
    success: true,
    data: user,
    params: c.params
  });
}

// Validation configuration
export const paramValidation = {
  id: {
    type: 'number',
    required: true,
    min: 1
  }
};
```

### Handler with Variable Segments

```typescript
// src/routes/api/products/[...segments].ts
import { ExtendedContext } from 'hono-my-router/types';

export async function get(c: ExtendedContext) {
  const { segments } = c.params;
  // segments = ['electronics', 'phones', 'smartphones']
  
  const products = await getProductsByCategory(segments);
  
  return c.json({
    success: true,
    data: products,
    categoryPath: segments
  });
}

export const paramValidation = {
  segments: {
    type: 'array',
    required: true,
    minLength: 1,
    maxLength: 5
  }
};
```

## ⚙️ Configuration

### RouterConfig

```typescript
interface RouterConfig {
  routesDirectory: string;              // Routes directory
  enableLogging?: boolean;              // Enable logging
  enableParameterValidation?: boolean;  // Parameter validation
  errorHandling?: {
    enable404Handler?: boolean;         // Automatic 404 handler
    enableValidationErrors?: boolean;   // Validation errors
  };
}
```

### Parameter Validation

```typescript
export const paramValidation = {
  id: {
    type: 'number',
    required: true,
    min: 1,
    max: 999999,
    description: 'User ID'
  },
  slug: {
    type: 'string',
    required: true,
    pattern: /^[a-z0-9-]+$/,
    minLength: 3,
    maxLength: 50
  },
  segments: {
    type: 'array',
    required: true,
    minLength: 1,
    maxLength: 10
  }
};
```

### Route Metadata

```typescript
export const routeMetadata = {
  description: 'User management',
  tags: ['users', 'crud'],
  version: '1.0.0',
  parameters: {
    id: {
      type: 'integer',
      description: 'Unique user identifier',
      example: 123
    }
  }
};
```

## 🚀 Advanced API

### Utility Functions

```typescript
import {
  createHonoRouterApp,
  setupRoutes,
  validateRouterConfig,
  createDefaultConfig,
  normalizePath,
  extractRouteParameters
} from 'hono-my-router';

// Create complete application
const { app, router } = await createHonoRouterApp(config);

// Configure routes in existing app
const existingApp = new Hono();
const { router } = await setupRoutes(existingApp, config);

// Validate configuration
const { isValid, errors } = validateRouterConfig(config);

// Create default configuration
const defaultConfig = createDefaultConfig({ enableLogging: true });
```

### Router Utilities

```typescript
import { Router } from 'hono-my-router';

const router = new Router({
  routesDirectory: './src/routes',
  enableLogging: true,
  enableParameterValidation: true
});

// Get router statistics
const stats = router.getStats();
console.log(`Registered routes: ${stats.totalRoutes}`);
console.log(`Active handlers: ${stats.totalHandlers}`);

// Get registered route information
const routes = router.getRegisteredRoutes();
routes.forEach(route => {
  console.log(`${route.method} ${route.path} -> ${route.filePath}`);
});

// Check if a route exists
const exists = router.hasRoute('GET', '/api/users/:id');
console.log(`Route exists: ${exists}`);
```

### Router Statistics

```typescript
const stats = router.getStats();
console.log({
  totalRoutes: stats.totalRoutes,
  lastScanTime: stats.lastScanTime,
  routesByType: stats.routesByType
});
```

### Registered Route Information

```typescript
const routes = router.getRegisteredRoutes();
routes.forEach(route => {
  console.log({
    path: route.path,
    type: route.type,
    methods: route.methods,
    filePath: route.filePath
  });
});
```

## 🚨 Error Handling

### Automatic 404 Errors

```typescript
// Automatic 404 configuration
const router = new Router({
  routesDirectory: './src/routes',
  errorHandling: {
    enable404Handler: true
  }
});
```

#### 404 Errors
```typescript
// Automatic configuration
const router = new Router({
  routesDirectory: './src/routes',
  errorHandling: {
    enable404Handler: true
  }
});

// Custom 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Endpoint not found',
    path: c.req.path,
    method: c.req.method
  }, 404);
});
```

### Validation Errors

```typescript
// Validation errors are handled automatically
// Automatic response for invalid parameters:
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "id": "Must be a number between 1 and 999999"
  }
}
```

#### Validation Errors
```typescript
// src/routes/api/users/[id].ts
export const paramValidation = {
  id: {
    type: 'number',
    required: true,
    min: 1,
    errorMessage: 'ID must be a positive number'
  }
};

export async function get(c: ExtendedContext) {
  // If validation fails, it automatically returns:
  // {
  //   error: 'Validation failed',
  //   details: 'ID must be a positive number',
  //   parameter: 'id',
  //   value: 'invalid-value'
  // }
  
  const { id } = c.params; // Here id is already validated
  // ... rest of handler
}
```

### Custom Error Handler

```typescript
import { ErrorHandler } from 'hono-my-router';

const errorHandler = new ErrorHandler({
  enable404Handler: true,
  enableValidationErrors: true
});

// Customize 404 response
errorHandler.handle404 = async (c) => {
  return c.json({
    error: 'Route not found',
    path: c.req.path,
    method: c.req.method,
    timestamp: new Date().toISOString()
  }, 404);
};
```

#### Custom Error Handling
```typescript
// src/routes/api/users/[id].ts
import { ErrorHandler } from 'hono-my-router';

export async function get(c: ExtendedContext) {
  try {
    const { id } = c.params;
    const user = await getUserById(parseInt(id));
    
    if (!user) {
      throw new ErrorHandler('User not found', 404, {
        userId: id,
        timestamp: new Date().toISOString()
      });
    }
    
    return c.json({ success: true, data: user });
  } catch (error) {
    if (error instanceof ErrorHandler) {
      return c.json({
        error: error.message,
        statusCode: error.statusCode,
        metadata: error.metadata
      }, error.statusCode);
    }
    
    // Generic error
    return c.json({ error: 'Internal server error' }, 500);
  }
}
```

## 📊 Complete Examples

### Example 1: Basic REST API

```typescript
// src/app.ts
import { createHonoRouterApp } from 'hono-my-router';

const { app } = await createHonoRouterApp({
  routesDirectory: './src/routes',
  enableLogging: true,
  enableParameterValidation: true
});

export default app;
```

```typescript
// src/routes/api/users/index.ts
export async function get(c) {
  return c.json({ users: await getUsers() });
}

export async function post(c) {
  const user = await createUser(await c.req.json());
  return c.json({ user }, 201);
}
```

### Example 2: API with Authentication

```typescript
// src/routes/api/protected/[...path].ts
import { ExtendedContext } from 'hono-my-router/types';

export async function get(c: ExtendedContext) {
  // Verificar autenticación
  const token = c.req.header('Authorization');
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const { path } = c.params;
  return c.json({
    message: `Authorized access to: ${path.join('/')}`,
    user: await getUserFromToken(token)
  });
}
```

### Example 3: Complete Authentication Route

```typescript
// src/routes/api/auth/[...path].ts
import { ExtendedContext } from 'hono-my-router/types';

export async function get(c: ExtendedContext) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token || !isValidToken(token)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const { path } = c.params;
  return c.json({
    message: `Authorized access to: ${path.join('/')}`,
    user: await getUserFromToken(token)
  });
}

export const paramValidation = {
  path: {
    type: 'array',
    required: true,
    minLength: 1
  }
};

export const routeMetadata = {
  description: 'Protected routes with authentication',
  tags: ['auth', 'protected'],
  requiresAuth: true
};
```

## 🧪 Testing

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
};
```

### Test Example

```typescript
// tests/router.test.ts
import { Router } from '../src';
import { Hono } from 'hono';

describe('Router', () => {
  let app: Hono;
  let router: Router;

  beforeEach(() => {
    app = new Hono();
    router = new Router({
      routesDirectory: './tests/fixtures/routes'
    });
  });

  test('should register routes correctly', async () => {
    await router.initialize(app);
    const routes = router.getRegisteredRoutes();
    
    expect(routes).toHaveLength(3);
    expect(routes[0].path).toBe('/api/users');
    expect(routes[0].method).toBe('GET');
  });

  test('should handle parameters validation', async () => {
    await router.initialize(app);
    
    const res = await app.request('/api/users/invalid-id');
    expect(res.status).toBe(400);
    
    const json = await res.json();
    expect(json.error).toBe('Validation failed');
  });
});
```

```bash
# Ejecutar tests
npm test

# Tests con cobertura
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

## 📜 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build the project
npm run test         # Run tests
npm run test:watch   # Tests in watch mode
npm run test:coverage # Tests with coverage

# Code quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting errors
npm run type-check   # Check TypeScript types

# Publishing
npm run prepublishOnly # Prepare for publishing
npm publish          # Publish to npm
```

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow existing code conventions
- Add tests for new functionality
- Update documentation when necessary
- Ensure all tests pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Hono Documentation](https://hono.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Node.js](https://nodejs.org/)
- [NPM Package](https://www.npmjs.com/package/hono-my-router)

---

**Like this project?** ⭐ Give it a star on GitHub!

**Found a bug?** 🐛 [Report an issue](https://github.com/tu-usuario/hono-my-router/issues)

**Want to contribute?** 🚀 [Read the contribution guide](CONTRIBUTING.md)
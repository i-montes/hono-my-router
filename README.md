# Hono My Router Module

Un módulo avanzado de enrutamiento para Hono que proporciona escaneo automático de archivos de rutas, extracción de parámetros tipada y manejo robusto de errores.

## 🚀 Características

- **Escaneo Automático**: Detecta automáticamente archivos de rutas en tu estructura de carpetas
- **Tipado TypeScript**: Soporte completo para TypeScript con tipos seguros
- **Rutas Dinámicas**: Soporte para parámetros únicos, múltiples y segmentos variables
- **Validación de Parámetros**: Validación automática de parámetros con configuración personalizable
- **Manejo de Errores**: Sistema robusto de manejo de errores 404 y validación
- **Rutas Anidadas**: Soporte completo para rutas anidadas complejas
- **Metadatos de Rutas**: Sistema de metadatos para documentación y configuración

## 🔧 Optimización de Rendimiento

### Uso de path-to-regexp para Maximizar Tiempos de Respuesta

Este módulo utiliza la librería `path-to-regexp` para optimizar significativamente el rendimiento del enrutamiento mediante técnicas avanzadas de compilación y matching de patrones:


#### ⚡ Matching Optimizado con Expresiones Regulares

- **Compilación Única**: Los patrones de rutas se compilan a expresiones regulares optimizadas durante la inicialización del router
- **Matching Nativo**: Utiliza el motor de RegExp nativo del JavaScript engine para matching ultra-rápido
- **Extracción Eficiente**: Los parámetros se extraen en una sola pasada usando grupos de captura nombrados

#### 📊 Ventajas de Rendimiento

| Aspecto | String Matching Manual | path-to-regexp |
|---------|----------------------|----------------|
| **Compilación** | En cada request | Una sola vez |
| **Matching** | O(n) iterativo | O(1) RegExp nativo |
| **Extracción de Parámetros** | Parsing manual | Grupos de captura |
| **Memoria** | Recálculo constante | Cache optimizado |
| **CPU** | Alto uso por request | Mínimo uso por request |

## 📦 Instalación

```bash
npm install hono-my-router
# o
pnpm add hono-my-router
# o
yarn add hono-my-router
```

## 🛠️ Uso Básico

### Configuración Rápida

```typescript
import { createHonoRouterApp } from 'hono-my-router';

// Crear aplicación con router configurado
const { app, router, result } = await createHonoRouterApp({
  routesDirectory: './src/routes',
  enableLogging: true,
  enableParameterValidation: true
});

// Iniciar servidor
export default {
  port: 3000,
  fetch: app.fetch
};
```

### Configuración Manual

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

// Inicializar router
const result = await router.initialize();

// Montar rutas
app.route('/', router.getApp());

console.log(`Router inicializado con ${result.totalRoutes} rutas`);
```

## 📁 Estructura de Archivos de Rutas

### Tipos de Rutas Soportadas

#### 1. Rutas Simples
```
src/routes/api/users/index.ts → /api/users
src/routes/api/health.ts → /api/health
```

#### 2. Parámetros Únicos
```
src/routes/api/users/[id].ts → /api/users/:id
src/routes/api/posts/[slug].ts → /api/posts/:slug
```

#### 3. Rutas Anidadas
```
src/routes/api/users/[id]/profile.ts → /api/users/:id/profile
src/routes/api/users/[id]/posts/[postId].ts → /api/users/:id/posts/:postId
```

#### 4. Segmentos Variables
```
src/routes/api/products/[...segments].ts → /api/products/*
```

## 📝 Definición de Handlers

### Handler Básico

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

### Handler con Parámetros

```typescript
// src/routes/api/users/[id].ts
import { ExtendedContext } from 'hono-my-router/types';

export async function get(c: ExtendedContext) {
  const { id } = c.params; // Tipado automático
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

// Configuración de validación
export const paramValidation = {
  id: {
    type: 'number',
    required: true,
    min: 1
  }
};
```

### Handler con Segmentos Variables

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

## ⚙️ Configuración

### RouterConfig

```typescript
interface RouterConfig {
  routesDirectory: string;              // Directorio de rutas
  enableLogging?: boolean;              // Habilitar logging
  enableParameterValidation?: boolean;  // Validación de parámetros
  errorHandling?: {
    enable404Handler?: boolean;         // Handler 404 automático
    enableValidationErrors?: boolean;   // Errores de validación
  };
}
```

### Validación de Parámetros

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

### Metadatos de Rutas

```typescript
export const routeMetadata = {
  description: 'Gestión de usuarios',
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

## 🔧 API Avanzada

### Funciones de Utilidad

```typescript
import {
  createHonoRouterApp,
  setupRoutes,
  validateRouterConfig,
  createDefaultConfig,
  normalizePath,
  extractRouteParameters
} from 'hono-my-router';

// Crear aplicación completa
const { app, router } = await createHonoRouterApp(config);

// Configurar rutas en app existente
const existingApp = new Hono();
const { router } = await setupRoutes(existingApp, config);

// Validar configuración
const { isValid, errors } = validateRouterConfig(config);

// Crear configuración por defecto
const defaultConfig = createDefaultConfig({ enableLogging: true });
```

### Estadísticas del Router

```typescript
const stats = router.getStats();
console.log({
  totalRoutes: stats.totalRoutes,
  lastScanTime: stats.lastScanTime,
  routesByType: stats.routesByType
});
```

### Información de Rutas Registradas

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

## 🚨 Manejo de Errores

### Errores 404 Automáticos

```typescript
// Configuración automática de 404
const router = new Router({
  routesDirectory: './src/routes',
  errorHandling: {
    enable404Handler: true
  }
});
```

### Errores de Validación

```typescript
// Los errores de validación se manejan automáticamente
// Respuesta automática para parámetros inválidos:
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "id": "Must be a number between 1 and 999999"
  }
}
```

### Handler de Errores Personalizado

```typescript
import { ErrorHandler } from 'hono-my-router';

const errorHandler = new ErrorHandler({
  enable404Handler: true,
  enableValidationErrors: true
});

// Personalizar respuesta 404
errorHandler.handle404 = async (c) => {
  return c.json({
    error: 'Ruta no encontrada',
    path: c.req.path,
    method: c.req.method,
    timestamp: new Date().toISOString()
  }, 404);
};
```

## 📊 Ejemplos Completos

### Ejemplo 1: API REST Básica

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

### Ejemplo 2: API con Autenticación

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
    message: `Acceso autorizado a: ${path.join('/')}`,
    user: await getUserFromToken(token)
  });
}
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con cobertura
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

## 📋 Scripts Disponibles

```bash
npm run build      # Compilar TypeScript
npm run dev        # Modo desarrollo con watch
npm run test       # Ejecutar tests
npm run lint       # Linter ESLint
npm run clean      # Limpiar archivos compilados
```

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🔗 Enlaces

- [Documentación de Hono](https://hono.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Repositorio](https://github.com/tu-usuario/hono-my-router)

---

**Hecho con ❤️ para la comunidad de Hono**
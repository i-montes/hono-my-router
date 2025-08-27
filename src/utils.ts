import { Hono } from 'hono';
import { Router } from './router';
import { RouterConfig, RouterInitResult } from '../types';

/**
 * Crea una aplicación Hono completa con router configurado
 */
export async function createHonoRouterApp(config: RouterConfig): Promise<{
  app: Hono;
  router: Router;
  result: RouterInitResult;
}> {
  const router = new Router(config);
  const result = await router.initialize();
  const app = router.getApp();
  
  return {
    app,
    router,
    result
  };
}

/**
 * Configura rutas en una aplicación Hono existente
 */
export async function setupRoutes(
  app: Hono,
  config: RouterConfig
): Promise<{
  router: Router;
  result: RouterInitResult;
}> {
  const router = new Router(config);
  const result = await router.initialize();
  
  // Montar las rutas del router en la aplicación existente
  const routerApp = router.getApp();
  app.route('/', routerApp);
  
  return {
    router,
    result
  };
}

/**
 * Función de utilidad para validar configuración del router
 */
export function validateRouterConfig(config: RouterConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!config.routesDirectory) {
    errors.push('routesDirectory is required');
  }
  
  if (typeof config.routesDirectory !== 'string') {
    errors.push('routesDirectory must be a string');
  }
  
  if (config.enableLogging !== undefined && typeof config.enableLogging !== 'boolean') {
    errors.push('enableLogging must be a boolean');
  }
  
  // enableParameterValidation property removed as it's not part of RouterConfig
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Función de utilidad para crear configuración por defecto
 */
export function createDefaultConfig(overrides: Partial<RouterConfig> = {}): RouterConfig {
  return {
    routesDirectory: './src/routes',
    enableLogging: false,
    errorHandling: {
      handle404: true,
      handleValidationErrors: true
    },
    ...overrides
  };
}

/**
 * Función de utilidad para normalizar rutas
 */
export function normalizePath(path: string): string {
  return path
    .replace(/\/+/g, '/') // Eliminar barras duplicadas
    .replace(/\/$/, '') // Eliminar barra final
    .replace(/^\//, '/'); // Asegurar barra inicial
}

/**
 * Función de utilidad para convertir ruta de archivo a ruta de API
 */
export function filePathToApiPath(filePath: string, baseDir: string): string {
  let apiPath = filePath
    .replace(baseDir, '')
    .replace(/\\+/g, '/') // Normalizar separadores en Windows
    .replace(/\.ts$|\.js$/, '') // Remover extensiones
    .replace(/\/index$/, ''); // Remover /index
  
  // Asegurar que comience con /
  if (!apiPath.startsWith('/')) {
    apiPath = '/' + apiPath;
  }
  
  // Si es la ruta raíz, mantener /
  if (apiPath === '') {
    apiPath = '/';
  }
  
  return normalizePath(apiPath);
}

/**
 * Función de utilidad para extraer parámetros de una ruta
 */
export function extractRouteParameters(routePath: string): string[] {
  const params: string[] = [];
  const segments = routePath.split('/').filter(Boolean);
  
  for (const segment of segments) {
    if (segment.startsWith('[') && segment.endsWith(']')) {
      const paramName = segment
        .replace(/[\[\]]/g, '')
        .replace(/^\.\.\./, '');
      params.push(paramName);
    }
  }
  
  return params;
}

/**
 * Función de utilidad para determinar el tipo de ruta
 */
export function determineRouteType(routePath: string): import('../types').RouteType {
  const hasParams = routePath.includes('[');
  const hasVariableSegments = routePath.includes('[...');
  const paramCount = (routePath.match(/\[/g) || []).length;
  
  if (!hasParams) {
    return 'simple';
  }
  
  if (hasVariableSegments) {
    return 'variableSegments';
  }
  
  if (paramCount === 1) {
    return 'singleParam';
  }
  
  return 'nested';
}

/**
 * Función de utilidad para validar nombre de archivo de ruta
 */
export function isValidRouteFile(fileName: string): boolean {
  // Debe ser un archivo .ts o .js
  if (!/\.(ts|js)$/.test(fileName)) {
    return false;
  }
  
  // No debe ser un archivo de test
  if (/\.(test|spec)\.(ts|js)$/.test(fileName)) {
    return false;
  }
  
  // No debe comenzar con punto o guión bajo
  const baseName = fileName.replace(/\.(ts|js)$/, '');
  if (baseName.startsWith('.') || baseName.startsWith('_')) {
    return false;
  }
  
  return true;
}

/**
 * Función de utilidad para crear un handler básico
 */
export function createBasicHandler(methods: string[] = ['GET']): import('../types').RouteHandler {
  const handler: any = {};
  
  for (const method of methods) {
    const methodName = method.toLowerCase();
    handler[methodName] = async (c: import('../types').ExtendedContext) => {
      return c.json({
        message: `${method} handler for route`,
        method: method,
        timestamp: new Date().toISOString()
      });
    };
  }
  
  return handler;
}

/**
 * Función de utilidad para crear middleware de logging
 */
export function createLoggingMiddleware(prefix: string = '[HonoRouter]') {
  return async (c: any, next: () => Promise<void>) => {
    const start = Date.now();
    console.log(`${prefix} ${c.req.method} ${c.req.path} - Start`);
    
    await next();
    
    const duration = Date.now() - start;
    console.log(`${prefix} ${c.req.method} ${c.req.path} - ${c.res.status} (${duration}ms)`);
  };
}

/**
 * Función de utilidad para crear middleware de CORS
 */
export function createCorsMiddleware(options: {
  origin?: string | string[];
  methods?: string[];
  headers?: string[];
} = {}) {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    headers = ['Content-Type', 'Authorization']
  } = options;
  
  return async (c: any, next: () => Promise<void>) => {
    // Establecer headers CORS
    c.header('Access-Control-Allow-Origin', Array.isArray(origin) ? origin.join(', ') : origin);
    c.header('Access-Control-Allow-Methods', methods.join(', '));
    c.header('Access-Control-Allow-Headers', headers.join(', '));
    
    // Manejar preflight requests
    if (c.req.method === 'OPTIONS') {
      return c.text('', 204);
    }
    
    await next();
  };
}

/**
 * Función de utilidad para crear respuesta de salud del sistema
 */
export function createHealthCheck(router: Router) {
  return async (c: any) => {
    const stats = router.getStats();
    const config = router.getConfig();
    
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      router: {
        totalRoutes: stats.totalRoutes,
        lastScanTime: stats.lastScanTime,
        routesDirectory: config.routesDirectory
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    });
  };
}
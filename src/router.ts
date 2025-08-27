import { Hono, Context } from 'hono';
import { RouteScanner } from './scanner';
import { ParameterExtractor } from './parameter-extractor';
import { ErrorHandler } from './error-handler';
import {
  RouterConfig,
  RegisteredRoute,
  RouterStats,
  RouterInitResult,
  HonoRouter,
  HTTPMethod,
  RouteParams
} from '../types';
import { RouteInfo } from '../types/route';
import { ExtendedContext } from '../types/handler';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Interfaz para handlers exportados por archivos de ruta
 */
interface RouteFileHandler {
  get?: (c: ExtendedContext) => Promise<Response> | Response;
  post?: (c: ExtendedContext) => Promise<Response> | Response;
  put?: (c: ExtendedContext) => Promise<Response> | Response;
  delete?: (c: ExtendedContext) => Promise<Response> | Response;
  patch?: (c: ExtendedContext) => Promise<Response> | Response;
  head?: (c: ExtendedContext) => Promise<Response> | Response;
  options?: (c: ExtendedContext) => Promise<Response> | Response;
}

/**
 * Router principal que maneja rutas dinámicas basadas en estructura de carpetas
 */
export class Router implements HonoRouter {
  private app: Hono;
  public config: RouterConfig;
  private scanner: RouteScanner;
  private parameterExtractor: ParameterExtractor;
  private errorHandler: ErrorHandler;
  private registeredRoutes: RegisteredRoute[] = [];
  private stats: RouterStats;

  constructor(config: RouterConfig) {
    // Validar configuración requerida
    if (!config.routesDirectory) {
      throw new Error('routesDirectory is required');
    }
    
    // Validar que el directorio existe
    try {
      const fs = require('fs');
      if (!fs.existsSync(config.routesDirectory)) {
        throw new Error(`Routes directory does not exist: ${config.routesDirectory}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('does not exist')) {
        throw error;
      }
      // Si hay otro error (como permisos), continuar pero advertir
      console.warn(`Warning: Could not verify routes directory: ${error}`);
    }
    
    const defaultConfig = {
      routesDirectory: './src/routes',
      enableLogging: true
    };
    
    this.config = {
      ...defaultConfig,
      ...config
    };

    this.app = new Hono();
    this.scanner = new RouteScanner({
      baseDir: this.config.routesDirectory,
      extensions: ['.ts', '.js'],
      ignore: ['index.ts', 'index.js', '*.test.ts', '*.spec.ts']
    });
    this.parameterExtractor = new ParameterExtractor();
    this.errorHandler = new ErrorHandler(this.config.errorHandling);
    
    this.stats = {
      totalRoutes: 0,
      totalFiles: 0,
      routesByMethod: {},
      routesByType: {
        simple: 0,
        singleParam: 0,
        variableSegments: 0,
        nested: 0
      },
      lastScanTime: null,
      processingTime: 0
    };
  }

  /**
   * Inicializa el router y escanea las rutas
   */
  async init(): Promise<RouterInitResult> {
    return this.initialize();
  }

  /**
   * Refresca las rutas escaneando nuevamente
   */
  async refresh(): Promise<RouterInitResult> {
    // Limpiar rutas existentes
    this.registeredRoutes = [];
    this.stats.totalRoutes = 0;
    this.stats.totalFiles = 0;
    this.stats.routesByMethod = {};
    this.stats.routesByType = {
      simple: 0,
      singleParam: 0,
      variableSegments: 0,
      nested: 0
    };
    
    return this.initialize();
  }

  /**
   * Inicializa el router y escanea las rutas
   */
  async initialize(): Promise<RouterInitResult> {
    const startTime = Date.now();
    try {
      this.log('info', 'Initializing router...');
      
      // Verificar que el directorio existe
      const fs = require('fs');
      if (!fs.existsSync(this.config.routesDirectory)) {
        throw new Error(`Routes directory does not exist: ${this.config.routesDirectory}`);
      }
      
      // Escanear rutas
      const routeFiles = await this.scanner.scanRoutes();
      this.log('info', `Found ${routeFiles.length} route files`);

      // Convertir y registrar rutas
      for (const routeFile of routeFiles) {
        const routeInfo = await this.scanner.fileToRouteInfo(routeFile);
        await this.registerRoute(routeInfo);
      }

      // Registrar middleware de manejo de errores
      this.app.use('*', this.errorHandler.createErrorMiddleware());

      // Registrar manejador 404
      this.app.notFound((c) => {
        return this.errorHandler.handle404(c, c.req.path);
      });

      // Actualizar estadísticas
      this.stats.totalFiles = routeFiles.length;
      this.stats.processingTime = Date.now() - startTime;
      this.updateStats();

      this.log('info', `Router initialized with ${this.registeredRoutes.length} routes`);

      return {
        success: true,
        routesRegistered: this.registeredRoutes.length,
        stats: this.stats
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log('error', 'Failed to initialize router', error);
      return {
        success: false,
        error: errorMessage,
        routesRegistered: 0
      };
    }
  }

  /**
   * Registra una ruta individual
   */
  public async registerRoute(routeInfo: RouteInfo): Promise<void> {
    try {
      // Cargar el handler del archivo
      const handler = await this.loadRouteHandler(routeInfo.filePath);
      
      if (!handler) {
        this.log('warn', `No handler found for route: ${routeInfo.path}`);
        return;
      }

      // Determinar métodos HTTP soportados
      const methods = this.getSupportedMethods(handler);
      
      for (const method of methods) {
        this.registerRouteMethod(routeInfo, method, handler);
      }

      // Agregar a rutas registradas
      this.registeredRoutes.push({
        path: routeInfo.path,
        filePath: routeInfo.filePath,
        type: routeInfo.type,
        methods,
        parameters: routeInfo.parameters,
        
      });
      
      this.log('info', `Registered route: ${methods.join(', ')} ${routeInfo.path}`);
    } catch (error) {
      this.log('error', `Failed to register route: ${routeInfo.path}`, error);
    }
  }

  /**
   * Registra un método específico para una ruta
   */
  private registerRouteMethod(
    routeInfo: RouteInfo,
    method: HTTPMethod,
    handler: RouteFileHandler
  ): void {
    const routePath = this.convertToHonoPath(routeInfo.path);
    
    this.app.on(method, routePath, async (c: Context) => {
      try {
        // Extraer parámetros
        const params = this.extractRouteParameters(c.req.path, routeInfo);
        
        // TODO: Implementar validación de parámetros si es necesario

        // Crear contexto extendido
        const extendedContext = c as ExtendedContext;
        extendedContext.routeParams = params;

        // Ejecutar handler
        const methodHandler = handler[method.toLowerCase() as keyof RouteFileHandler];
        if (typeof methodHandler === 'function') {
          return await methodHandler(extendedContext);
        }

        // Si no hay handler para este método
        const allowedMethods = this.getSupportedMethods(handler);
        return this.errorHandler.handleMethodNotAllowed(
          c,
          c.req.path,
          allowedMethods
        );
      } catch (error) {
        return this.errorHandler.handleInternalError(
          c,
          error instanceof Error ? error : new Error('Unknown error'),
          c.req.path
        );
      }
    });
  }

  /**
   * Carga el handler de una ruta desde un archivo
   */
  private async loadRouteHandler(filePath: string): Promise<RouteFileHandler | null> {
    try {
      if (!fs.existsSync(filePath)) {
        this.log('warn', `File does not exist: ${filePath}`);
        return null;
      }

      this.log('info', `Loading handler from: ${filePath}`);
      
      // Importar el módulo usando import dinámico
      const module = await import(filePath);
      
      this.log('info', `Module loaded, keys: ${Object.keys(module).join(', ')}`);
      
      // Buscar el handler (export default, named export, o funciones exportadas directamente)
      let handler = module.default || module.handler;
      
      // Si no hay handler, crear uno a partir de las funciones exportadas
      if (!handler) {
        handler = {};
        const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];
        
        for (const method of httpMethods) {
          if (typeof module[method] === 'function') {
            handler[method] = module[method];
          }
        }
        
        // Si no se encontraron métodos HTTP, no es un handler válido
        if (Object.keys(handler).length === 0) {
          this.log('warn', `No HTTP methods found in file: ${filePath}`);
          return null;
        }
      }
      
      if (!handler || typeof handler !== 'object') {
        this.log('warn', `Invalid handler in file: ${filePath}`);
        return null;
      }

      return handler as RouteFileHandler;
    } catch (error) {
      this.log('error', `Failed to load handler from: ${filePath}`, error);
      return null;
    }
  }

  /**
   * Obtiene los métodos HTTP soportados por un handler
   */
  private getSupportedMethods(handler: RouteFileHandler): HTTPMethod[] {
    const methods: HTTPMethod[] = [];
    const httpMethods: HTTPMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    
    for (const method of httpMethods) {
      const methodName = method.toLowerCase() as keyof RouteFileHandler;
      if (typeof handler[methodName] === 'function') {
        methods.push(method);
      }
    }
    
    return methods;
  }

  /**
   * Convierte una ruta de API a formato compatible con Hono usando path-to-regexp
   */
  private convertToHonoPath(apiPath: string): string {
    // Usar el mismo convertidor que ParameterExtractor para consistencia
    return this.parameterExtractor.convertToPathToRegexpPattern(apiPath);
  }

  /**
   * Extrae parámetros de una ruta
   */
  private extractRouteParameters(requestPath: string, routeInfo: RouteInfo): RouteParams {
    return this.parameterExtractor.extractParameters(requestPath, routeInfo.path);
  }

  /**
   * Actualiza las estadísticas del router
   */
  private updateStats(): void {
    this.stats.totalRoutes = this.registeredRoutes.length;
    this.stats.lastScanTime = new Date();
    
    // Resetear contadores
    this.stats.routesByMethod = {};
    this.stats.routesByType = {
      simple: 0,
      singleParam: 0,
      variableSegments: 0,
      nested: 0
    };
    
    // Contar por método y tipo
    for (const route of this.registeredRoutes) {
      // Contar por método
      for (const method of route.methods) {
        this.stats.routesByMethod[method] = (this.stats.routesByMethod[method] || 0) + 1;
      }
      
      // Contar por tipo
      this.stats.routesByType[route.type]++;
    }
  }

  /**
   * Obtiene la instancia de Hono configurada
   */
  getApp(): Hono {
    return this.app;
  }

  /**
   * Obtiene las rutas registradas
   */
  getRoutes(): RegisteredRoute[] {
    return [...this.registeredRoutes];
  }

  /**
   * Obtiene las estadísticas del router
   */
  getStats(): RouterStats {
    return { ...this.stats };
  }

  /**
   * Obtiene la configuración del router
   */
  getConfig(): RouterConfig {
    return { ...this.config };
  }

  /**
   * Reescanea las rutas y actualiza el router
   */
  async rescan(): Promise<RouterInitResult> {
    this.log('info', 'Rescanning routes...');
    
    // Limpiar rutas existentes
    this.registeredRoutes = [];
    this.app = new Hono();
    
    // Reinicializar
    return await this.initialize();
  }

  /**
   * Agrega una ruta manualmente
   */
  addRoute(
    path: string,
    handler: RouteFileHandler,
    methods: HTTPMethod[] = ['GET']
  ): void {
    const routeInfo: RouteInfo = {
      pattern: path,
      path: path,
      type: path.includes('[') ? 
        (path.includes('[...') ? 'variableSegments' : 'singleParam') : 
        'simple',
      params: {},
      parameters: this.scanner.extractParameters(path),
      filePath: 'manual',
      method: 'GET'
    };

    for (const method of methods) {
      this.registerRouteMethod(routeInfo, method, handler);
    }

    this.registeredRoutes.push({
      path,
      filePath: 'manual',
      type: routeInfo.type,
      methods,
      parameters: routeInfo.parameters
    });

    this.updateStats();
    this.log('info', `Manually added route: ${methods.join(', ')} ${path}`);
  }

  /**
   * Elimina una ruta
   */
  removeRoute(path: string): boolean {
    const index = this.registeredRoutes.findIndex(route => route.path === path);
    if (index !== -1) {
      this.registeredRoutes.splice(index, 1);
      this.updateStats();
      this.log('info', `Removed route: ${path}`);
      return true;
    }
    return false;
  }

  /**
   * Verifica si una ruta existe
   */
  hasRoute(path: string): boolean {
    return this.registeredRoutes.some(route => route.path === path);
  }

  /**
   * Busca rutas por patrón
   */
  findRoutes(pattern: string | RegExp): RegisteredRoute[] {
    if (typeof pattern === 'string') {
      return this.registeredRoutes.filter(route => 
        route.path.includes(pattern)
      );
    }
    return this.registeredRoutes.filter(route => 
      pattern.test(route.path)
    );
  }

  /**
   * Log con nivel configurable
   */
  private log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (this.config.enableLogging) {
      this.errorHandler.logError(level, `[Router] ${message}`, data);
    }
  }
}

/**
 * Factory function para crear una instancia del router
 */
export function createRouter(config: RouterConfig): Router {
  return new Router(config);
}

/**
 * Función de conveniencia para crear y inicializar un router
 */
export async function createAndInitializeRouter(config: RouterConfig): Promise<{
  router: Router;
  app: Hono;
  result: RouterInitResult;
}> {
  const router = createRouter(config);
  const result = await router.initialize();
  
  return {
    router,
    app: router.getApp(),
    result
  };
}
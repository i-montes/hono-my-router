import { Hono } from 'hono';
import { RouteInfo } from './route';
import { HandlerConfig } from './handler';

/**
 * Configuración principal del router
 */
export interface RouterConfig {
  /** Directorio base donde se encuentran las rutas */
  routesDirectory: string;
  /** Patrones de exclusión para archivos */
  excludePatterns?: string[];
  /** Prefijo base para todas las rutas */
  basePrefix?: string;
  /** Habilitar logging de rutas registradas */
  enableLogging?: boolean;
  /** Habilitar validación de parámetros */
  enableParameterValidation?: boolean;
  /** Habilitar manejo automático de errores 404 */
  enable404Handler?: boolean;
  /** Configuración de manejo de errores */
  errorHandling?: ErrorHandlingConfig;
  /** Middleware global para todas las rutas */
  globalMiddleware?: any[];
}

/**
 * Configuración de manejo de errores
 */
export interface ErrorHandlingConfig {
  /** Habilitar manejo automático de errores 404 */
  handle404?: boolean;
  /** Habilitar manejo automático de errores 404 (alias para compatibilidad) */
  enable404Handler?: boolean;
  /** Mensaje personalizado para errores 404 */
  notFoundMessage?: string;
  /** Handler personalizado para errores 404 */
  notFoundHandler?: (c: any) => Response;
  /** Habilitar manejo de errores de validación */
  handleValidationErrors?: boolean;
  /** Handler personalizado para errores de validación */
  validationErrorHandler?: (c: any, error: ValidationError) => Response;
}

/**
 * Error de validación de parámetros
 */
export interface ValidationError {
  /** Nombre del parámetro que falló la validación */
  paramName: string;
  /** Valor que falló la validación */
  value: any;
  /** Mensaje de error */
  message: string;
  /** Tipo de error de validación */
  type: 'pattern' | 'validator' | 'required';
}

/**
 * Resultado de inicialización del router
 */
export interface RouterInitResult {
  /** Indica si la inicialización fue exitosa */
  success: boolean;
  /** Instancia de Hono configurada */
  app?: Hono;
  /** Rutas registradas */
  routes?: RouteInfo[];
  /** Número de rutas registradas */
  routesRegistered?: number;
  /** Error durante la inicialización */
  error?: string;
  /** Estadísticas de rutas procesadas */
  stats?: RouterStats;
}

/**
 * Estadísticas del router
 */
export interface RouterStats {
  /** Total de archivos escaneados */
  totalFiles: number;
  /** Total de rutas registradas */
  totalRoutes: number;
  /** Rutas por tipo */
  routesByType: {
    simple: number;
    singleParam: number;
    variableSegments: number;
    nested: number;
  };
  /** Rutas por método HTTP */
  routesByMethod: { [method: string]: number };
  /** Tiempo de procesamiento en ms */
  processingTime: number;
  /** Última vez que se escanearon las rutas */
  lastScanTime: Date | null;
}

/**
 * Información de ruta registrada
 */
export interface RegisteredRoute {
  /** Ruta de la API */
  path: string;
  /** Ruta del archivo */
  filePath: string;
  /** Tipo de ruta */
  type: 'simple' | 'singleParam' | 'variableSegments' | 'nested';
  /** Métodos HTTP soportados */
  methods: string[];
  /** Parámetros de la ruta */
  parameters: string[];
}

/**
 * Interfaz principal del router
 */
export interface HonoRouter {
  /** Configuración del router */
  config: RouterConfig;
  
  /** Inicializar el router */
  init(): Promise<RouterInitResult>;
  
  /** Obtener la instancia de Hono configurada */
  getApp(): Hono;
  
  /** Obtener todas las rutas registradas */
  getRoutes(): RegisteredRoute[];
  
  /** Obtener estadísticas del router */
  getStats(): RouterStats;
  
  /** Registrar una ruta manualmente */
  registerRoute(route: RouteInfo, handler: HandlerConfig): void;
  
  /** Re-escanear y actualizar rutas */
  refresh(): Promise<RouterInitResult>;
  
  /** Verificar si una ruta está registrada */
  hasRoute(path: string, method?: string): boolean;
}

/**
 * Opciones para crear una instancia del router
 */
export interface CreateRouterOptions extends RouterConfig {
  /** Instancia de Hono existente para usar */
  existingApp?: Hono;
}
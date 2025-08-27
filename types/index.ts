// Re-export all types from individual modules
export type {
  RouteType,
  RouteParams,
  RouteInfo,
  ParamValidation,
  RouteParamConfig,
  RouteProcessResult,
  RouteScanConfig
} from './route';

export type {
  ExtendedContext,
  RouteHandler,
  ContextCallback,
  HandlerConfig,
  HandlerResult,
  HandlerFactory
} from './handler';

export type {
  RouterConfig,
  ErrorHandlingConfig,
  ValidationError,
  RouterInitResult,
  RouterStats,
  RegisteredRoute,
  HonoRouter,
  CreateRouterOptions
} from './router';

// Tipos de utilidad
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export type RoutePattern = string;

export type FilePath = string;

/**
 * Configuración por defecto del router
 */
export interface DefaultRouterConfig {
  routesDir: string;
  scanConfig: {
    baseDir: string;
    extensions: string[];
    ignore: string[];
  };
  basePrefix: string;
  enableLogging: boolean;
  errorHandling: {
    handle404: boolean;
    notFoundMessage: string;
    handleValidationErrors: boolean;
  };
}

/**
 * Metadatos de archivo de ruta
 */
export interface RouteFileMetadata {
  /** Ruta completa del archivo */
  filePath: string;
  /** Ruta relativa desde el directorio base */
  relativePath: string;
  /** Nombre del archivo sin extensión */
  fileName: string;
  /** Directorio padre */
  directory: string;
  /** Timestamp de última modificación */
  lastModified: Date;
  /** Tamaño del archivo en bytes */
  size: number;
}
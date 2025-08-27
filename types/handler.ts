import { Context, Next } from 'hono';
import { RouteParams } from './route';

/**
 * Contexto extendido que incluye parámetros de ruta tipados
 */
export interface ExtendedContext<T extends RouteParams = RouteParams> extends Context {
  /** Parámetros de ruta tipados */
  routeParams: T;
  /** Información de la ruta actual */
  route: {
    path: string;
    method: string;
    params: string[];
  };
  /** Parámetros de la ruta (alias para compatibilidad) */
  params: T;
}

/**
 * Función handler para rutas
 */
export type RouteHandler<T extends RouteParams = RouteParams> = (
  c: ExtendedContext<T>,
  next: Next
) => Promise<Response> | Response;

/**
 * Callback para acceder al contexto de Hono
 */
export type ContextCallback<T extends RouteParams = RouteParams> = (
  context: ExtendedContext<T>
) => Promise<Response> | Response;

/**
 * Configuración del handler exportado por cada archivo de ruta
 */
export interface HandlerConfig<T extends RouteParams = RouteParams> {
  /** Función handler principal */
  handler: RouteHandler<T>;
  /** Métodos HTTP soportados */
  methods?: string[];
  /** Middleware específico para esta ruta */
  middleware?: RouteHandler<T>[];
  /** Configuración de validación de parámetros */
  validation?: {
    [K in keyof T]?: {
      pattern?: RegExp;
      validator?: (value: T[K]) => boolean;
      errorMessage?: string;
    }
  };
}

/**
 * Resultado de ejecución de handler
 */
export interface HandlerResult {
  /** Indica si el handler se ejecutó exitosamente */
  success: boolean;
  /** Respuesta del handler */
  response?: Response;
  /** Error si la ejecución falló */
  error?: string;
}

/**
 * Tipos específicos para diferentes tipos de rutas
 */

// Para rutas simples sin parámetros
export type SimpleRouteHandler = RouteHandler<{}>;

// Para rutas con un parámetro único
export type SingleParamRouteHandler<K extends string> = RouteHandler<{
  [P in K]: string;
}>;

// Para rutas con segmentos variables
export type VariableSegmentRouteHandler<K extends string> = RouteHandler<{
  [P in K]: string[];
}>;

// Para rutas anidadas con múltiples parámetros
export type NestedRouteHandler<T extends RouteParams> = RouteHandler<T>;

/**
 * Factory para crear handlers tipados
 */
export interface HandlerFactory {
  /** Crear handler para ruta simple */
  simple: (handler: SimpleRouteHandler) => HandlerConfig<{}>;
  
  /** Crear handler para ruta con parámetro único */
  singleParam: <K extends string>(
    paramName: K,
    handler: SingleParamRouteHandler<K>
  ) => HandlerConfig<{ [P in K]: string }>;
  
  /** Crear handler para ruta con segmentos variables */
  variableSegment: <K extends string>(
    segmentName: K,
    handler: VariableSegmentRouteHandler<K>
  ) => HandlerConfig<{ [P in K]: string[] }>;
  
  /** Crear handler para ruta anidada */
  nested: <T extends RouteParams>(
    handler: NestedRouteHandler<T>
  ) => HandlerConfig<T>;
}
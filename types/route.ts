// Tipos de rutas soportadas por el router
export type RouteType = 'simple' | 'singleParam' | 'variableSegments' | 'nested';

/**
 * Parámetros extraídos de una ruta
 */
export interface RouteParams {
  [key: string]: string | string[];
}

/**
 * Información de una ruta procesada
 */
export interface RouteInfo {
  /** Patrón de la ruta (ej: /api/users/[id]) */
  pattern: string;
  /** Ruta real del archivo (ej: /api/users/123) */
  path: string;
  /** Tipo de ruta */
  type: RouteType;
  /** Parámetros extraídos */
  params: RouteParams;
  /** Lista de nombres de parámetros */
  parameters: string[];
  /** Ruta del archivo handler */
  filePath: string;
  /** Método HTTP */
  method: string;
}

/**
 * Configuración de validación para parámetros
 */
export interface ParamValidation {
  /** Expresión regular para validar el parámetro */
  pattern?: RegExp;
  /** Función de validación personalizada */
  validator?: (value: string | string[]) => boolean;
  /** Mensaje de error personalizado */
  errorMessage?: string;
}

/**
 * Configuración de parámetros de ruta
 */
export interface RouteParamConfig {
  [paramName: string]: ParamValidation;
}

/**
 * Resultado de procesamiento de ruta
 */
export interface RouteProcessResult {
  /** Indica si la ruta fue procesada exitosamente */
  success: boolean;
  /** Información de la ruta si fue exitosa */
  route?: RouteInfo;
  /** Error si el procesamiento falló */
  error?: string;
}

/**
 * Configuración de ruta para el escáner
 */
export interface RouteScanConfig {
  /** Directorio base para escanear rutas */
  baseDir: string;
  /** Extensiones de archivo a considerar */
  extensions: string[];
  /** Patrones de archivos a ignorar */
  ignore: string[];
  /** Configuración de validación de parámetros */
  paramValidation?: RouteParamConfig;
}
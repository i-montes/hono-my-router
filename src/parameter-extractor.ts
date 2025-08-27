import { RouteParams, ParamValidation, ValidationError } from '../types';
import { match, pathToRegexp, compile, Key } from 'path-to-regexp';

/**
 * Extractor y validador de parámetros de rutas
 */
export class ParameterExtractor {
  /**
   * Extrae parámetros de una URL basándose en un patrón de ruta
   */
  extractParameters(urlPath: string, routePattern: string): RouteParams {
    const pathToRegexpPattern = this.convertToPathToRegexpPattern(routePattern);
    const matchFn = match(pathToRegexpPattern, { decode: decodeURIComponent });
    const result = matchFn(urlPath);
    
    if (!result) {
      return {};
    }
    
    const params: RouteParams = {};
    
    // Procesar parámetros extraídos
    for (const [key, value] of Object.entries(result.params)) {
      if (this.isVariableSegmentName(key, routePattern) || key === 'segments') {
        // Para segmentos variables, dividir por / si es string
        if (typeof value === 'string') {
          params[key] = value.split('/').filter(Boolean);
        } else {
          params[key] = value;
        }
      } else {
        params[key] = value;
      }
    }
    
    return params;
  }

  /**
   * Valida parámetros extraídos contra configuración de validación
   */
  validateParameters(
    params: RouteParams,
    validationConfig: { [key: string]: ParamValidation }
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    for (const [paramName, validation] of Object.entries(validationConfig)) {
      const value = params[paramName];
      
      // Verificar si el parámetro es requerido
      if (value === undefined || value === null) {
        errors.push({
          paramName,
          value,
          message: `Parameter '${paramName}' is required`,
          type: 'required'
        });
        continue;
      }
      
      // Validar con patrón regex
      if (validation.pattern && typeof value === 'string') {
        if (!validation.pattern.test(value)) {
          errors.push({
            paramName,
            value,
            message: validation.errorMessage || `Parameter '${paramName}' does not match required pattern`,
            type: 'pattern'
          });
        }
      }
      
      // Validar con función personalizada
      if (validation.validator) {
        try {
          const isValid = validation.validator(value);
            
          if (!isValid) {
            errors.push({
              paramName,
              value,
              message: validation.errorMessage || `Parameter '${paramName}' failed custom validation`,
              type: 'validator'
            });
          }
        } catch (error) {
          errors.push({
            paramName,
            value,
            message: `Validation error for parameter '${paramName}': ${error}`,
            type: 'validator'
          });
        }
      }
    }
    
    return errors;
  }

  /**
   * Verifica si una ruta coincide con un patrón
   */
  matchesPattern(urlPath: string, routePattern: string): boolean {
    const pathToRegexpPattern = this.convertToPathToRegexpPattern(routePattern);
    const matchFn = match(pathToRegexpPattern, { decode: decodeURIComponent });
    const result = matchFn(urlPath);
    
    return result !== false;
  }

  /**
   * Genera un patrón de expresión regular para una ruta usando path-to-regexp
   */
  generateRegexPattern(routePattern: string): RegExp {
    const pathToRegexpPattern = this.convertToPathToRegexpPattern(routePattern);
    const regexp = pathToRegexp(pathToRegexpPattern);
    return regexp;
  }

  /**
   * Extrae parámetros usando path-to-regexp (alias para extractParameters)
   */
  extractWithRegex(urlPath: string, routePattern: string): RouteParams {
    return this.extractParameters(urlPath, routePattern);
  }

  /**
   * Convierte el patrón de ruta del formato [param] a formato path-to-regexp :param
   */
  public convertToPathToRegexpPattern(routePattern: string): string {
    let pattern = this.normalizePath(routePattern);
    
    // Convertir asterisco simple /* a :segments(.+) para capturar uno o más segmentos
    pattern = pattern.replace(/\/\*$/, '/:segments(.+)');
    
    // Convertir segmentos variables [...param] a :param(.*)
    pattern = pattern.replace(/\[\.\.\.([^\]]+)\]/g, ':$1(.*)');    
    // Convertir parámetros únicos [param] a :param
    pattern = pattern.replace(/\[([^\]]+)\]/g, ':$1');
    
    return pattern;
  }

  /**
   * Normaliza una ruta eliminando barras duplicadas y finales
   */
  private normalizePath(path: string): string {
    return path
      .replace(/\/+/g, '/') // Eliminar barras duplicadas
      .replace(/\/$/, '') // Eliminar barra final
      .replace(/^\//, '/'); // Asegurar barra inicial
  }

  /**
   * Verifica si un segmento es un parámetro
   */
  private isParameter(segment: string): boolean {
    return segment.startsWith('[') && segment.endsWith(']');
  }

  /**
   * Verifica si un segmento es un segmento variable
   */
  private isVariableSegment(segment: string): boolean {
    return segment.startsWith('[...') && segment.endsWith(']');
  }

  /**
   * Obtiene el nombre del parámetro de un segmento
   */
  private getParameterName(segment: string): string {
    return segment
      .replace(/[\[\]]/g, '') // Remover corchetes
      .replace(/^\.\.\./, ''); // Remover puntos suspensivos
  }

  /**
   * Verifica si un nombre de parámetro corresponde a un segmento variable
   */
  private isVariableSegmentName(paramName: string, routePattern: string): boolean {
    return routePattern.includes(`[...${paramName}]`);
  }

  /**
   * Convierte parámetros a tipos apropiados
   */
  convertParameterTypes(params: RouteParams): Record<string, any> {
    const converted: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        converted[key] = value;
      } else if (typeof value === 'string') {
        // Intentar convertir números
        if (/^\d+$/.test(value)) {
          converted[key] = parseInt(value, 10);
        } else if (/^\d*\.\d+$/.test(value)) {
          converted[key] = parseFloat(value);
        } else if (value === 'true' || value === 'false') {
          converted[key] = value === 'true';
        } else {
          converted[key] = value;
        }
      } else {
        converted[key] = value;
      }
    }
    
    return converted;
  }
}
import { Context } from 'hono';
import { ErrorHandlingConfig, ValidationError } from '../types/router';

/**
 * Manejador de errores para el router
 */
export class ErrorHandler {
  private config: ErrorHandlingConfig;

  constructor(config: ErrorHandlingConfig = {}) {
    this.config = {
      handle404: true,
      handleValidationErrors: true,
      ...config
    };
  }

  /**
   * Maneja errores 404 cuando no se encuentra una ruta
   */
  handle404(c: Context, requestedPath: string) {
    const errorResponse = {
      error: 'Not Found',
      message: this.config.notFoundMessage || `Route '${requestedPath}' not found`,
      statusCode: 404,
      path: requestedPath,
      timestamp: new Date().toISOString()
    };

    // Si hay un manejador personalizado de 404
    if (this.config.notFoundHandler) {
      return this.config.notFoundHandler(c);
    }

    // Respuesta por defecto
    return c.json(errorResponse, 404);
  }

  /**
   * Maneja errores de validación de parámetros
   */
  handleValidationErrors(c: Context, errors: ValidationError[], requestedPath: string) {
    const errorResponse = {
      error: 'Validation Error',
      message: 'One or more parameters failed validation',
      statusCode: 400,
      path: requestedPath,
      timestamp: new Date().toISOString(),
      validationErrors: errors.map(error => ({
        parameter: error.paramName,
        value: error.value,
        message: error.message,
        type: error.type
      }))
    };

    // Si hay un manejador personalizado de validación
    if (this.config.validationErrorHandler) {
      return this.config.validationErrorHandler(c, errors[0]);
    }

    // Respuesta por defecto
    return c.json(errorResponse, 400);
  }

  /**
   * Maneja errores internos del servidor
   */
  handleInternalError(c: Context, error: Error, requestedPath: string) {
    console.error('Internal server error:', error);

    const errorResponse = {
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      statusCode: 500,
      path: requestedPath,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        details: error.message
      })
    };

    // Respuesta por defecto para errores internos

    // Respuesta por defecto
    return c.json(errorResponse, 500);
  }

  /**
   * Maneja errores de método HTTP no permitido
   */
  handleMethodNotAllowed(c: Context, requestedPath: string, allowedMethods: string[]) {
    const errorResponse = {
      error: 'Method Not Allowed',
      message: `Method ${c.req.method} is not allowed for this route`,
      statusCode: 405,
      path: requestedPath,
      allowedMethods,
      timestamp: new Date().toISOString()
    };

    // Establecer header Allow
    c.header('Allow', allowedMethods.join(', '));

    // Respuesta por defecto para método no permitido

    // Respuesta por defecto
    return c.json(errorResponse, 405);
  }

  /**
   * Maneja errores de archivo de ruta no encontrado
   */
  handleRouteFileNotFound(c: Context, routePath: string, filePath: string) {
    const errorResponse = {
      error: 'Route Handler Not Found',
      message: `Handler file not found for route '${routePath}'`,
      statusCode: 500,
      path: routePath,
      filePath,
      timestamp: new Date().toISOString()
    };

    console.error(`Route handler file not found: ${filePath}`);

    // Respuesta por defecto para archivo no encontrado

    // Respuesta por defecto
    return c.json(errorResponse, 500);
  }

  /**
   * Maneja errores de handler inválido
   */
  handleInvalidHandler(c: Context, routePath: string, handlerError: string) {
    const errorResponse = {
      error: 'Invalid Route Handler',
      message: `Invalid handler for route '${routePath}'`,
      statusCode: 500,
      path: routePath,
      details: handlerError,
      timestamp: new Date().toISOString()
    };

    console.error(`Invalid route handler: ${handlerError}`);

    // Si hay un manejador personalizado
    if (this.config.validationErrorHandler) {
      const validationError: ValidationError = {
        paramName: 'handler',
        value: handlerError,
        message: handlerError,
        type: 'validator'
      };
      return this.config.validationErrorHandler(c, validationError);
    }

    // Respuesta por defecto
    return c.json(errorResponse, 500);
  }

  /**
   * Crea un middleware de manejo de errores global
   */
  createErrorMiddleware() {
    return async (c: Context, next: () => Promise<void>) => {
      try {
        await next();
      } catch (error) {
        if (error instanceof Error) {
          return this.handleInternalError(c, error, c.req.path);
        }
        
        // Error desconocido
        const unknownError = new Error('Unknown error occurred');
        return this.handleInternalError(c, unknownError, c.req.path);
      }
    };
  }

  /**
   * Valida y formatea errores de validación
   */
  formatValidationErrors(errors: ValidationError[]): ValidationError[] {
    return errors.map(error => ({
      ...error,
      message: error.message || `Validation failed for parameter '${error.paramName}'`
    }));
  }

  /**
   * Verifica si el manejo de errores está habilitado
   */
  isErrorHandlingEnabled(type: '404' | 'validation' | 'internal'): boolean {
    switch (type) {
      case '404':
        return this.config.handle404 !== false;
      case 'validation':
        return this.config.handleValidationErrors !== false;
      case 'internal':
        return true; // Siempre habilitado
      default:
        return true;
    }
  }

  /**
   * Actualiza la configuración del manejador de errores
   */
  updateConfig(newConfig: Partial<ErrorHandlingConfig>) {
    this.config = {
      ...this.config,
      ...newConfig,
      notFoundMessage: newConfig.notFoundMessage || this.config.notFoundMessage
    };
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): ErrorHandlingConfig {
    return { ...this.config };
  }

  /**
   * Crea una respuesta de error estándar
   */
  createStandardErrorResponse(
    error: string,
    message: string,
    statusCode: number,
    path: string,
    additionalData?: Record<string, any>
  ) {
    return {
      error,
      message,
      statusCode,
      path,
      timestamp: new Date().toISOString(),
      ...additionalData
    };
  }

  /**
   * Log de errores con diferentes niveles
   */
  logError(level: 'error' | 'warn' | 'info', message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    switch (level) {
      case 'error':
        console.error(logMessage, data);
        break;
      case 'warn':
        console.warn(logMessage, data);
        break;
      case 'info':
        console.info(logMessage, data);
        break;
    }
  }
}
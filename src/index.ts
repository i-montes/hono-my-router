/**
 * Hono My Router - Dynamic route management based on folder structure
 * 
 * This module provides automatic route generation and management for Hono applications
 * based on a file system structure, supporting:
 * - Simple routes: /api/users
 * - Single parameter routes: /api/users/[id]
 * - Variable segment routes: /api/products/[...segments]
 * - Nested routes with parameters: /api/users/[id]/posts/[postId]
 * 
 * @author Hono My Router Team
 * @version 1.0.0
 */

// Main exports
export { Router, createRouter, createAndInitializeRouter } from './router';

// Route scanning and analysis
export { RouteScanner } from './scanner';

// Parameter extraction and validation
export { ParameterExtractor } from './parameter-extractor';

// Error handling
export { ErrorHandler } from './error-handler';

// Import for default export
import { Router } from './router';
import { createRouter, createAndInitializeRouter } from './router';
import { RouteScanner } from './scanner';
import { ParameterExtractor } from './parameter-extractor';
import { ErrorHandler } from './error-handler';

// Type definitions
export * from '../types';

// Utility functions
export { setupRoutes } from './utils';

/**
 * Main factory function to create a complete Hono app with router
 */
export async function createHonoRouterApp(config: import('../types').RouterConfig) {
  const { createAndInitializeRouter } = await import('./router');
  return createAndInitializeRouter(config);
}

/**
 * Quick setup function for common use cases
 */
export async function quickSetup(routesDirectory: string = './src/routes') {
  const { createAndInitializeRouter } = await import('./router');
  
  const config: import('../types').RouterConfig = {
    routesDirectory,
    enableLogging: process.env.NODE_ENV === 'development',
    errorHandling: {
      handle404: true,
      handleValidationErrors: true
    }
  };
  
  return createAndInitializeRouter(config);
}

/**
 * Development helper to create router with enhanced logging
 */
export async function createDevRouter(routesDirectory: string = './src/routes') {
  const { createAndInitializeRouter } = await import('./router');
  
  const config: import('../types').RouterConfig = {
    routesDirectory,
    enableLogging: true,
    errorHandling: {
      handle404: true,
      handleValidationErrors: true,
      notFoundMessage: 'Route not found in development mode'
    }
  };
  
  return createAndInitializeRouter(config);
}

/**
 * Production helper to create router with optimized settings
 */
export async function createProdRouter(routesDirectory: string = './src/routes') {
  const { createAndInitializeRouter } = await import('./router');
  
  const config: import('../types').RouterConfig = {
    routesDirectory,
    enableLogging: false,
    errorHandling: {
      handle404: true,
      handleValidationErrors: true,
      notFoundMessage: 'Resource not found'
    }
  };
  
  return createAndInitializeRouter(config);
}

/**
 * Version information
 */
export const VERSION = '1.0.0';

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: Partial<import('../types').RouterConfig> = {
  routesDirectory: './src/routes',
  enableLogging: false,
  errorHandling: {
    handle404: true,
    handleValidationErrors: true
  }
};

/**
 * Route type constants
 */
export const ROUTE_TYPES = {
  SIMPLE: 'simple' as const,
  SINGLE_PARAM: 'singleParam' as const,
  VARIABLE_SEGMENTS: 'variableSegments' as const,
  NESTED: 'nested' as const
};

/**
 * HTTP method constants
 */
export const HTTP_METHODS = {
  GET: 'GET' as const,
  POST: 'POST' as const,
  PUT: 'PUT' as const,
  DELETE: 'DELETE' as const,
  PATCH: 'PATCH' as const,
  HEAD: 'HEAD' as const,
  OPTIONS: 'OPTIONS' as const
};

/**
 * Parameter validation helpers
 */
export const VALIDATION_PATTERNS = {
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  NUMERIC: /^\d+$/,
  ALPHA: /^[a-zA-Z]+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/
};

/**
 * Common parameter validators
 */
export const VALIDATORS = {
  isUUID: (value: string) => VALIDATION_PATTERNS.UUID.test(value),
  isEmail: (value: string) => VALIDATION_PATTERNS.EMAIL.test(value),
  isSlug: (value: string) => VALIDATION_PATTERNS.SLUG.test(value),
  isNumeric: (value: string) => VALIDATION_PATTERNS.NUMERIC.test(value),
  isAlpha: (value: string) => VALIDATION_PATTERNS.ALPHA.test(value),
  isAlphanumeric: (value: string) => VALIDATION_PATTERNS.ALPHANUMERIC.test(value),
  minLength: (min: number) => (value: string) => value.length >= min,
  maxLength: (max: number) => (value: string) => value.length <= max,
  inRange: (min: number, max: number) => (value: string) => {
    const num = parseInt(value, 10);
    return !isNaN(num) && num >= min && num <= max;
  }
};

/**
 * Error type constants
 */
export const ERROR_TYPES = {
  NOT_FOUND: 'not_found' as const,
  VALIDATION: 'validation' as const,
  INTERNAL: 'internal' as const,
  METHOD_NOT_ALLOWED: 'method_not_allowed' as const,
  ROUTE_FILE_NOT_FOUND: 'route_file_not_found' as const,
  INVALID_HANDLER: 'invalid_handler' as const
};

/**
 * Module metadata
 */
export const MODULE_INFO = {
  name: 'hono-my-router',
  version: VERSION,
  description: 'Dynamic route management for Hono based on folder structure',
  author: 'Hono Router Team',
  license: 'MIT'
};

// Re-export Hono types that are commonly used
export type { Context } from 'hono';

/**
 * Type guard functions
 */
export const isRouteHandler = (obj: any): obj is import('../types').RouteHandler => {
  return obj && typeof obj === 'object' && (
    typeof obj.get === 'function' ||
    typeof obj.post === 'function' ||
    typeof obj.put === 'function' ||
    typeof obj.delete === 'function' ||
    typeof obj.patch === 'function' ||
    typeof obj.head === 'function' ||
    typeof obj.options === 'function'
  );
};

export const isValidRouteType = (type: string): type is import('../types').RouteType => {
  return ['simple', 'singleParam', 'variableSegments', 'nested'].includes(type);
};

export const isValidHTTPMethod = (method: string): method is import('../types').HTTPMethod => {
  return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
};

/**
 * Default export for convenience
 */
const HonoRouter = {
  Router,
  createRouter,
  createAndInitializeRouter,
  createHonoRouterApp,
  quickSetup,
  createDevRouter,
  createProdRouter,
  RouteScanner,
  ParameterExtractor,
  ErrorHandler,
  VERSION,
  DEFAULT_CONFIG,
  ROUTE_TYPES,
  HTTP_METHODS,
  VALIDATION_PATTERNS,
  VALIDATORS,
  ERROR_TYPES,
  MODULE_INFO,
  isRouteHandler,
  isValidRouteType,
  isValidHTTPMethod
};

export default HonoRouter;
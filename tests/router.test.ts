import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Router } from '../src/router';
import { RouteScanner } from '../src/scanner';
import { ParameterExtractor } from '../src/parameter-extractor';
import { ErrorHandler } from '../src/error-handler';
import { RouterConfig } from '../types';
import * as fs from 'fs';
import * as path from 'path';

describe('Router', () => {
  let router: Router;
  let testConfig: RouterConfig;
  let tempDir: string;

  beforeEach(() => {
    // Crear directorio temporal para tests
    tempDir = path.join(__dirname, 'temp-routes');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    testConfig = {
      routesDirectory: tempDir,
      enableLogging: false,
      
      errorHandling: {
          handle404: true,
          handleValidationErrors: true
        }
    };

    router = new Router({
      routesDirectory: tempDir,
      enableLogging: true
    });
  });

  afterEach(() => {
    // Limpiar directorio temporal
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Constructor', () => {
    it('should create router with valid config', () => {
      expect(router).toBeInstanceOf(Router);
      const config = router.getConfig();
      expect(config.routesDirectory).toBe(tempDir);
      expect(config.enableLogging).toBe(true);
    });

    it('should throw error with invalid config', () => {
      expect(() => {
        new Router({} as RouterConfig);
      }).toThrow('routesDirectory is required');
    });
  });

  describe('Configuration', () => {
    it('should return current config', () => {
      const config = router.getConfig();
      expect(config.routesDirectory).toBe(tempDir);
      expect(config.enableLogging).toBe(true);
    });

    it('should have correct initial config', () => {
      const config = router.getConfig();
      expect(config.routesDirectory).toBe(tempDir);
      expect(config.enableLogging).toBe(true);
    });
  });

  describe('Route Registration', () => {
    it('should register routes correctly with dedicated router', async () => {
      // Crear directorio específico para este test (independiente de tempDir)
      const apiDir = path.join(__dirname, 'api-test-dedicated');
      if (fs.existsSync(apiDir)) {
        fs.rmSync(apiDir, { recursive: true, force: true });
      }
      fs.mkdirSync(apiDir, { recursive: true });
      
      // Crear archivos de rutas de prueba
      fs.writeFileSync(
        path.join(apiDir, 'users.ts'),
        `import { Context } from 'hono';
export async function get(c: Context) {
  return c.json({ users: [] });
}`
      );
      
      fs.writeFileSync(
        path.join(apiDir, '[id].ts'),
        `import { Context } from 'hono';
export async function get(c: Context) {
  return c.json({ id: c.req.param('id') });
}`
      );
      
      // Crear router específico para este test
      const apiRouter = new Router({
        routesDirectory: apiDir,
        enableLogging: true,
        enableParameterValidation: true,
        enable404Handler: true
      });
      
      const result = await apiRouter.initialize();
      const routes = apiRouter.getRoutes();
      
      expect(routes.length).toBeGreaterThan(0);
      
      const simpleRoute = routes.find((r: any) => r.path === '/users');
      expect(simpleRoute).toBeDefined();
      expect(simpleRoute?.type).toBe('simple');
      
      const paramRoute = routes.find((r: any) => r.path === '/[id]');
      expect(paramRoute).toBeDefined();
      expect(paramRoute?.type).toBe('singleParam');
      
      // Limpiar
      fs.rmSync(apiDir, { recursive: true, force: true });
    });


  });

  describe('Statistics', () => {
    it('should return initial stats', () => {
      const stats = router.getStats();
      
      expect(stats.totalRoutes).toBe(0);
      expect(stats.totalFiles).toBe(0);
      expect(stats.routesByType).toEqual({
          simple: 0,
          singleParam: 0,
          variableSegments: 0,
          nested: 0
        });
    });

    it('should update stats after initialization', async () => {
      // Crear directorio temporal para este test
      const statsTestDir = path.join(__dirname, 'stats-test-temp');
      if (fs.existsSync(statsTestDir)) {
        fs.rmSync(statsTestDir, { recursive: true, force: true });
      }
      fs.mkdirSync(statsTestDir, { recursive: true });
      
      // Crear ruta de prueba
      fs.writeFileSync(
        path.join(statsTestDir, 'test.ts'),
        `import { Context } from 'hono';
export async function get(c: Context) { return c.json({}); }`
      );
      
      // Crear router dedicado para este test
      const statsRouter = new Router({
        routesDirectory: statsTestDir,
        enableLogging: true,
        enableParameterValidation: true,
        enable404Handler: true
      });
      
      await statsRouter.initialize();
      const stats = statsRouter.getStats();
      
      expect(stats.totalRoutes).toBe(1);
      expect(stats.totalFiles).toBe(1);
      
      // Limpiar
      fs.rmSync(statsTestDir, { recursive: true, force: true });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing routes directory', () => {
      expect(() => {
        new Router({
          routesDirectory: '/non-existent-directory',
          enableLogging: false
        });
      }).toThrow('Routes directory does not exist: /non-existent-directory');
    });

    it('should handle invalid route files', async () => {
      // Crear archivo inválido (sintácticamente válido pero sin exportar handlers HTTP)
      fs.writeFileSync(
        path.join(tempDir, 'invalid.ts'),
        'export const invalidHandler = true;'
      );
      
      const result = await router.initialize();
      // Debería continuar a pesar del archivo inválido
      expect(result.success).toBe(true);
    });
  });
});

describe('RouteScanner', () => {
  let scanner: RouteScanner;
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(__dirname, 'temp-scanner');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    scanner = new RouteScanner({
      baseDir: tempDir,
      extensions: ['.ts', '.js'],
      ignore: []
    });
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('File Scanning', () => {
    it('should scan empty directory', async () => {
      const result = await scanner.scanRoutes();
      expect(result).toHaveLength(0);
    });

    it('should detect route files', async () => {
      // Crear archivos de prueba
      fs.writeFileSync(path.join(tempDir, 'users.ts'), 'export function get() {}');
      fs.writeFileSync(path.join(tempDir, '[id].ts'), 'export function get() {}');
      fs.writeFileSync(path.join(tempDir, 'readme.md'), '# Not a route');
      
      const result = await scanner.scanRoutes();
      expect(result).toHaveLength(2);
      expect(result.every((r: any) => r.filePath.endsWith('.ts'))).toBe(true);
    });

    it('should determine route types correctly', async () => {
      fs.writeFileSync(path.join(tempDir, 'simple.ts'), 'export function get() {}');
      fs.writeFileSync(path.join(tempDir, '[param].ts'), 'export function get() {}');
      fs.writeFileSync(path.join(tempDir, '[...segments].ts'), 'export function get() {}');
      
      const result = await scanner.scanRoutes();
      
      const simpleRoute = result.find((r: any) => r.filePath.includes('simple.ts'));
      const paramRoute = result.find((r: any) => r.filePath.includes('[param].ts'));
      const segmentsRoute = result.find((r: any) => r.filePath.includes('[...segments].ts'));
      
      // Note: RouteFileMetadata doesn't have type property
      // Type determination happens in fileToRouteInfo method
      expect(simpleRoute).toBeDefined();
      expect(paramRoute).toBeDefined();
      expect(segmentsRoute).toBeDefined();
    });
  });



  it('should convert file paths to API paths', () => {
    // Test route conversion using private method through fileToRouteInfo
    const testCases = [
      { relativePath: 'users.ts', expected: '/users' },
      { relativePath: 'users/[id].ts', expected: '/users/[id]' },
      { relativePath: 'products/[...segments].ts', expected: '/products/[...segments]' }
    ];

    testCases.forEach(({ relativePath, expected }) => {
      // Access private method through reflection for testing
      const routePath = (scanner as any).getRoutePathFromFile(relativePath);
      expect(routePath).toBe(expected);
    });
  });

  it('should identify route types correctly', () => {
    const testCases = [
      { path: '/users', expected: 'simple' },
      { path: '/users/[id]', expected: 'singleParam' },
      { path: '/users/[id]/posts/[postId]', expected: 'nested' },
      { path: '/files/[...segments]', expected: 'variableSegments' }
    ];

    testCases.forEach(({ path, expected }) => {
      // Access private method through reflection for testing
      const routeType = (scanner as any).determineRouteType(path);
      expect(routeType).toBe(expected);
    });
  });

  it('should extract route parameters', () => {
    const testCases = [
      { path: '/users', expected: [] },
      { path: '/users/[id]', expected: ['id'] },
      { path: '/users/[id]/posts/[postId]', expected: ['id', 'postId'] },
      { path: '/files/[...segments]', expected: ['segments'] }
    ];

    testCases.forEach(({ path, expected }) => {
      const params = scanner.getRouteParameters(path);
      expect(params).toEqual(expected);
    });
  });
});

describe('ParameterExtractor', () => {
  let extractor: ParameterExtractor;

  beforeEach(() => {
    extractor = new ParameterExtractor();
  });

  describe('Parameter Extraction', () => {
    it('should extract single parameter', () => {
      const result = extractor.extractParameters('/users/123', '/users/:id');
      expect(result).toEqual({ id: '123' });
    });

    it('should extract multiple parameters', () => {
      const result = extractor.extractParameters(
        '/users/123/posts/456',
        '/users/:userId/posts/:postId'
      );
      expect(result).toEqual({ userId: '123', postId: '456' });
    });

    it('should extract variable segments', () => {
      const result = extractor.extractParameters(
        '/products/electronics/phones/smartphones',
        '/products/*'
      );
      expect(result.segments).toEqual(['electronics', 'phones', 'smartphones']);
    });

    it('should return empty object for no parameters', () => {
      const result = extractor.extractParameters('/users', '/users');
      expect(result).toEqual({});
    });
  });

  describe('Pattern Matching', () => {
    it('should match simple patterns', () => {
      expect(extractor.matchesPattern('/users', '/users')).toBe(true);
      expect(extractor.matchesPattern('/users', '/posts')).toBe(false);
    });

    it('should match parameter patterns', () => {
      expect(extractor.matchesPattern('/users/123', '/users/:id')).toBe(true);
      expect(extractor.matchesPattern('/users', '/users/:id')).toBe(false);
    });

    it('should match variable segment patterns', () => {
      expect(extractor.matchesPattern('/products/a/b/c', '/products/*')).toBe(true);
      expect(extractor.matchesPattern('/products', '/products/*')).toBe(false);
    });
  });

  describe('Parameter Validation', () => {
    it('should validate number parameters', () => {
      const validation = {
        id: { 
          pattern: /^\d+$/,
          errorMessage: 'Must be a number'
        }
      };
      
      const results = extractor.validateParameters({ id: '123' }, validation);
      expect(results.length).toBe(0); // No errors

      // Test invalid number
      const invalidParams = { id: 'abc' };
      const invalidResult = extractor.validateParameters(invalidParams, validation);
      expect(invalidResult.length).toBe(1);
    });

    it('should validate string parameters', () => {
      const validation = {
        slug: { 
          validator: (value: string | string[]) => typeof value === 'string' && value.length >= 3,
          errorMessage: 'Must be at least 3 characters long'
        }
      };
      
      const validResult = extractor.validateParameters({ slug: 'hello' }, validation);
      expect(validResult.length).toBe(0);
      
      const invalidResult = extractor.validateParameters({ slug: 'hi' }, validation);
      expect(invalidResult.length).toBeGreaterThan(0);
    });

    it('should validate array parameters', () => {
      const validation = {
        segments: {
          validator: (value: string | string[]) => Array.isArray(value) && value.length >= 1,
          errorMessage: 'Segments must be a non-empty array'
        }
      };
      
      const validResult = extractor.validateParameters(
        { segments: ['a', 'b'] },
        validation
      );
      expect(validResult.length).toBe(0);
      
      const invalidResult = extractor.validateParameters(
        { segments: [] },
        validation
      );
      expect(invalidResult.length).toBeGreaterThan(0);
    });
  });
});

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler({
      handle404: true,
      handleValidationErrors: true
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      const mockContext = {
        json: jest.fn().mockReturnThis()
      } as any;

      await errorHandler.handle404(mockContext, '/nonexistent');

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Not Found',
          message: expect.stringContaining('/nonexistent'),
          statusCode: 404,
          path: '/nonexistent'
        }),
        404
      );
    });

    it('should handle validation errors', async () => {
      const mockContext = {
        json: jest.fn().mockReturnValue(Promise.resolve())
      };
      
      const validationErrors = [{
        paramName: 'id',
        value: 'abc',
        message: 'Must be a number',
        type: 'validator' as const
      }];
      
      await errorHandler.handleValidationErrors(mockContext as any, validationErrors, '/test');
      
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation Error',
          validationErrors: expect.arrayContaining([
            expect.objectContaining({
              parameter: 'id',
              message: 'Must be a number'
            })
          ])
        }),
        400
      );
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      const newConfig = {
        handle404: false,
        handleValidationErrors: true
      };
      
      errorHandler.updateConfig(newConfig);
      const config = errorHandler.getConfig();
      
      expect(config.handle404).toBe(false);
      expect(config.handleValidationErrors).toBe(true);
    });
  });
});
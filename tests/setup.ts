// Jest setup file
import 'jest';

// Mock console methods for cleaner test output
const originalConsole = { ...console };

beforeAll(() => {
  // Silence console.log during tests unless explicitly needed
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  // Keep console.error for debugging
  // console.error = jest.fn();
});

afterAll(() => {
  // Restore console methods
  Object.assign(console, originalConsole);
});

// Global test utilities
global.createMockContext = () => {
  return {
    req: {
      path: '/test',
      method: 'GET',
      url: 'http://localhost:3000/test',
      headers: new Headers()
    },
    params: {},
    query: {},
    json: jest.fn().mockResolvedValue({}),
    text: jest.fn().mockResolvedValue(''),
    html: jest.fn().mockResolvedValue(''),
    status: jest.fn().mockReturnThis(),
    header: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    notFound: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn(),
    var: {},
    env: {},
    executionCtx: {
      waitUntil: jest.fn(),
      passThroughOnException: jest.fn()
    },
    event: {},
    finalized: false,
    error: undefined
  };
};

// Extend Jest matchers
declare global {
  function createMockContext(): any;
  
  namespace jest {
    interface Matchers<R> {
      toBeValidRoute(): R;
      toHaveValidParameters(): R;
    }
  }
}

// Custom Jest matchers
expect.extend({
  toBeValidRoute(received) {
    const pass = received && 
                 typeof received.path === 'string' &&
                 typeof received.type === 'string' &&
                 typeof received.filePath === 'string';
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid route`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid route with path, type, and filePath properties`,
        pass: false
      };
    }
  },
  
  toHaveValidParameters(received) {
    const pass = received && 
                 typeof received === 'object' &&
                 !Array.isArray(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to have valid parameters`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be an object with valid parameters`,
        pass: false
      };
    }
  }
});

// Global test configuration
jest.setTimeout(10000);

// Cleanup function for tests
export const cleanup = () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
};

// Test helpers
export const createTempDirectory = (name: string): string => {
  const path = require('path');
  const fs = require('fs');
  
  const tempDir = path.join(__dirname, 'temp', name);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  return tempDir;
};

export const removeTempDirectory = (dirPath: string): void => {
  const fs = require('fs');
  
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
};

export const createRouteFile = (filePath: string, content: string): void => {
  const fs = require('fs');
  const path = require('path');
  
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, content);
};
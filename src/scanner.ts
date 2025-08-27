import { promises as fs } from 'fs';
import { join, relative, extname, basename, dirname } from 'path';
import { RouteScanConfig, RouteFileMetadata, RouteInfo, RouteType } from '../types';

/**
 * Escáner de archivos de rutas
 */
export class RouteScanner {
  private config: RouteScanConfig;

  constructor(config: RouteScanConfig) {
    const defaultConfig = {
      extensions: ['.ts', '.js'],
      ignore: ['index.ts', 'index.js', '*.test.ts', '*.spec.ts']
    };
    
    this.config = {
      ...defaultConfig,
      ...config
    };
  }

  /**
   * Escanea el directorio de rutas y retorna información de archivos
   */
  async scanRoutes(): Promise<RouteFileMetadata[]> {
    try {
      const files = await this.scanDirectory(this.config.baseDir);
      const routes = files.filter(file => this.isValidRouteFile(file));
      return routes;
    } catch (error) {
      console.warn('Error scanning routes:', error);
      return [];
    }
  }

  /**
   * Convierte metadatos de archivo a información de ruta
   */
  async fileToRouteInfo(metadata: RouteFileMetadata): Promise<RouteInfo> {
    const routePath = this.getRoutePathFromFile(metadata.relativePath);
    const routeType = this.determineRouteType(routePath);
    
    return {
      pattern: routePath,
      path: routePath,
      type: routeType,
      params: {},
      parameters: this.getRouteParameters(routePath),
      filePath: metadata.filePath,
      method: 'GET' // Por defecto, se puede sobrescribir en el handler
    };
  }

  /**
   * Escanea recursivamente un directorio
   */
  private async scanDirectory(dirPath: string): Promise<RouteFileMetadata[]> {
    const files: RouteFileMetadata[] = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          // Recursivamente escanear subdirectorios
          const subFiles = await this.scanDirectory(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          // Procesar archivo
          const metadata = await this.getFileMetadata(fullPath);
          if (metadata) {
            files.push(metadata);
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${dirPath}: ${error}`);
    }
    
    return files;
  }

  /**
   * Obtiene metadatos de un archivo
   */
  private async getFileMetadata(filePath: string): Promise<RouteFileMetadata | null> {
    try {
      const stats = await fs.stat(filePath);
      const relativePath = relative(this.config.baseDir, filePath);
      
      return {
        filePath,
        relativePath: relativePath.replace(/\\/g, '/'), // Normalizar separadores
        fileName: basename(filePath, extname(filePath)),
        directory: dirname(relativePath),
        lastModified: stats.mtime,
        size: stats.size
      };
    } catch (error) {
      console.warn(`Warning: Could not get metadata for ${filePath}: ${error}`);
      return null;
    }
  }

  /**
   * Verifica si un archivo es válido para ser una ruta
   */
  private isValidRouteFile(metadata: RouteFileMetadata): boolean {
    const extension = extname(metadata.filePath);
    
    // Verificar extensión
    if (!this.config.extensions.includes(extension)) {
      return false;
    }
    
    // Verificar patrones de ignorar
    for (const pattern of this.config.ignore) {
      if (this.matchesPattern(metadata.fileName + extension, pattern) ||
          this.matchesPattern(metadata.relativePath, pattern)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Verifica si un nombre coincide con un patrón
   */
  private matchesPattern(name: string, pattern: string): boolean {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(name);
    }
    return name === pattern;
  }

  /**
   * Convierte la ruta del archivo a ruta de API
   */
  private getRoutePathFromFile(relativePath: string): string {
    // Remover extensión
    let routePath = relativePath.replace(/\.(ts|js)$/, '');
    
    // Convertir separadores de Windows a URL
    routePath = routePath.replace(/\\/g, '/');
    
    // Agregar slash inicial si no existe
    if (!routePath.startsWith('/')) {
      routePath = '/' + routePath;
    }
    
    return routePath;
  }

  /**
   * Determina el tipo de ruta basado en el patrón
   */
  private determineRouteType(routePath: string): RouteType {
    // Ruta con segmentos variables: [...segmentName]
    if (routePath.includes('[...')) {
      return 'variableSegments';
    }
    
    // Ruta con parámetros: [param]
    if (routePath.includes('[') && routePath.includes(']')) {
      // Contar parámetros
      const paramCount = (routePath.match(/\[[^\]]+\]/g) || []).length;
      return paramCount === 1 ? 'singleParam' : 'nested';
    }
    
    // Ruta simple
    return 'simple';
  }

  /**
   * Obtiene todos los parámetros de una ruta
   */
  getRouteParameters(routePath: string): string[] {
    const matches = routePath.match(/\[([^\]]+)\]/g);
    if (!matches) return [];
    
    return matches.map(match => {
      // Remover corchetes y puntos suspensivos
      return match.replace(/[\[\]]/g, '').replace(/^\.\.\./g, '');
    });
  }

  /**
   * Verifica si una ruta tiene parámetros variables
   */
  hasVariableSegments(routePath: string): boolean {
    return routePath.includes('[...');
  }

  /**
   * Extrae parámetros de una ruta (alias de getRouteParameters)
   */
  extractParameters(routePath: string): string[] {
    return this.getRouteParameters(routePath);
  }
}
import { ExtendedContext } from '../../../../types/handler';

/**
 * Ejemplo de ruta con segmentos variables: /api/products/[...segments]
 * Demuestra el manejo de rutas con múltiples segmentos dinámicos
 * 
 * Ejemplos de rutas que maneja:
 * - /api/products/electronics → { segments: ['electronics'] }
 * - /api/products/electronics/phones → { segments: ['electronics', 'phones'] }
 * - /api/products/electronics/phones/smartphones → { segments: ['electronics', 'phones', 'smartphones'] }
 * - /api/products/category/brand/model/variant → { segments: ['category', 'brand', 'model', 'variant'] }
 */

// Base de datos simulada de productos organizados por categorías
const productDatabase = {
  electronics: {
    phones: {
      smartphones: [
        { id: 1, name: 'iPhone 15', brand: 'Apple', price: 999 },
        { id: 2, name: 'Galaxy S24', brand: 'Samsung', price: 899 },
        { id: 3, name: 'Pixel 8', brand: 'Google', price: 699 }
      ],
      basic: [
        { id: 4, name: 'Nokia 3310', brand: 'Nokia', price: 59 }
      ]
    },
    laptops: {
      gaming: [
        { id: 5, name: 'ROG Strix', brand: 'ASUS', price: 1299 },
        { id: 6, name: 'Legion 5', brand: 'Lenovo', price: 1099 }
      ],
      business: [
        { id: 7, name: 'ThinkPad X1', brand: 'Lenovo', price: 1599 },
        { id: 8, name: 'MacBook Pro', brand: 'Apple', price: 1999 }
      ]
    }
  },
  clothing: {
    men: {
      shirts: [
        { id: 9, name: 'Camisa Formal', brand: 'Zara', price: 39 },
        { id: 10, name: 'Polo Casual', brand: 'Lacoste', price: 89 }
      ],
      pants: [
        { id: 11, name: 'Jeans Slim', brand: 'Levi\'s', price: 79 },
        { id: 12, name: 'Chinos', brand: 'Dockers', price: 59 }
      ]
    },
    women: {
      dresses: [
        { id: 13, name: 'Vestido Elegante', brand: 'H&M', price: 49 },
        { id: 14, name: 'Vestido Casual', brand: 'Mango', price: 35 }
      ]
    }
  },
  books: {
    fiction: {
      fantasy: [
        { id: 15, name: 'El Señor de los Anillos', author: 'J.R.R. Tolkien', price: 25 },
        { id: 16, name: 'Juego de Tronos', author: 'George R.R. Martin', price: 22 }
      ],
      mystery: [
        { id: 17, name: 'El Código Da Vinci', author: 'Dan Brown', price: 18 }
      ]
    },
    technical: {
      programming: [
        { id: 18, name: 'Clean Code', author: 'Robert C. Martin', price: 45 },
        { id: 19, name: 'JavaScript: The Good Parts', author: 'Douglas Crockford', price: 35 }
      ]
    }
  }
};

// Función auxiliar para navegar por la estructura de datos
function navigateToCategory(segments: string[]): any {
  let current: any = productDatabase;
  const path: string[] = [];
  
  for (const segment of segments) {
    if (current && typeof current === 'object' && segment in current) {
      current = current[segment];
      path.push(segment);
    } else {
      return null;
    }
  }
  
  return { data: current, path };
}

// Función auxiliar para obtener todas las categorías disponibles
function getAvailableCategories(segments: string[]): string[] {
  const result = navigateToCategory(segments);
  if (!result || !result.data || typeof result.data !== 'object') {
    return [];
  }
  
  return Object.keys(result.data);
}

// Función auxiliar para obtener productos de una categoría
function getProductsFromCategory(segments: string[]): any[] {
  const result = navigateToCategory(segments);
  if (!result || !result.data) {
    return [];
  }
  
  // Si es un array de productos, devolverlo directamente
  if (Array.isArray(result.data)) {
    return result.data;
  }
  
  // Si es un objeto, buscar recursivamente todos los productos
  const products: any[] = [];
  
  function collectProducts(obj: any) {
    if (Array.isArray(obj)) {
      products.push(...obj);
    } else if (typeof obj === 'object' && obj !== null) {
      Object.values(obj).forEach(collectProducts);
    }
  }
  
  collectProducts(result.data);
  return products;
}

// Handler para GET /api/products/[...segments]
export async function get(c: ExtendedContext) {
  const { segments } = c.params;
  
  // Convertir segments a array si es string
  const segmentArray = Array.isArray(segments) ? segments : [segments];
  
  // Si no hay segmentos, mostrar categorías principales
  if (!segmentArray || segmentArray.length === 0) {
    return c.json({
      success: true,
      data: {
        categories: Object.keys(productDatabase),
        message: 'Available main categories'
      },
      params: c.params,
      route: c.route
    });
  }
  
  // Navegar a la categoría especificada
  const result = navigateToCategory(segmentArray);
  
  if (!result) {
    return c.json({
      success: false,
      error: `Category path '${segmentArray.join('/')}' not found`,
      availableCategories: getAvailableCategories(segmentArray.slice(0, -1))
    }, 404);
  }
  
  // Si es un array de productos
  if (Array.isArray(result.data)) {
    return c.json({
      success: true,
      data: {
        products: result.data,
        categoryPath: segmentArray,
        total: result.data.length
      },
      params: c.params,
      route: c.route
    });
  }
  
  // Si es una categoría con subcategorías
  const subcategories = Object.keys(result.data);
  const allProducts = getProductsFromCategory(segmentArray);
  
  return c.json({
    success: true,
    data: {
      categoryPath: segmentArray,
      subcategories,
      products: allProducts,
      totalProducts: allProducts.length,
      message: `Category '${segmentArray.join('/')}' with ${subcategories.length} subcategories`
    },
    params: c.params,
    route: c.route
  });
}

// Handler para POST /api/products/[...segments]
export async function post(c: ExtendedContext) {
  const { segments } = c.params;
  const segmentArray = Array.isArray(segments) ? segments : [segments];
  
  try {
    const body = await c.req.json();
    
    // Validación básica
    if (!body.name || !body.price) {
      return c.json({
        success: false,
        error: 'Name and price are required'
      }, 400);
    }
    
    // Verificar que la categoría existe
    const result = navigateToCategory(segmentArray);
    
    if (!result) {
      return c.json({
        success: false,
        error: `Category path '${segmentArray.join('/')}' not found`
      }, 404);
    }
    
    // Crear nuevo producto
    const newProduct = {
      id: Date.now(),
      ...body,
      categoryPath: segmentArray,
      createdAt: new Date().toISOString()
    };
    
    // Si la categoría final es un array, agregar el producto
    if (Array.isArray(result.data)) {
      result.data.push(newProduct);
    }
    
    return c.json({
      success: true,
      data: newProduct,
      message: `Product added to category '${segmentArray.join('/')}'`,
      params: c.params,
      route: c.route
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: 'Invalid JSON body'
    }, 400);
  }
}

// Handler para PUT /api/products/[...segments] (crear/actualizar categoría)
export async function put(c: ExtendedContext) {
  const { segments } = c.params;
  const segmentArray = Array.isArray(segments) ? segments : [segments];
  
  try {
    const body = await c.req.json();
    
    return c.json({
      success: true,
      message: `Category '${segmentArray.join('/')}' management not implemented`,
      categoryPath: segmentArray,
      params: c.params,
      route: c.route
    }, 501);
  } catch (error) {
    return c.json({
      success: false,
      error: 'Invalid JSON body'
    }, 400);
  }
}

// Handler para DELETE /api/products/[...segments]
export async function del(c: ExtendedContext) {
  const { segments } = c.params;
  const segmentArray = Array.isArray(segments) ? segments : [segments];
  
  return c.json({
    success: true,
    message: `Category '${segmentArray.join('/')}' deletion not implemented`,
    categoryPath: segmentArray,
    params: c.params,
    route: c.route
  }, 501);
}

// Configuración de validación de parámetros
export const paramValidation = {
  segments: {
    type: 'array',
    required: true,
    minLength: 1,
    maxLength: 5,
    description: 'Category path segments (e.g., ["electronics", "phones", "smartphones"])'
  }
};

// Metadatos de la ruta
export const routeMetadata = {
  description: 'Navegación dinámica por categorías de productos usando segmentos variables',
  tags: ['products', 'categories', 'variable-segments'],
  version: '1.0.0',
  parameters: {
    segments: {
      type: 'array',
      description: 'Array of category path segments',
      examples: [
        ['electronics'],
        ['electronics', 'phones'],
        ['electronics', 'phones', 'smartphones'],
        ['clothing', 'men', 'shirts']
      ]
    }
  },
  examples: {
    routes: [
      '/api/products/electronics → Lista categoría electronics',
      '/api/products/electronics/phones → Lista subcategoría phones',
      '/api/products/electronics/phones/smartphones → Lista productos smartphones',
      '/api/products/clothing/men/shirts → Lista camisas de hombre'
    ]
  }
};
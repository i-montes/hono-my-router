import { ExtendedContext } from '../../../../types/handler';

/**
 * Ejemplo de ruta con parámetro único: /api/users/[id]
 * Demuestra el manejo de parámetros dinámicos y validación
 */

// Helper para obtener parámetro como string
function getParamAsString(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

// Base de datos simulada
const users = [
  { id: 1, name: 'Juan Pérez', email: 'juan@example.com', age: 30 },
  { id: 2, name: 'María García', email: 'maria@example.com', age: 25 },
  { id: 3, name: 'Carlos López', email: 'carlos@example.com', age: 35 }
];

// Handler para GET /api/users/:id
export async function get(c: ExtendedContext) {
  const { id } = c.params;
  
  // Buscar usuario por ID
  const user = users.find(u => u.id === parseInt(getParamAsString(id)));
  
  if (!user) {
    return c.json({
      success: false,
      error: `User with id ${id} not found`
    }, 404);
  }

  return c.json({
    success: true,
    data: user,
    params: c.params,
    route: c.route
  });
}

// Handler para PUT /api/users/:id
export async function put(c: ExtendedContext) {
  const { id } = c.params;
  
  try {
    const body = await c.req.json();
    
    // Buscar usuario
    const userIndex = users.findIndex(u => u.id === parseInt(getParamAsString(id)));
    
    if (userIndex === -1) {
      return c.json({
        success: false,
        error: `User with id ${id} not found`
      }, 404);
    }

    // Actualizar usuario
    const updatedUser = {
      ...users[userIndex],
      ...body,
      id: parseInt(getParamAsString(id)), // Mantener el ID original
      updatedAt: new Date().toISOString()
    };
    
    users[userIndex] = updatedUser;

    return c.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
      params: c.params,
      route: c.route
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Invalid JSON body'
    }, 400);
  }
}

// Handler para PATCH /api/users/:id
export async function patch(c: ExtendedContext) {
  const { id } = c.params;
  
  try {
    const body = await c.req.json();
    
    // Buscar usuario
    const userIndex = users.findIndex(u => u.id === parseInt(getParamAsString(id)));
    
    if (userIndex === -1) {
      return c.json({
        success: false,
        error: `User with id ${id} not found`
      }, 404);
    }

    // Actualización parcial
    const updatedUser = {
      ...users[userIndex],
      ...body,
      id: parseInt(getParamAsString(id)), // Mantener el ID original
      updatedAt: new Date().toISOString()
    };
    
    users[userIndex] = updatedUser;

    return c.json({
      success: true,
      data: updatedUser,
      message: 'User partially updated successfully',
      params: c.params,
      route: c.route
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Invalid JSON body'
    }, 400);
  }
}

// Handler para DELETE /api/users/:id
export async function del(c: ExtendedContext) {
  const { id } = c.params;
  
  // Buscar usuario
  const userIndex = users.findIndex(u => u.id === parseInt(getParamAsString(id)));
  
  if (userIndex === -1) {
    return c.json({
      success: false,
      error: `User with id ${id} not found`
    }, 404);
  }

  // Eliminar usuario
  const deletedUser = users.splice(userIndex, 1)[0];

  return c.json({
    success: true,
    data: deletedUser,
    message: 'User deleted successfully',
    params: c.params,
    route: c.route
  });
}

// Configuración de validación de parámetros
export const paramValidation = {
  id: {
    type: 'number',
    required: true,
    min: 1,
    description: 'User ID must be a positive integer'
  }
};

// Metadatos de la ruta
export const routeMetadata = {
  description: 'Operaciones CRUD para un usuario específico',
  tags: ['users', 'crud', 'single'],
  version: '1.0.0',
  parameters: {
    id: {
      type: 'integer',
      description: 'Unique identifier for the user',
      example: 123
    }
  }
};
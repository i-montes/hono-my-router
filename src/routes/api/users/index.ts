import { ExtendedContext } from '../../../../types/handler';

/**
 * Ejemplo de ruta simple: /api/users
 * Demuestra el manejo básico de rutas sin parámetros
 */

// Handler para GET /api/users
export async function get(c: ExtendedContext) {
  const users = [
    { id: 1, name: 'Juan Pérez', email: 'juan@example.com' },
    { id: 2, name: 'María García', email: 'maria@example.com' },
    { id: 3, name: 'Carlos López', email: 'carlos@example.com' }
  ];

  return c.json({
    success: true,
    data: users,
    total: users.length,
    route: c.route
  });
}

// Handler para POST /api/users
export async function post(c: ExtendedContext) {
  try {
    const body = await c.req.json();
    
    // Validación básica
    if (!body.name || !body.email) {
      return c.json({
        success: false,
        error: 'Name and email are required'
      }, 400);
    }

    // Simular creación de usuario
    const newUser = {
      id: Date.now(),
      name: body.name,
      email: body.email,
      createdAt: new Date().toISOString()
    };

    return c.json({
      success: true,
      data: newUser,
      message: 'User created successfully',
      route: c.route
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: 'Invalid JSON body'
    }, 400);
  }
}

// Handler para PUT /api/users (actualización masiva)
export async function put(c: ExtendedContext) {
  return c.json({
    success: true,
    message: 'Bulk update not implemented',
    route: c.route
  }, 501);
}

// Handler para DELETE /api/users (eliminación masiva)
export async function del(c: ExtendedContext) {
  return c.json({
    success: true,
    message: 'Bulk delete not implemented',
    route: c.route
  }, 501);
}

// Configuración de validación de parámetros (opcional)
export const paramValidation = {
  // No hay parámetros en esta ruta
};

// Metadatos de la ruta (opcional)
export const routeMetadata = {
  description: 'Gestión de usuarios - operaciones CRUD básicas',
  tags: ['users', 'crud'],
  version: '1.0.0'
};
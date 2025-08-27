import { ExtendedContext } from '../../../../../types/handler';

/**
 * Ejemplo de ruta anidada: /api/users/[id]/profile
 * Demuestra el manejo de rutas con múltiples niveles de anidación
 */

// Helper para obtener parámetro como string
function getParamAsString(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

// Base de datos simulada de perfiles
const userProfiles = [
  {
    userId: 1,
    bio: 'Desarrollador Full Stack con 5 años de experiencia',
    avatar: 'https://example.com/avatars/juan.jpg',
    location: 'Madrid, España',
    website: 'https://juan-dev.com',
    social: {
      twitter: '@juandev',
      linkedin: 'juan-perez-dev',
      github: 'juanperez'
    },
    preferences: {
      theme: 'dark',
      language: 'es',
      notifications: true
    }
  },
  {
    userId: 2,
    bio: 'Diseñadora UX/UI apasionada por crear experiencias increíbles',
    avatar: 'https://example.com/avatars/maria.jpg',
    location: 'Barcelona, España',
    website: 'https://maria-design.com',
    social: {
      twitter: '@mariadesign',
      linkedin: 'maria-garcia-ux',
      dribbble: 'mariagarcia'
    },
    preferences: {
      theme: 'light',
      language: 'es',
      notifications: false
    }
  },
  {
    userId: 3,
    bio: 'Product Manager enfocado en tecnologías emergentes',
    avatar: 'https://example.com/avatars/carlos.jpg',
    location: 'Valencia, España',
    website: 'https://carlos-pm.com',
    social: {
      twitter: '@carlospm',
      linkedin: 'carlos-lopez-pm'
    },
    preferences: {
      theme: 'auto',
      language: 'en',
      notifications: true
    }
  }
];

// Handler para GET /api/users/:id/profile
export async function get(c: ExtendedContext) {
  const { id } = c.params;
  const userId = parseInt(getParamAsString(id));
  
  // Buscar perfil del usuario
  const profile = userProfiles.find(p => p.userId === userId);
  
  if (!profile) {
    return c.json({
      success: false,
      error: `Profile for user ${id} not found`
    }, 404);
  }

  return c.json({
    success: true,
    data: profile,
    params: c.params,
    route: c.route
  });
}

// Handler para PUT /api/users/:id/profile
export async function put(c: ExtendedContext) {
  const { id } = c.params;
  const userId = parseInt(getParamAsString(id));
  
  try {
    const body = await c.req.json();
    
    // Buscar perfil existente
    const profileIndex = userProfiles.findIndex(p => p.userId === userId);
    
    if (profileIndex === -1) {
      // Crear nuevo perfil si no existe
      const newProfile = {
        userId,
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      userProfiles.push(newProfile);
      
      return c.json({
        success: true,
        data: newProfile,
        message: 'Profile created successfully',
        params: c.params,
        route: c.route
      }, 201);
    }

    // Actualizar perfil existente
    const updatedProfile = {
      ...userProfiles[profileIndex],
      ...body,
      userId, // Mantener el userId original
      updatedAt: new Date().toISOString()
    };
    
    userProfiles[profileIndex] = updatedProfile;

    return c.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully',
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

// Handler para PATCH /api/users/:id/profile
export async function patch(c: ExtendedContext) {
  const { id } = c.params;
  const userId = parseInt(getParamAsString(id));
  
  try {
    const body = await c.req.json();
    
    // Buscar perfil
    const profileIndex = userProfiles.findIndex(p => p.userId === userId);
    
    if (profileIndex === -1) {
      return c.json({
        success: false,
        error: `Profile for user ${id} not found`
      }, 404);
    }

    // Actualización parcial con merge profundo para objetos anidados
    const currentProfile = userProfiles[profileIndex];
    const updatedProfile = {
      ...currentProfile,
      ...body,
      userId, // Mantener el userId original
      updatedAt: new Date().toISOString()
    };
    
    // Merge profundo para objetos anidados como social y preferences
    if (body.social && currentProfile.social) {
      updatedProfile.social = { ...currentProfile.social, ...body.social };
    }
    
    if (body.preferences && currentProfile.preferences) {
      updatedProfile.preferences = { ...currentProfile.preferences, ...body.preferences };
    }
    
    userProfiles[profileIndex] = updatedProfile;

    return c.json({
      success: true,
      data: updatedProfile,
      message: 'Profile partially updated successfully',
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

// Handler para DELETE /api/users/:id/profile
export async function del(c: ExtendedContext) {
  const { id } = c.params;
  const userId = parseInt(getParamAsString(id));
  
  // Buscar perfil
  const profileIndex = userProfiles.findIndex(p => p.userId === userId);
  
  if (profileIndex === -1) {
    return c.json({
      success: false,
      error: `Profile for user ${id} not found`
    }, 404);
  }

  // Eliminar perfil
  const deletedProfile = userProfiles.splice(profileIndex, 1)[0];

  return c.json({
    success: true,
    data: deletedProfile,
    message: 'Profile deleted successfully',
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
  description: 'Gestión del perfil de usuario - información extendida',
  tags: ['users', 'profile', 'nested'],
  version: '1.0.0',
  parameters: {
    id: {
      type: 'integer',
      description: 'Unique identifier for the user',
      example: 123
    }
  },
  examples: {
    profileData: {
      bio: 'Desarrollador apasionado por la tecnología',
      location: 'Madrid, España',
      website: 'https://mi-web.com',
      social: {
        twitter: '@miusuario',
        linkedin: 'mi-perfil'
      },
      preferences: {
        theme: 'dark',
        language: 'es',
        notifications: true
      }
    }
  }
};
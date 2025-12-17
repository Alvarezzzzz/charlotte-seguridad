import { UserModel } from '../models/user.js';
import { generateToken } from '../utils/jwt.js';
import { comparePassword, validatePassword } from '../utils/password.js';
import { prisma } from '../db/client.js';

export class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email y contraseña son requeridos',
        });
        return;
      }

      const user = await UserModel.findByEmail(email);

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Credenciales inválidas',
        });
        return;
      }

      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Credenciales inválidas',
        });
        return;
      }

      // Obtener IDs de roles
      const roleIds = user.roles.map((role) => role.id);

      // Crear payload del token
      const tokenPayload = {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        address: user.address || undefined,
        phone: user.phone || undefined,
        dataType: user.dataType || undefined,
        birthDate: user.birthDate.toISOString().split('T')[0],
        dni: user.dni,
        isAdmin: user.isAdmin,
        roles: roleIds,
      };

      const token = generateToken(tokenPayload);

      res.json({ token });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error al iniciar sesión',
      });
    }
  }

  async getRoles(req, res) {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      const { roles } = req.body;

      if (!roles || !Array.isArray(roles) || roles.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Se requiere un array de IDs de roles',
        });
        return;
      }

      // Verificar que el usuario existe y tiene esos roles
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          roles: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
        return;
      }

      // Verificar que todos los roles pertenecen al usuario
      const userRoleIds = user.roles.map((r) => r.id);
      const allRolesBelongToUser = roles.every((id) => userRoleIds.includes(id));

      if (!allRolesBelongToUser) {
        res.status(403).json({
          success: false,
          message: 'Uno o más roles no pertenecen al usuario',
        });
        return;
      }

      // Verificar que todos los roles existen
      const rolesData = await prisma.role.findMany({
        where: { id: { in: roles } },
        include: {
          permissions: true,
        },
      });

      if (rolesData.length !== roles.length) {
        res.status(404).json({
          success: false,
          message: 'Uno o más roles no existen',
        });
        return;
      }

      const result = rolesData.map((role) => ({
        id: role.id,
        name: role.name,
        isAdmin: role.isAdmin,
        permissions: role.permissions.map((perm) => ({
          id: perm.id,
          type: perm.type,
          resource: perm.resource,
          method: perm.method,
          isAdmin: role.isAdmin,
        })),
      }));

      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener roles',
      });
    }
  }

  async verifyLocation(req, res) {
    try {
      const { latitude, longitude } = req.body;

      if (latitude === undefined || longitude === undefined) {
        res.status(400).json({
          success: false,
          message: 'Latitud y longitud son requeridos',
        });
        return;
      }

      // Obtener la configuración del restaurante
      const restaurant = await prisma.restaurant.findFirst({
        orderBy: { id: 'asc' },
      });

      if (!restaurant) {
        res.status(400).json({
          success: false,
          message: 'La ubicación del restaurante no está configurada',
        });
        return;
      }

      const { isWithinRadius } = await import('../utils/location.js');
      const restLat = Number(restaurant.latitude);
      const restLon = Number(restaurant.longitud);
      const restRadius = Number(restaurant.radius);

      const is_inside = isWithinRadius(latitude, longitude, restLat, restLon, restRadius);

      res.json({
        is_inside,
        latitude,
        longitude,
        restaurant: {
          latitude: restLat,
          longitude: restLon,
          radius: restRadius,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al verificar ubicación',
      });
    }
  }

  async changePasswordAdmin(req, res) {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      const { user_id, new_password } = req.body;

      if (!user_id || !new_password) {
        res.status(400).json({
          success: false,
          message: 'user_id y new_password son requeridos',
        });
        return;
      }

      // Verificar permisos según especificaciones:
      // - isAdmin: true, O
      // - type: "RESOURCE", resource: "User_seguridad", method: "UPDATE" o "ALL"
      let hasPermission = false;

      if (req.user.isAdmin) {
        hasPermission = true;
      } else {
        // Obtener roles del usuario desde la BD
        const user = await prisma.user.findUnique({
          where: { id: req.user.id },
          include: {
            roles: {
              include: {
                permissions: true,
              },
            },
          },
        });

        if (user) {
          // Iterar sobre los permisos de todos los roles del usuario
          for (const role of user.roles) {
            for (const permission of role.permissions) {
              // Verificar según especificaciones: type="RESOURCE", resource="User_seguridad", method="UPDATE" o "ALL"
              // Nota: También aceptamos "RECURSO" por compatibilidad con la BD actual
              const isValidType = permission.type === 'RESOURCE' || permission.type === 'RECURSO';
              const isValidResource = permission.resource === 'User_seguridad' || String(permission.resource) === 'User_seguridad';
              const isValidMethod = permission.method === 'UPDATE' || permission.method === 'ALL';

              if (isValidType && isValidResource && isValidMethod) {
                hasPermission = true;
                break;
              }
            }
            if (hasPermission) break;
          }
        }
      }

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'No tiene permisos para realizar esta acción',
        });
        return;
      }

      // Verificar que el usuario existe
      const targetUser = await UserModel.findById(user_id);
      if (!targetUser) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
        return;
      }

      // Validar nueva contraseña
      const passwordValidation = validatePassword(new_password);
      if (!passwordValidation.valid) {
        res.status(400).json({
          success: false,
          message: passwordValidation.message,
        });
        return;
      }

      await UserModel.changePassword(user_id, new_password);

      res.json({
        message: 'Cambio de contraseña ejecutado exitosamente',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al cambiar contraseña',
      });
    }
  }

  async changePassword(req, res) {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        res.status(400).json({
          success: false,
          message: 'current_password y new_password son requeridos',
        });
        return;
      }

      // Verificar token de sesión válido y consultar información del usuario en BD
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
        return;
      }

      // Verificar que la contraseña actual coincida con la del body
      const isCurrentPasswordValid = await comparePassword(current_password, user.password);
      if (!isCurrentPasswordValid) {
        res.status(400).json({
          success: false,
          message: 'La contraseña actual es incorrecta',
        });
        return;
      }

      // Verificar que la nueva contraseña sea correcta
      const passwordValidation = validatePassword(new_password);
      if (!passwordValidation.valid) {
        res.status(400).json({
          success: false,
          message: passwordValidation.message,
        });
        return;
      }

      await UserModel.changePassword(req.user.id, new_password);

      res.json({
        message: 'Cambio de contraseña ejecutado exitosamente',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al cambiar contraseña',
      });
    }
  }
}



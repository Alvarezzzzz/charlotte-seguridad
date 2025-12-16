import { validateUser, validatePartialUser } from "../schemas/user.js";
import { UserModel } from "../models/user.js";
import { validatePassword } from '../utils/password.js';

export class UserController {
  constructor() {}

  createUser = async (req, res) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      // Verificar permisos
      const hasPermission =
        req.user.isAdmin ||
        (await UserModel.checkUserPermission(req.user.id, 'User', 'CREATE'));

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'No tiene permisos para crear usuarios',
        });
        return;
      }

      const result = validateUser(req.body);

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: result.error.errors,
        });
        return;
      }

      const { password, roles, birthDate, ...userData } = result.data;

      // Validar contraseña
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        res.status(400).json({
          success: false,
          message: passwordValidation.message,
        });
        return;
      }

      // Verificar roles si se proporcionan
      if (roles && roles.length > 0) {
        const { prisma } = await import('../db/client.js');
        const existingRoles = await prisma.role.findMany({
          where: { id: { in: roles } },
        });

        if (existingRoles.length !== roles.length) {
          res.status(400).json({
            success: false,
            message: 'Uno o más roles no existen',
          });
          return;
        }
      }

      const user = await UserModel.create({
        ...userData,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        password,
        roles: roles || [],
      });

      res.status(201).json({
        message: 'Usuario creado exitosamente',
        user_id: user.id,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        res.status(400).json({
          success: false,
          message: 'El email o DNI ya está registrado',
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: error.message || 'Error al crear usuario',
      });
    }
  };

  getUserById = async (req, res) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      // Verificar permisos
      const hasPermission =
        req.user.isAdmin ||
        (await UserModel.checkUserPermission(req.user.id, 'User', 'READ'));

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'No tiene permisos para ver usuarios',
        });
        return;
      }

      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'ID inválido',
        });
        return;
      }

      const user = await UserModel.findById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
        return;
      }

      res.json({
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        address: user.address,
        phone: user.phone,
        dataType: user.dataType,
        birthDate: user.birthDate.toISOString().split('T')[0],
        dni: user.dni,
        roles: user.roles.map((role) => ({
          id: role.id,
          name: role.name,
          description: role.description,
          isAdmin: role.isAdmin,
          permissions: role.permissions.map((perm) => ({
            id: perm.id,
            name: perm.name,
            type: perm.type,
            resource: perm.resource,
            method: perm.method,
            isAdmin: role.isAdmin,
          })),
        })),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener usuario',
      });
    }
  };

  updateUser = async (req, res) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      // Verificar permisos
      const hasPermission =
        req.user.isAdmin ||
        (await UserModel.checkUserPermission(req.user.id, 'User', 'UPDATE'));

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'No tiene permisos para actualizar usuarios',
        });
        return;
      }

      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'ID inválido',
        });
        return;
      }

      const result = validatePartialUser(req.body);

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: result.error.errors,
        });
        return;
      }

      // Verificar que el usuario existe
      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
        return;
      }

      const { roles, birthDate, ...userData } = result.data;

      // Verificar roles si se proporcionan
      if (roles && roles.length > 0) {
        const { prisma } = await import('../db/client.js');
        const existingRoles = await prisma.role.findMany({
          where: { id: { in: roles } },
        });

        if (existingRoles.length !== roles.length) {
          res.status(400).json({
            success: false,
            message: 'Uno o más roles no existen',
          });
          return;
        }
      }

      await UserModel.update(id, {
        ...userData,
        ...(birthDate && { birthDate: new Date(birthDate) }),
        roles: roles || undefined,
      });

      res.json({
        message: 'Usuario actualizado exitosamente',
        user_id: id,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        res.status(400).json({
          success: false,
          message: 'El email o DNI ya está registrado',
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: error.message || 'Error al actualizar usuario',
      });
    }
  };

  deleteUser = async (req, res) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      // Verificar permisos
      const hasPermission =
        req.user.isAdmin ||
        (await UserModel.checkUserPermission(req.user.id, 'User', 'DELETE'));

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'No tiene permisos para eliminar usuarios',
        });
        return;
      }

      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'ID inválido',
        });
        return;
      }

      // Verificar que el usuario existe
      const user = await UserModel.findById(id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
        return;
      }

      // No se puede eliminar el usuario admin
      if (user.isAdmin) {
        res.status(403).json({
          success: false,
          message: 'No se puede eliminar el usuario administrador',
        });
        return;
      }

      await UserModel.delete(id);

      res.json({
        message: 'Usuario Eliminado exitosamente',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al eliminar usuario',
      });
    }
  };

  getAllUsers = async (req, res) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      // Verificar permisos
      const hasPermission =
        req.user.isAdmin ||
        (await UserModel.checkUserPermission(req.user.id, 'User', 'READ'));

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'No tiene permisos para ver usuarios',
        });
        return;
      }

      const dataType = req.query.dataType || null;
      const users = await UserModel.getAll(dataType);

      const result = users.map((user) => ({
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        address: user.address,
        phone: user.phone,
        dataType: user.dataType,
        birthDate: user.birthDate.toISOString().split('T')[0],
        dni: user.dni,
        isAdmin: user.isAdmin,
        roles: user.roles.map((role) => ({
          id: role.id,
          name: role.name,
          description: role.description,
          isAdmin: role.isAdmin,
          permissions: role.permissions.map((perm) => ({
            id: perm.id,
            name: perm.name,
            type: perm.type,
            resource: perm.resource,
            method: perm.method,
            isAdmin: role.isAdmin,
          })),
        })),
      }));

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener usuarios',
      });
    }
  };
}

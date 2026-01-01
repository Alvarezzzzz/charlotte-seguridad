import { validateUser, validatePartialUser } from "../schemas/user.js";
import { UserModel } from "../models/user.js";
import { validatePassword } from "../utils/password.js";
import { getFormattedError } from "../utils/erros.js";
import { DataType } from "@prisma/client";

export class UserController {
  constructor() {}

  createUser = async (req, res) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
        return;
      }

      // Verificar permisos
      const hasPermission =
        req.user.isAdmin ||
        (await UserModel.checkUserPermission(
          req.user.id,
          "User_seguridad",
          "Create"
        ));

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: "No tiene permisos para crear usuarios",
        });
        return;
      }

      const result = validateUser(req.body);

      if (!result.success) {
        console.log(result.error);
        const formattedErrors = getFormattedError(result.error);
        res.status(400).json({
          success: false,
          message: "Datos inválidos",
          errors: formattedErrors,
        });
        return;
      }

      const { password, roles, birthDate, email, dni, isActive, ...userData } =
        result.data;

      // Validar contraseña
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        res.status(400).json({
          success: false,
          message: passwordValidation.message,
        });
        return;
      }

      // Validar que el email no esté en uso
      const existingUserByEmail = await UserModel.findByEmail(email);
      if (existingUserByEmail) {
        res.status(400).json({
          success: false,
          message: "El email ya está en uso",
        });
        return;
      }

      // Validar que el DNI no esté en uso
      const existingUserByDni = await UserModel.findByDni(dni);
      if (existingUserByDni) {
        res.status(400).json({
          success: false,
          message: "El DNI ya está en uso",
        });
        return;
      }

      // Verificar roles si se proporcionan
      if (roles && roles.length > 0) {
        const { prisma } = await import("../db/client.js");
        const existingRoles = await prisma.role.findMany({
          where: { id: { in: roles } },
        });

        if (existingRoles.length !== roles.length) {
          res.status(400).json({
            success: false,
            message: "Uno o más roles no existen",
          });
          return;
        }
      }

      // Establecer isActive por defecto en true si no se proporciona
      const userIsActive = isActive !== undefined ? isActive : true;

      const user = await UserModel.create({
        ...userData,
        email,
        dni,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        password,
        isActive: userIsActive,
        roles: roles || [],
      });

      res.status(201).json({
        message: "Usuario creado exitosamente",
        user_id: user.id,
      });
    } catch (error) {
      console.error(error);
      if (error.code === "P2002") {
        res.status(400).json({
          success: false,
          message: "El email o DNI ya está registrado",
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: error.message || "Error al crear usuario",
      });
    }
  };

  getUserById = async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: "ID inválido",
        });
        return;
      }

      const user = await UserModel.findById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
        return;
      }

      res.json({
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        address: user.address,
        phone: user.phone,
        dataType: user.dataType,
        birthDate: user.birthDate.toISOString().split("T")[0],
        dni: user.dni,
        isAdmin: user.isAdmin,
        isActive: user.isActive,
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
      console.error(error);
      res.status(500).json({
        success: false,
        message: error.message || "Error al obtener usuario",
      });
    }
  };

  updateUser = async (req, res) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
        return;
      }

      // Verificar permisos
      const hasPermission =
        req.user.isAdmin ||
        (await UserModel.checkUserPermission(
          req.user.id,
          "User_seguridad",
          "Update"
        ));

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: "No tiene permisos para actualizar usuarios",
        });
        return;
      }

      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: "ID inválido",
        });
        return;
      }

      const result = validatePartialUser(req.body);

      if (!result.success) {
        console.log(result.error);
        const formattedErrors = getFormattedError(result.error);
        res.status(400).json({
          success: false,
          message: "Datos inválidos",
          errors: formattedErrors,
        });
        return;
      }

      // Verificar que el usuario existe
      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
        return;
      }

      const { roles, birthDate, email, dni, isActive, ...userData } =
        result.data;

      // Validar que el email no esté en uso (solo si se está actualizando)
      if (email && email !== existingUser.email) {
        const existingUserByEmail = await UserModel.findByEmail(email);
        if (existingUserByEmail) {
          res.status(400).json({
            success: false,
            message: "El email ya está en uso",
          });
          return;
        }
      }

      // Validar que el DNI no esté en uso (solo si se está actualizando)
      if (dni && dni !== existingUser.dni) {
        const existingUserByDni = await UserModel.findByDni(dni);
        if (existingUserByDni) {
          res.status(400).json({
            success: false,
            message: "El DNI ya está en uso",
          });
          return;
        }
      }

      // Verificar roles si se proporcionan
      if (roles && roles.length > 0) {
        const { prisma } = await import("../db/client.js");
        const existingRoles = await prisma.role.findMany({
          where: { id: { in: roles } },
        });

        if (existingRoles.length !== roles.length) {
          res.status(400).json({
            success: false,
            message: "Uno o más roles no existen",
          });
          return;
        }
      }

      // Verifica si es el usuario admin para no permitir desactivarlo
      if (existingUser.isAdmin && isActive === false) {
        res.status(403).json({
          success: false,
          message: "No se puede desactivar el usuario administrador",
        });
        return;
      }

      await UserModel.update(id, {
        ...userData,
        ...(email && { email }),
        ...(dni && { dni }),
        ...(birthDate && { birthDate: new Date(birthDate) }),
        ...(isActive !== undefined && { isActive }),
        roles: roles || undefined,
      });

      res.json({
        message: "Usuario actualizado exitosamente",
        user_id: id,
      });
    } catch (error) {
      console.error(error);
      if (error.code === "P2002") {
        res.status(400).json({
          success: false,
          message: "El email o DNI ya está registrado",
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: error.message || "Error al actualizar usuario",
      });
    }
  };

  deleteUser = async (req, res) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
        return;
      }

      // Verificar permisos
      const hasPermission =
        req.user.isAdmin ||
        (await UserModel.checkUserPermission(
          req.user.id,
          "User_seguridad",
          "Delete"
        ));

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: "No tiene permisos para eliminar usuarios",
        });
        return;
      }

      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: "ID inválido",
        });
        return;
      }

      // Verificar que el usuario existe
      const user = await UserModel.findById(id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
        return;
      }

      // No se puede eliminar el usuario admin
      if (user.isAdmin) {
        res.status(403).json({
          success: false,
          message: "No se puede eliminar el usuario administrador",
        });
        return;
      }

      await UserModel.delete(id);

      res.json({
        message: "Usuario Eliminado exitosamente",
      });
    } catch (error) {
      console.error(error);
      res.status(400).json({
        success: false,
        message: error.message || "Error al eliminar usuario",
      });
    }
  };

  getAllUsers = async (req, res) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
        return;
      }

      // Verificar permisos
      const hasPermission =
        req.user.isAdmin ||
        (await UserModel.checkUserPermission(
          req.user.id,
          "User_seguridad",
          "Read"
        ));

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: "No tiene permisos para ver usuarios",
        });
        return;
      }

      const dataType = req.query.dataType || null;

      // Validar que el dataType pasado sea un valor válido según el enum del schema.prisma
      if (dataType && !Object.values(DataType).includes(dataType)) {
        res.status(400).json({
          success: false,
          message: `El dataType "${dataType}" no es válido. Valores válidos: ${Object.values(
            DataType
          ).join(", ")}`,
        });
        return;
      }

      const users = await UserModel.getAll(dataType);

      const result = users.map((user) => ({
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        address: user.address,
        phone: user.phone,
        dataType: user.dataType,
        birthDate: user.birthDate.toISOString().split("T")[0],
        dni: user.dni,
        isAdmin: user.isAdmin,
        isActive: user.isActive,
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
      console.error(error);
      res.status(500).json({
        success: false,
        message: error.message || "Error al obtener usuarios",
      });
    }
  };

  // Endpoint 6: Actualizar datos de usuario por token de sesión
  updateUserByToken = async (req, res) => {
    try {
      // Verificar autenticación
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Token de autenticación requerido",
        });
        return;
      }
      if (
        req.body.password ||
        req.body.isActive ||
        req.body.roles ||
        req.body.dataType
      ) {
        res.status(400).json({
          success: false,
          message:
            "No se puede cambiar la contraseña o el estado isActive o los roles o el dataType por este endpoint",
        });
        return;
      }

      // Validar datos del body
      const result = validatePartialUser(req.body);

      if (!result.success) {
        const formattedErrors = getFormattedError(result.error);
        res.status(400).json({
          success: false,
          message: "Datos inválidos para la actualización del usuario",
          errors: formattedErrors,
        });
        return;
      }

      // Verificar que el usuario existe
      const existingUser = await UserModel.findById(req.user.id);
      if (!existingUser) {
        res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
        return;
      }

      const { roles, birthDate, password, email, dni, isActive, ...userData } =
        result.data;

      // Validar que el email no esté en uso (solo si se está actualizando)
      if (email && email !== existingUser.email) {
        const existingUserByEmail = await UserModel.findByEmail(email);
        if (existingUserByEmail) {
          res.status(400).json({
            success: false,
            message: "El email ya está en uso",
          });
          return;
        }
      }

      // Validar que el DNI no esté en uso (solo si se está actualizando)
      if (dni && dni !== existingUser.dni) {
        const existingUserByDni = await UserModel.findByDni(dni);
        if (existingUserByDni) {
          res.status(400).json({
            success: false,
            message: "El DNI ya está en uso",
          });
          return;
        }
      }

      // Actualizar el usuario
      const updatedUser = await UserModel.update(req.user.id, {
        ...userData,
        ...(email && { email }),
        ...(dni && { dni }),
        ...(birthDate && { birthDate: new Date(birthDate) }),
      });

      // Generar nuevo token con los datos actualizados
      const { generateToken } = await import("../utils/jwt.js");
      const newToken = generateToken({
        id: updatedUser.id,
        name: updatedUser.name,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        address: updatedUser.address,
        phone: updatedUser.phone,
        dataType: updatedUser.dataType,
        birthDate: updatedUser.birthDate.toISOString().split("T")[0],
        dni: updatedUser.dni,
        isAdmin: updatedUser.isAdmin,
        isActive: updatedUser.isActive,
        roles: updatedUser.roles.map((role) => role.id),
      });

      res.json({
        message: "Usuario actualizado exitosamente",
        user_id: updatedUser.id,
        token: newToken,
      });
    } catch (error) {
      console.error(error);
      if (error.code === "P2002") {
        res.status(400).json({
          success: false,
          message: "El email o DNI ya está registrado",
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: error.message || "Error al actualizar usuario",
      });
    }
  };
}

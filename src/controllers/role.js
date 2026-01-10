import {
  validateRole,
  validatePartialRole,
  validatePartialUpdateRole,
} from "../schemas/role.js";
import { RoleModel } from "../models/role.js";
import { UserModel } from "../models/user.js";
import { getFormattedError, validarRecursosUnicos } from "../utils/erros.js";

export class RoleController {
  constructor() {
    this.roleModel = new RoleModel();
  }

  getAllRoles = async (req, res) => {
    try {
      const hasPermission =
        req.user.isAdmin ||
        (await UserModel.checkUserPermission(
          req.user.id,
          "Role_seguridad",
          "Read"
        ));

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "No tiene permisos para ver roles",
        });
      }

      const includeUsers = req.query.includeUsers === "true";
      const roles = await this.roleModel.getAll({ includeUsers });

      const result = roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: (role.permissions || []).map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          resource: p.resource,
          method: p.method,
        })),
        ...(includeUsers && {
          users: (role.users || []).map((u) => ({
            id: u.id,
            name: u.name,
            lastName: u.lastName,
            email: u.email,
          })),
        }),
      }));
      res.json(result);
    } catch (error) {
      console.error("Error en RoleController:", error);
      res
        .status(500)
        .json({ success: false, message: "Error interno del servidor" });
    }
  };

  getRoleById = async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const includeUsers = req.query.includeUsers === "true";

      const hasPermission =
        req.user.isAdmin ||
        (await UserModel.checkUserPermission(
          req.user.id,
          "Role_seguridad",
          "Read"
        ));

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "No tiene permisos para ver roles",
        });
      }

      const role = await this.roleModel.findById({ id, includeUsers });

      if (!role)
        return res
          .status(404)
          .json({ success: false, message: "Rol no encontrado" });

      const output = [
        {
          id: role.id,
          name: role.name,
          description: role.description,
          permissions: (role.permissions || []).map((p) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            resource: p.resource,
            method: p.method,
          })),
          ...(includeUsers && {
            users: (role.users || []).map((u) => ({
              id: u.id,
              name: u.name,
              lastName: u.lastName,
              email: u.email,
            })),
          }),
        },
      ];

      return res.json(output);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  createRole = async (req, res) => {
    try {
      const hasPermission =
        req.user.isAdmin ||
        (await UserModel.checkUserPermission(
          req.user.id,
          "Role_seguridad",
          "Create"
        ));

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "No tiene permisos para crear roles",
        });
      }

      const result = validateRole(req.body);
      if (!result.success) {
        const formattedError = getFormattedError(result.error);
        return res.status(400).json({ success: false, errors: formattedError });
      }

      const { name, description, permissions, users } = result.data;
      const { prisma } = await import("../db/client.js");

      const existingRole = await prisma.role.findUnique({ where: { name } });
      if (existingRole) {
        return res
          .status(409)
          .json({ success: false, message: "El nombre del rol ya existe" });
      }

      if (users && users.length > 0) {
        const foundUsers = await prisma.user.findMany({
          where: { id: { in: users.map((id) => Number(id)) } },
        });

        if (foundUsers.length !== users.length) {
          return res
            .status(404)
            .json({ success: false, message: "Uno o más usuarios no existen" });
        }

        const inactiveUsers = foundUsers.filter((u) => !u.isActive);
        if (inactiveUsers.length > 0) {
          return res.status(400).json({
            success: false,
            message: "No se puede vincular el rol: hay usuarios inactivos",
            details: inactiveUsers.map((u) => ({ id: u.id, email: u.email })),
          });
        }
      }

      const newRole = await this.roleModel.create({
        data: {
          name,
          description,
          users,

          permissions: permissions || [],
        },
        include: {
          permissions: true,
        },
      });

      return res.status(201).json({
        message: "Rol creado exitosamente",
        role_id: newRole.id,
      });
    } catch (error) {
      console.error("Error detallado en createRole:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno al crear el rol",
        error: error.message,
      });
    }
  };

  updateRole = async (req, res) => {
    try {
      const { id } = req.params;

      const hasPermission =
        req.user.isAdmin ||
        (await UserModel.checkUserPermission(
          req.user.id,
          "Role_seguridad",
          "Update"
        ));

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "No autorizado para actualizar roles",
        });
      }

      const roleToUpdate = await this.roleModel.findById({ id: Number(id) });
      if (!roleToUpdate) {
        return res
          .status(404)
          .json({ success: false, message: "El rol no existe" });
      }

      const result = validatePartialUpdateRole(req.body);
      if (!result.success) {
        const formattedError = getFormattedError(result.error);
        return res.status(400).json({ success: false, errors: formattedError });
      }

      const existing_permissions = result.data.existing_permissions || [];
      const new_permissions = result.data.new_permissions || [];

      const combinedPermissions = [...existing_permissions, ...new_permissions];
      const validacion = validarRecursosUnicos(combinedPermissions);
      if (!validacion.esValido) {
        return res.status(400).json({
          success: false,
          message: validacion.mensaje,
        });
      }

      // mapea los ids de existing_permissions verifica que pertenecen al rol a actualizar
      for (const perm of existing_permissions) {
        const permId = perm.id;
        const pertenece = roleToUpdate.permissions.some((p) => p.id === permId);
        if (!pertenece) {
          return res.status(400).json({
            success: false,
            message: `El permiso con id ${permId} no pertenece al rol`,
          });
        }
      }

      const { name, permissions, users } = result.data;
      const { prisma } = await import("../db/client.js");

      if (name && name !== roleToUpdate.name) {
        const nameExists = await prisma.role.findUnique({ where: { name } });
        if (nameExists) {
          return res.status(409).json({
            success: false,
            message: "El nuevo nombre de rol ya está en uso",
          });
        }
      }

      if (users && users.length > 0) {
        const foundUsers = await prisma.user.findMany({
          where: { id: { in: users.map((u) => Number(u)) } },
        });

        if (foundUsers.length !== users.length) {
          return res
            .status(404)
            .json({ success: false, message: "Uno o más usuarios no existen" });
        }

        const hasInactive = foundUsers.some((u) => !u.isActive);
        if (hasInactive) {
          return res.status(400).json({
            success: false,
            message:
              "No se puede actualizar: uno o más usuarios están inactivos",
          });
        }
      }

      const updatedRole = await this.roleModel.update({
        id: Number(id),
        data: {
          name: name,
          description: result.data.description,
          existing_permissions: existing_permissions,
          new_permissions: new_permissions,
          users: users,
        },
      });

      return res.json({
        message: "Rol actualizado exitosamente",
        role_id: updatedRole.id,
      });
    } catch (error) {
      console.error("Error en PATCH Role:", error);
      return res
        .status(500)
        .json({ success: false, message: "Error interno del servidor" });
    }
  };

  deleteRole = async (req, res) => {
    try {
      const hasPermission =
        req.user.isAdmin ||
        (await UserModel.checkUserPermission(
          req.user.id,
          "Role_seguridad",
          "Delete"
        ));

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "No tiene permisos para eliminar roles",
        });
      }

      const id = parseInt(req.params.id);

      const roleExists = await this.roleModel.findById({ id });
      if (!roleExists) {
        return res
          .status(404)
          .json({ success: false, message: "El rol no existe" });
      }

      await this.roleModel.delete({ id });

      return res.json({
        message: "Rol Eliminado exitosamente",
      });
    } catch (error) {
      console.error("Error en DELETE Role:", error);

      if (error.code === "P2003") {
        return res.status(400).json({
          success: false,
          message:
            "No se puede eliminar el rol porque tiene usuarios o permisos asociados.",
        });
      }

      if (!res.headersSent) {
        return res
          .status(500)
          .json({ success: false, message: "Error al eliminar el rol" });
      }
    }
  };
}

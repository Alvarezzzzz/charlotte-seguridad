import { validatePermission, validatePartialPermission } from "../schemas/permission.js";
import { hotValidatePermission, hotValidatePartialPermission } from "../schemas/hotPermission.js";
import { PermissionModel } from "../models/permission.js";
import { getFormattedError } from "../utils/erros.js";
import { UserModel } from "../models/user.js";

export class PermissionController {
  constructor() {
    this.permissionModel = new PermissionModel();
  }

  getAllPermissions = async (req, res) => {
    try {
      const hasPermission = req.user.isAdmin || 
        (await UserModel.checkUserPermission(req.user.id, "Permission_seguridad", "Read"));

      if (!hasPermission) {
        return res.status(403).json({ success: false, message: "Sin permisos para ver permisos" });
      }

      const includeRole = req.query.includeRole === "true";
      const permissions = await this.permissionModel.getAll(includeRole);

      const result = permissions.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        resource: p.resource,
        method: p.method,
        ...(includeRole && p.role && {
          role: {
            id: p.role.id,
            name: p.role.name
          }
        })
      }));

      return res.json(result);
    } catch (error) {
      console.error("Error en PermissionController:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  getPermissionById = async (req, res) => {
    try {
      const includeRole = req.query.includeRole === "true";
      const id = parseInt(req.params.id);
      const permission = await this.permissionModel.findById({ id, includeRole });

      const hasPermission = req.user.isAdmin || 
        (await UserModel.checkUserPermission(req.user.id, "Permission_seguridad", "Read"));
      if (!hasPermission) {
        return res.status(403).json({ success: false, message: "Sin permisos para ver permisos" });
      }

      if (!permission) return res.status(404).json({ success: false, message: "No existe" });

      return res.json({
        id: permission.id,
        name: permission.name,
        type: permission.type,
        resource: permission.resource,
        method: permission.method,
        ...(includeRole && permission.role && {
          role: {
            id: permission.role.id,
            name: permission.role.name
          }
        })
      });
    } catch (error) {
      console.error("Error en GET Permission by ID:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  createPermission = async (req, res) => {
  try {
    const hasPermission = req.user.isAdmin || 
      (await UserModel.checkUserPermission(req.user.id, "Permission_seguridad", "Create"));

    if (!hasPermission) {
      return res.status(403).json({ success: false, message: "No tiene permisos" });
    }

    const result = hotValidatePermission(req.body);
    if (!result.success) {
      const formattedError = getFormattedError(result.error); 
      return res.status(400).json({ success: false, errors: formattedError });
    }

    const { roleId, resource, method } = result.data;
    const { prisma } = await import("../db/client.js");

    const existingPermission = await prisma.permission.findFirst({
      where: {
        resource: resource,
        method: method,
        roleId: Number(roleId)
      }
    });

    if (existingPermission) {
      return res.status(409).json({ 
        success: false, 
        message: `Ya existe un permiso de tipo ${method} para el recurso ${resource} en este rol.` 
      });
    }

    const roleExists = await prisma.role.findUnique({ where: { id: Number(roleId) } });
    if (!roleExists) {
      return res.status(404).json({ success: false, message: "El Rol asociado no existe" });
    }

    const newPermission = await this.permissionModel.create({
      permissionData: result.data,
      roleId: Number(roleId)
    });

    return res.status(201).json({
      message: "Permiso creado exitosamente",
      permission_id: newPermission.id
    });

  } catch (error) {
    console.error("Error en POST Permission:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
  

 updatePermission = async (req, res) => {
  try {
  
    const hasPermission = req.user.isAdmin || 
      (await UserModel.checkUserPermission(req.user.id, "Permission_seguridad", "Update"));

    if (!hasPermission) {
      return res.status(403).json({ success: false, message: "No autorizado para actualizar permisos" });
    }

    const { id } = req.params;

    const permissionExists = await this.permissionModel.findById({ id: Number(id) });
    if (!permissionExists) {
      return res.status(404).json({ success: false, message: "El permiso no existe" });
    }

    const result = hotValidatePartialPermission(req.body);
    if (!result.success) {
      const formattedError = getFormattedError(result.error);
      return res.status(400).json({ success: false, errors: formattedError });
    }

    if (result.data.roleId) {
      const { prisma } = await import("../db/client.js");
      const roleExists = await prisma.role.findUnique({
        where: { id: Number(result.data.roleId) }
      });
      if (!roleExists) {
        return res.status(404).json({ success: false, message: "El nuevo Rol asociado no existe" });
      }
    }

    const existingPermission = await this.permissionModel.findById({ id: Number(id) });
    const newResource = result.data.resource || existingPermission.resource;
    const newMethod = result.data.method || existingPermission.method;
    const newRoleId = result.data.roleId || existingPermission.roleId;
    const { prisma } = await import("../db/client.js");

    const duplicatePermission = await prisma.permission.findFirst({
      where: {
        resource: newResource,
        method: newMethod,
        roleId: newRoleId
      }
    });

    if (duplicatePermission && duplicatePermission.id !== Number(id)) {
      return res.status(409).json({ 
        success: false, 
        message: `Ya existe un permiso de tipo ${newMethod} para el recurso ${newResource} en este rol.` 
      });
    }

    const updatedPermission = await this.permissionModel.update({
      id: Number(id),
      data: result.data
    });

    return res.json({
      message: "Permiso actualizado exitosamente",
      permission_id: updatedPermission.id
    });

  } catch (error) {
    console.error("Error en PATCH Permission:", error);
    return res.status(400).json({ 
      success: false, 
      message: "No se pudo actualizar el permiso",
      details: error.message 
    });
  }
};

  deletePermission = async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const hasPermission =
        (await UserModel.checkUserPermission(req.user.id, "Permission_seguridad", "Delete"));
      if (!hasPermission) {
        return res.status(403).json({ success: false, message: "No autorizado para eliminar permisos" });
      }
      const permissionExists = await this.permissionModel.findById({ id });
      if (!permissionExists) {
        return res.status(404).json({ success: false, message: "El permiso no existe" });
      }
      await this.permissionModel.delete({ id });
      return res.json({ message: "Permiso Eliminado exitosamente" });
    } catch (error) {
      console.error("Error en DELETE Permission:", error);
      return res.status(400).json({ success: false, message: "No se pudo eliminar" });
    }
  };
};
import { validatePermission, validatePartialPermission } from "../schemas/permission.js";
import { PermissionModel } from "../models/permission.js";
import { UserModel } from "../models/user.js";

export class PermissionController {
  constructor() {
    this.permissionModel = new PermissionModel();
  }

  getAllPermissions = async (req, res) => {
    try {
      const hasPermission = req.user.isAdmin || 
        (await UserModel.checkUserPermission(req.user.id, "Permission", "Read")) ||
        (await UserModel.checkUserPermission(req.user.id, "Permission", "All"));

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
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  getPermissionById = async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const permission = await this.permissionModel.findById({ id });

      if (!permission) return res.status(404).json({ success: false, message: "No existe" });

      return res.json({
        id: permission.id,
        name: permission.name,
        type: permission.type,
        resource: permission.resource,
        method: permission.method,
        role: { id: permission.role?.id, name: permission.role?.name }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  createPermission = async (req, res) => {
  try {
    const hasPermission = req.user.isAdmin || 
      (await UserModel.checkUserPermission(req.user.id, "Permission", "Create")) ||
      (await UserModel.checkUserPermission(req.user.id, "Permission", "All"));

    if (!hasPermission) {
      return res.status(403).json({ success: false, message: "No tiene permisos" });
    }

    const result = validatePermission(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, errors: result.error.format() });
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
      (await UserModel.checkUserPermission(req.user.id, "Permission", "Update")) ||
      (await UserModel.checkUserPermission(req.user.id, "Permission", "All"));

    if (!hasPermission) {
      return res.status(403).json({ success: false, message: "No autorizado para actualizar permisos" });
    }

    const { id } = req.params;

    const permissionExists = await this.permissionModel.findById({ id: Number(id) });
    if (!permissionExists) {
      return res.status(404).json({ success: false, message: "El permiso no existe" });
    }

    const result = validatePartialPermission(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, errors: result.error.format() });
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
      await this.permissionModel.delete({ id });
      return res.json({ message: "Permiso Eliminado exitosamente" });
    } catch (error) {
      return res.status(400).json({ success: false, message: "No se pudo eliminar" });
    }
  };
};
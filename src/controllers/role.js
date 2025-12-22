import { validateRole, validatePartialRole } from "../schemas/role.js";
import { RoleModel } from "../models/role.js";
import { UserModel } from "../models/user.js";

export class RoleController {
  constructor() {
    this.roleModel = new RoleModel();
  }

  getAllRoles = async (req, res) => {
    try {
      const hasPermission = req.user.isAdmin || 
        (await UserModel.checkUserPermission(req.user.id, "Role_seguridad", "Read"));

      if (!hasPermission) {
        return res.status(403).json({ success: false, message: "No tiene permisos para ver roles" });
      }

      const includeUsers = req.query.includeUsers === "true";
      const roles = await this.roleModel.getAll(includeUsers);

      const result = roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isAdmin: false, 
        permissions: (role.permissions || []).map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type, 
          resource: p.resource,
          method: p.method
        })),
        ...(includeUsers && {
          users: (role.users || []).map((u) => ({
            id: u.id,
            name: u.name,
            lastName: u.lastName,
            email: u.email
          }))
        })
      }));
      res.json(result);
       
    } catch (error) {
      console.error("Error en RoleController:", error);
      res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
  };
 

 getRoleById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const role = await this.roleModel.findById({ id });

    if (!role) return res.status(404).json({ success: false, message: "Rol no encontrado" });

    
    const output = [
      {
        id: role.id,
        name: role.name,
        description: role.description,
        isAdmin: false,
        permissions: (role.permissions || []).map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,        
          resource: p.resource,
          method: p.method
        }))
      }
    ];

    return res.json(output);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

createRole = async (req, res) => {
    try {
      
        const hasPermission = req.user.isAdmin || 
            (await UserModel.checkUserPermission(req.user.id, "Role_seguridad", "Create"));

        if (!hasPermission) {
            return res.status(403).json({ success: false, message: "No tiene permisos para crear roles" });
        }

     
        const result = validateRole(req.body);
        if (!result.success) {
            return res.status(400).json({ success: false, errors: result.error.errors });
        }

        const { name, permissions, users } = req.body;

        
        const { prisma } = await import("../db/client.js");
        const existingRoleName = await prisma.role.findUnique({ where: { name } });
        if (existingRoleName) {
            return res.status(400).json({ success: false, message: "El nombre del rol ya está siendo usado" });
        }

        if (permissions && permissions.length > 0) {
            const existingPerms = await prisma.permission.findMany({
                where: { id: { in: permissions } }
            });
            if (existingPerms.length !== permissions.length) {
                return res.status(400).json({ success: false, message: "Uno o más IDs de permisos no existen" });
            }
        }

       
        if (users && users.length > 0) {
            const existingUsers = await prisma.user.findMany({
                where: { id: { in: users } }
            });
            if (existingUsers.length !== users.length) {
                return res.status(400).json({ success: false, message: "Uno o más IDs de usuarios no existen" });
            }
        }

      
        const newRole = await this.roleModel.create({ 
            data: { ...req.body } 
        });

      
        res.status(201).json({
            message: "Rol creado exitosamente",
            role_id: newRole.id
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error al crear el rol" });
    }
};


updateRole = async (req, res) => {
    try {
       
        const hasPermission = req.user.isAdmin || 
            (await UserModel.checkUserPermission(req.user.id, "Role", "Update")) ||
            (await UserModel.checkUserPermission(req.user.id, "Role", "All"));

        if (!hasPermission) {
            return res.status(403).json({ success: false, message: "No tiene permisos para actualizar roles" });
        }

        const id = parseInt(req.params.id);

        const roleExists = await this.roleModel.findById({ id });
        if (!roleExists) {
            return res.status(404).json({ success: false, message: "El rol no existe" });
        }

      
        const validation = validatePartialRole(req.body);
        if (!validation.success) {
            return res.status(400).json({ success: false, errors: validation.error.errors });
        }

        const { permissions, users } = req.body;
        const { prisma } = await import("../db/client.js");

    
        if (permissions && permissions.length > 0) {
            const existingPerms = await prisma.permission.findMany({
                where: { id: { in: permissions } }
            });
            if (existingPerms.length !== permissions.length) {
                return res.status(400).json({ success: false, message: "Uno o más IDs de permisos no existen" });
            }
        }

        if (users && users.length > 0) {
            const existingUsers = await prisma.user.findMany({
                where: { id: { in: users } }
            });
            if (existingUsers.length !== users.length) {
                return res.status(400).json({ success: false, message: "Uno o más IDs de usuarios no existen" });
            }
        }

       
        const updatedRole = await this.roleModel.update({ id, data: req.body });

       
        return res.json({
            message: "Rol actualizado exitosamente",
            role_id: updatedRole.id
        });

    } catch (error) {
        console.error("Error en PATCH Role:", error);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: "Error al actualizar el rol" });
        }
    }
};

 deleteRole = async (req, res) => {
    try {
       
        const hasPermission = req.user.isAdmin || 
            (await UserModel.checkUserPermission(req.user.id, "Role", "Delete")) ||
            (await UserModel.checkUserPermission(req.user.id, "Role", "All"));

        if (!hasPermission) {
            return res.status(403).json({ success: false, message: "No tiene permisos para eliminar roles" });
        }

        const id = parseInt(req.params.id);

        const roleExists = await this.roleModel.findById({ id });
        if (!roleExists) {
            return res.status(404).json({ success: false, message: "El rol no existe" });
        }

        await this.roleModel.delete({ id });

        
        return res.json({
            message: "Rol Eliminado exitosamente"
        });

    } catch (error) {
        console.error("Error en DELETE Role:", error);
        
        if (error.code === 'P2003') {
            return res.status(400).json({ 
                success: false, 
                message: "No se puede eliminar el rol porque tiene usuarios o permisos asociados." 
            });
        }

        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: "Error al eliminar el rol" });
        }
    }
};
}
import { validatePermission, validatePartialPermission } from "../schemas/permission.js";
import { PermissionModel } from "../models/permission.js";

export class PermissionController {
    constructor() {
        this.permissionModel = new PermissionModel();
    }

    createPermission = async (req, res) => {
        try {
            const result = validatePermission(req.body);

            if (!result.success) {
                return res.status(400).json({ error: JSON.parse(result.error.message) });
            }

            const { roleId, ...permissionData } = result.data; 

            const newPermission = await this.permissionModel.createAndLinkToRole({ 
                permissionData, 
                roleId: Number(roleId) 
            });

            res.status(201).json(newPermission);
        } catch (error) {
            console.error("Error creating permission:", error.message);
            if (error.code === 'P2002') { 
                
                return res.status(409).json({ error: "Permission already exists for this resource and method" });
            }
            res.status(500).json({ error: "Could not create permission or link to role" });
        }
    };

    getPermissionById = async (req, res) => {
        try {
            const { id } = req.params;

            const permission = await this.permissionModel.getById({ id: Number(id) });

            if (!permission) {
                return res.status(404).json({ error: "Permission not found" });
            }

            res.json(permission);
        } catch (error) {
            console.error("Error getting permission by ID:", error.message);
            res.status(500).json({ error: "Could not retrieve permission" });
        }
    };

    updatePermission = async (req, res) => {
        try {
            const result = validatePartialPermission(req.body);

            if (!result.success) {
                return res.status(400).json({ error: JSON.parse(result.error.message) });
            }

            const { id } = req.params;

            const updatedPermission = await this.permissionModel.update({ 
                id: Number(id), 
                data: result.data 
            });

            if (!updatedPermission) {
                return res.status(404).json({ error: "Permission not found" });
            }

            res.json(updatedPermission);
        } catch (error) {
            console.error("Error updating permission:", error.message);
            res.status(500).json({ error: "Could not update permission" });
        }
    };

    deletePermission = async (req, res) => {
        try {
            const { id } = req.params;

            const deleted = await this.permissionModel.delete({ id: Number(id) });

            if (!deleted) {
                return res.status(404).json({ error: "Permission not found" });
            }

            res.status(200).json({ message: "Permission successfully deleted" });
        } catch (error) {
            console.error("Error deleting permission:", error.message);
            res.status(500).json({ error: "Could not delete permission" });
        }
    };

    getAllPermissions = async (req, res) => { 
        try {
            const permissions = await this.permissionModel.getAll();

            res.json(permissions);
        } catch (error) {
            console.error("Error getting all permissions:", error.message);
            res.status(500).json({ error: "Could not retrieve permissions" });
        }
    };
}
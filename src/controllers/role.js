import { validateRole, validatePartialRole } from "../schemas/role.js";
import  { RoleModel } from "../models/role.js";

export class RoleController {
    constructor() {
        this.roleModel = new RoleModel();
    }

    createRole = async (req, res) => {
        try {
            const result = validateRole(req.body);

            if (!result.success) {
                return res.status(400).json({ error: JSON.parse(result.error.message) });
            }
            const newRole = await this.roleModel.create({ data: result.data });

            res.status(201).json(newRole);
        } catch (error) {
            console.error("Error creating role:", error.message);
            if (error.code === 'P2002') { 
                return res.status(409).json({ error: "Role name already exists" });
            }
            res.status(500).json({ error: "Could not create role" });
        }
    };

    getRoleById = async (req, res) => {
        try {
            const { id } = req.params;

            const role = await this.roleModel.getById({ id: Number(id) });

            if (!role) {
 
                return res.status(404).json({ error: "Role not found" });
            }

            res.json(role);
        } catch (error) {
            console.error("Error getting role by ID:", error.message);
            res.status(500).json({ error: "Could not retrieve role" });
        }
    };

    updateRole = async (req, res) => {
        try {

            const result = validatePartialRole(req.body);

            if (!result.success) {
                return res.status(400).json({ error: JSON.parse(result.error.message) });
            }

            const { id } = req.params;

            const updatedRole = await this.roleModel.update({ 
                id: Number(id), 
                data: result.data 
            });

            if (!updatedRole) {
         
                return res.status(404).json({ error: "Role not found" });
            }

            res.json(updatedRole);
        } catch (error) {
            console.error("Error updating role:", error.message);
            res.status(500).json({ error: "Could not update role" });
        }
    };

    
    deleteRole = async (req, res) => {
        try {
            const { id } = req.params;

           
            const deleted = await this.roleModel.delete({ id: Number(id) });

            if (!deleted) {
           
                return res.status(404).json({ error: "Role not found" });
            }

            res.status(200).json({ message: "Role successfully deleted" });
        } catch (error) {
            console.error("Error deleting role:", error.message);
            res.status(500).json({ error: "Could not delete role" });
        }
    };

    getAllRoles = async (req, res) => { 
        try {
            const roles = await this.roleModel.getAll();
            res.json(roles);
        } catch (error) {
            console.error("Error getting all roles:", error.message);
            res.status(500).json({ error: "Could not retrieve roles" });
        }
    };
}

import { prisma } from '../db/client.js'; 

export class PermissionModel {

async create({ permissionData, roleId }) {
        const { name, type, resource, method, isAdmin = false } = permissionData;
        console.log("Creating permission with data:", permissionData, "and roleId:", roleId);
        try {
            const newPermission = await prisma.permission.create({
                data: {
                   
                    name: name,
                    isAdmin: isAdmin,
                    type: type, 
                    resource: resource, 
                    method: method, 
                    role: {
                        connect: { id: roleId }
                    }
                },
                
            });
            return newPermission;
        } catch (error) {
            throw error;
            console.log(error)
        }
    }

    async findById({ id }) {
      console.log(id, "id rol"); 
        return await prisma.permission.findUnique({
            where: { id: Number(id) },
            include: {
                role: true,
            },
        });
        
    }
  
    async update({ id, data }) {
        try {
          console.log(id, "id permiso");
            return await prisma.permission.update({
                where: { id: Number(id) },
                data: data,
                include: {
                    role: true,
                },
            });
        } catch (error) {
          
            if (error.code === 'P2025') {
                return null; 
            }
            throw error;
        }
    }

    async delete({ id }) {
        try {
            await prisma.permission.delete({
                where: { id: Number(id) }
            });
            return true; 
        } catch (error) {
            if (error.code === 'P2025') {
                return false;
            }
            throw error;
        }
    }

    async getAll() {
        return await prisma.permission.findMany({
            include: {
                role: true,
            },
            orderBy: {
                id: 'asc',
            }
        });
    }
}
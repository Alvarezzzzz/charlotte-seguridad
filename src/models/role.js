import { prisma } from '../db/client.js';  
export class RoleModel {

    async create ({ data }) {
        return await prisma.role.create({
            data: data,
        });
    }

    async findById ({ id }) {
   
        return await prisma.role.findUnique({
            where: { id: Number(id) },

            include: {
                permissions: true,
                users: true,
            },
        });
    }

    async update ({ id, data }) {
        return await prisma.role.update({
            where: { id: Number(id) },
            data: data,
            include: {
                permissions: true,
                users: true,
            },
        });
    }

    async delete ({ id }) {

        return await prisma.role.delete({
            where: { id: Number(id) }
        });
    }

    async getAll({ isAdmin } = {}) {
        if (isAdmin !== undefined) {
           
             return await prisma.role.findMany({
                where: { isAdmin: isAdmin },
                include: {
                    permissions: true,
                    users: true,
                },
             });
        }
        return await prisma.role.findMany({
            include: {
                permissions: true,
                users: true,
            },
        });
    }
}
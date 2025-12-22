import { prisma } from '../db/client.js';  

export class RoleModel {
   async create({ data }) {
    const { permissions, users, ...roleData } = data;

    return await prisma.role.create({
        data: {
            ...roleData,
            
            permissions: permissions ? {
                connect: permissions.map(id => ({ id }))
            } : undefined,
            
            users: users ? {
                connect: users.map(id => ({ id }))
            } : undefined
        }
    });
}

   async findById({ id }) { 
    return await prisma.role.findUnique({
        where: { id: Number(id) },    
        include: {
            permissions: true, 
            users: true,
        },
    });
}

async update({ id, data }) {
    const { permissions, users, ...roleData } = data;

    return await prisma.role.update({
        where: { id: Number(id) },
        data: {
            ...roleData,
            
            permissions: permissions ? {
                set: permissions.map(pId => ({ id: pId }))
            } : undefined,
            users: users ? {
                set: users.map(uId => ({ id: uId }))
            } : undefined
        }
    });
}

    async delete({ id }) {
    return await prisma.role.delete({
        where: { id: Number(id) }
    });
}
}
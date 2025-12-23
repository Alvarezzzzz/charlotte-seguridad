import { prisma } from '../db/client.js';  

export class RoleModel {
async create({ data }) {
  const { name, description, permissions, users } = data;

  const permissionsConnect = (permissions && permissions.length > 0) 
    ? permissions.map(id => ({ id: Number(id) })) 
    : [];

  const usersConnect = (users && users.length > 0) 
    ? users.map(id => ({ id: Number(id) })) 
    : [];

  return await prisma.role.create({
    data: {
      name,
      description,
      permissions: {
        connect: permissionsConnect
      },
      users: {
        connect: usersConnect
      }
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
  const { name, description, permissions, users } = data;

  const updateData = {
    ...(name && { name }),
    ...(description !== undefined && { description }),
  };

  if (permissions) {
    updateData.permissions = {
      set: permissions.map(pId => ({ id: Number(pId) }))
    };
  }

  if (users) {
    updateData.users = {
      set: users.map(uId => ({ id: Number(uId) }))
    };
  }

  return await prisma.role.update({
    where: { id: Number(id) },
    data: updateData
  });
}

    async delete({ id }) {
    return await prisma.role.delete({
        where: { id: Number(id) }
    });
}
}
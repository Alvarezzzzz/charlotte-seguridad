import { prisma } from "../db/client.js";

export class PermissionModel {
  async getAll(includeRole = false) {
    return await prisma.permission.findMany({
      include: {
        role: includeRole,
      },
      orderBy: { id: "asc" },
    });
  }


  async findById({ id }) {
    return await prisma.permission.findUnique({
      where: { id: Number(id) },
      include: { role: true },
    });
  }

  
  async create({ permissionData, roleId }) {
    const { name, type, resource, method } = permissionData;
    return await prisma.permission.create({
      data: {
        name,
        type,
        resource,
        method,
        role: {
          connect: { id: Number(roleId) },
        },
      },
    });
  }

  async update({ id, data }) {
  return await prisma.permission.update({
    where: { id: Number(id) },
    data: data, 
  });
}

  async delete({ id }) {
    return await prisma.permission.delete({
      where: { id: Number(id) },
    });
  }
}
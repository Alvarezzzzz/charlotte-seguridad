import { prisma } from "../db/client.js";

export class RoleModel {
  async create({ data }) {
    const { name, description, permissions, users } = data;

    const usersConnect =
      users && users.length > 0 ? users.map((id) => ({ id: Number(id) })) : [];

    const permissionsCreate =
      permissions && permissions.length > 0 ? permissions : [];

    return await prisma.role.create({
      data: {
        name,
        description,

        permissions: {
          create: permissionsCreate,
        },

        users: {
          connect: usersConnect,
        },
      },
      include: {
        permissions: true,
      },
    });
  }

  async findById({ id, includeUsers = false }) {
    return await prisma.role.findUnique({
      where: { id: Number(id) },
      include: {
        permissions: true,
        users: includeUsers,
      },
    });
  }

  async update({ id, data }) {
    const { name, description, existing_permissions, new_permissions, users } =
      data;

    const roleId = Number(id);

    const updateData = {
      ...(name && { name }),
      ...(description !== undefined && { description }),
    };

    if (users) {
      updateData.users = {
        set: users.map((uId) => ({ id: Number(uId) })),
      };
    }

    const permissionOps = {};
    let hayCambiosEnPermisos = false;

    if (existing_permissions) {
      hayCambiosEnPermisos = true;

      const idsToKeep = existing_permissions.map((p) => Number(p.id));

      permissionOps.deleteMany = {
        id: { notIn: idsToKeep },
      };

      permissionOps.update = existing_permissions.map((p) => ({
        where: { id: Number(p.id) },
        data: {
          name: p.name,
          type: p.type,
          resource: p.resource,
          method: p.method,
        },
      }));
    }

    if (new_permissions && new_permissions.length > 0) {
      hayCambiosEnPermisos = true;

      permissionOps.create = new_permissions.map((p) => ({
        name: p.name,
        type: p.type,
        resource: p.resource,
        method: p.method,
      }));
    }

    if (hayCambiosEnPermisos) {
      updateData.permissions = permissionOps;
    }

    return await prisma.role.update({
      where: { id: roleId },
      data: updateData,
      include: {
        permissions: true,
      },
    });
  }

  async delete({ id }) {
    return await prisma.role.delete({
      where: { id: Number(id) },
    });
  }

  async getAll({ includeUsers } = {}) {
    return await prisma.role.findMany({
      include: {
        permissions: true,
        users: includeUsers,
      },
    });
  }
}

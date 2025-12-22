import { prisma } from "../db/client.js";
import { hashPassword, comparePassword } from "../utils/password.js";

export class UserModel {
  static async create(data) {
    const { roles, password, ...userData } = data;
    const hashedPassword = await hashPassword(password);

    return prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        roles: roles ? { connect: roles.map((id) => ({ id })) } : undefined,
      },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    });
  }

  static async findById(id) {
    return prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    });
  }

  static async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        roles: true,
      },
    });
  }

  static async findByDni(dni) {
    return prisma.user.findUnique({
      where: { dni },
      include: {
        roles: true,
      },
    });
  }

  static async update(id, data) {
    const { roles, ...userData } = data;

    return prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        ...userData,
        ...(roles && {
          roles: {
            set: roles.map((roleId) => ({ id: roleId })),
          },
        }),
      },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    });
  }

  static async delete(id) {
    return prisma.user.delete({
      where: { id: parseInt(id) },
    });
  }

  static async getAll(dataType = null) {
    const where = dataType ? { dataType } : {};

    return prisma.user.findMany({
      where,
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    });
  }

  static async changePassword(userId, newPassword) {
    const { hashPassword } = await import("../utils/password.js");
    const hashedPassword = await hashPassword(newPassword);

    return prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  static async verifyPassword(userId, password) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return false;
    }

    return comparePassword(password, user.password);
  }

  static async checkUserPermission(userId, resource, method) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      return false;
    }

    // Si es admin, tiene todos los permisos
    if (user.isAdmin) {
      return true;
    }

    // Verificar permisos
    for (const role of user.roles) {
      for (const permission of role.permissions) {
        if (
          permission.type === "Resource" &&
          permission.resource === resource &&
          (permission.method === method || permission.method === "All")
        ) {
          return true;
        }
      }
    }

    return false;
  }
}

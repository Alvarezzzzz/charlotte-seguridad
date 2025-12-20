import { prisma } from "../db/client.js";
import { DataType } from "@prisma/client";
export class RestaurantModel {
  async create({ data }) {
    return await prisma.restaurant.create({
      data: data,
    });
  }

  async findById({ id }) {
    return await prisma.restaurant.findUnique({
      where: { id: Number(id) },
    });
  }

  async update({ id, data }) {
    console.log(id, "id restaurant");
    return await prisma.restaurant.update({
      where: { id: Number(id) },
      data: data,
    });
  }

  async delete({ id }) {
    return await prisma.restaurant.delete({
      where: { id: Number(id) },
    });
  }

  async getAll({ isAdmin } = {}) {
    if (isAdmin !== undefined) {
      return await prisma.restaurant.findMany({
        where: { isAdmin: isAdmin },
        include: {
          permissions: true,
          users: true,
        },
      });
    }
    return await prisma.restaurant.findMany({
      orderBy: { id: "asc" },
    });
  }
}

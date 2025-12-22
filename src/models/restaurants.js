import { prisma } from "../db/client.js";

export class RestaurantModel {
  async getAll() {
    return await prisma.restaurant.findMany({
      orderBy: { id: "asc" },
    });
  }

  async findById({ id }) {
    return await prisma.restaurant.findUnique({
      where: { id: Number(id) },
    });
  }

  async create({ data }) {
    return await prisma.restaurant.create({ data });
  }

  async update({ id, data }) {
    return await prisma.restaurant.update({
      where: { id: Number(id) },
      data,
    });
  }

  async delete({ id }) {
    return await prisma.restaurant.delete({
      where: { id: Number(id) },
    });
  }
}
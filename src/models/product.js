import { prisma } from '../db/client.js';

export class ProductModel {

  static async create ({ input }) {
    return await prisma.securityProductExample.create({
      data: input
    });
  }

  static async findById ({ id }) {
    return await prisma.securityProductExample.findUnique({
      where: { id: Number(id) }
    });
  }

  static async update ({ id, input }) {
    return await prisma.securityProductExample.update({
      where: { id: Number(id) },
      data: input
    });
  }

  static async delete ({ id }) {
    return await prisma.securityProductExample.delete({
      where: { id: Number(id) }
    });
  }

  static async getAll({category}) {
    if (category) {
      return await prisma.securityProductExample.findMany({
        where: { category }
      });
    }
    return await prisma.securityProductExample.findMany();
  }
}
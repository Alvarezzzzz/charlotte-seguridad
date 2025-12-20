import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { SALT_ROUNDS } from "../src/utils/password.js";
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin", SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: "admin@charlotte.com" },
    update: {},
    create: {
      email: "admin@charlotte.com",
      name: "Jhon",
      lastName: "Doe",
      password: hashedPassword,

      birthDate: new Date("1990-01-01"),
      dni: "27314851",
      isAdmin: true,
    },
  });

  console.log({ admin });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

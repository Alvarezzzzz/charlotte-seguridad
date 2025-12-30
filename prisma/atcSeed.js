import { PrismaClient, Resource, Method, PermissionType } from "@prisma/client";
import bcrypt from "bcrypt";

// Importación correcta del utils/password
import { SALT_ROUNDS } from "../src/utils/password.js";

const prisma = new PrismaClient();

/**
 * Función reutilizable para crear/actualizar un Rol, sus Permisos y un Usuario asignado.
 * @param {string} roleName - Nombre del Rol
 * @param {string} roleDescription - Descripción del Rol
 * @param {Array} permissionsConfig - Array de objetos { resource, methods[] } usando Enums
 * @param {Object} userData - Objeto con datos del usuario { name, lastName, email, dni, password... }
 */
async function manageRoleAndUser(roleName, roleDescription, permissionsConfig, userData) {
  console.log(`\n--- Procesando: ${roleName} ---`);

  // 1. Crear o buscar el Rol
  const role = await prisma.role.upsert({
    where: { name: roleName },
    update: {}, // No modificamos si ya existe
    create: {
      name: roleName,
      description: roleDescription,
    },
  });
  console.log(`✅ Rol '${role.name}' gestionado (ID: ${role.id}).`);

  // 2. Limpiar permisos antiguos para evitar duplicados
  await prisma.permission.deleteMany({
    where: { roleId: role.id },
  });

  // 3. Crear los nuevos permisos
  let permissionCount = 0;
  for (const config of permissionsConfig) {
    for (const method of config.methods) {
      await prisma.permission.create({
        data: {
          name: `${config.resource} - ${method}`,
          type: PermissionType.Resource, // Usando el Enum importado
          resource: config.resource,     // Usando el Enum importado
          method: method,                // Usando el Enum importado
          roleId: role.id,
        },
      });
      permissionCount++;
    }
  }
  console.log(`✅ ${permissionCount} permisos asignados a '${roleName}'.`);

  // 4. Crear o Actualizar el Usuario
  const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

  const user = await prisma.user.upsert({
    where: { email: userData.email },
    update: {
      // Si ya existe, aseguramos que tenga el rol conectado
      roles: {
        connect: { id: role.id },
      },
    },
    create: {
      name: userData.name,
      lastName: userData.lastName,
      email: userData.email,
      password: hashedPassword,
      birthDate: new Date(userData.birthDate),
      dni: userData.dni,
      isActive: userData.isActive,
      roles: {
        connect: { id: role.id },
      },
    },
  });

  console.log(`👤 Usuario '${user.name} ${user.lastName}' (${user.email}) listo.`);
}

// --- EJECUCIÓN PRINCIPAL ---

async function main() {
  console.log("🌱 Iniciando Seed de ATC (Atención al Cliente)...");

  // ---------------------------------------------------------
  // CASO 1: GERENTE ATC
  // ---------------------------------------------------------
  const gerenteAtcPermissions = [
    { 
      resource: Resource.Table_atc, 
      methods: [Method.Create, Method.Read, Method.Update, Method.Delete] 
    },
    { 
      resource: Resource.ClienteTemporal_atc, 
      methods: [Method.Read] 
    }
  ];

  const gerenteUser = {
    name: "Santiago",
    lastName: "Perrota",
    email: "santiago.p@charlotte.com",
    password: "SuperSeguraPassword",
    birthDate: "2005-01-01",
    dni: "V30000000",
    isActive: true,
  };

  await manageRoleAndUser(
    "Gerente Atc",
    "Responsable de Atención al Cliente y gestión total de mesas",
    gerenteAtcPermissions,
    gerenteUser
  );

  // ---------------------------------------------------------
  // CASO 2: MAITRE ATC
  // ---------------------------------------------------------
  const maitreAtcPermissions = [
    { 
      resource: Resource.Table_atc, 
      methods: [Method.Read, Method.Update] 
    }
  ];

  const maitreUser = {
    name: "Usuario",
    lastName: "Prueba 1",
    email: "usuario.p1@charlotte.com",
    password: "SuperSeguraPassword",
    birthDate: "2005-01-01",
    dni: "V30000001",
    isActive: true,
  };

  await manageRoleAndUser(
    "Maitre Atc",
    "Encargado de sala, visualización y actualización de estado de mesas",
    maitreAtcPermissions,
    maitreUser
  );

  console.log("\n🌱 Seed de ATC completado exitosamente.");
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
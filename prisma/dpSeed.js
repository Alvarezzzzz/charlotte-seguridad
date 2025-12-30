import { PrismaClient, Resource, Method, PermissionType } from "@prisma/client";
import bcrypt from "bcrypt";

// Importación de configuración de seguridad
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
  console.log("🌱 Iniciando Seed de Delivery & Pickup...");

  // ---------------------------------------------------------
  // CASO 1: GERENTE DP
  // ---------------------------------------------------------
  const gerenteDpPermissions = [
    { 
      resource: Resource.Thresholds_dp, 
      methods: [Method.Create, Method.Read, Method.Update, Method.Delete] 
    },
    { 
      resource: Resource.Notes_dp, 
      methods: [Method.Update] 
    },
    { 
      resource: Resource.NotesItems_dp, 
      methods: [Method.Update, Method.Delete] 
    },
    { 
      resource: Resource.Logs_dp, 
      methods: [Method.Read] 
    },
    { 
      resource: Resource.Zones_dp, 
      methods: [Method.Create, Method.Update, Method.Delete] 
    },
    { 
      resource: Resource.Managers_dp, 
      methods: [Method.Create, Method.Read, Method.Update, Method.Delete] 
    },
  ];

  const gerenteDpUser = {
    name: "Usuario",
    lastName: "Prueba 2",
    email: "usuario.p2@charlotte.com",
    password: "SuperSeguraPassword",
    birthDate: "2005-01-01",
    dni: "V30000002",
    isActive: true,
  };

  await manageRoleAndUser(
    "Gerente dp",
    "Gerente encargado de la configuración global de delivery y pickup",
    gerenteDpPermissions,
    gerenteDpUser
  );

  // ---------------------------------------------------------
  // CASO 2: SUPERVISOR DP
  // ---------------------------------------------------------
  const supervisorDpPermissions = [
    { 
      resource: Resource.Thresholds_dp, 
      methods: [Method.Read, Method.Update] 
    },
    { 
      resource: Resource.Notes_dp, 
      methods: [Method.Update] 
    },
    { 
      resource: Resource.NotesItems_dp, 
      methods: [Method.Update, Method.Delete] 
    },
    { 
      resource: Resource.Logs_dp, 
      methods: [Method.Read] 
    },
    { 
      resource: Resource.Zones_dp, 
      methods: [Method.Update] 
    },
    { 
      resource: Resource.Managers_dp, 
      methods: [Method.Read, Method.Update] 
    },
  ];

  const supervisorDpUser = {
    name: "Usuario",
    lastName: "Prueba 3",
    email: "usuario.p3@charlotte.com",
    password: "SuperSeguraPassword",
    birthDate: "2005-01-01",
    dni: "V30000003",
    isActive: true,
  };

  await manageRoleAndUser(
    "Supervisor dp",
    "Supervisor operativo de delivery y pickup con permisos limitados",
    supervisorDpPermissions,
    supervisorDpUser
  );

  console.log("\n🌱 Seed de Delivery & Pickup completado exitosamente.");
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
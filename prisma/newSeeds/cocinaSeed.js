import { PrismaClient, Resource, Method, PermissionType } from "@prisma/client";
import bcrypt from "bcrypt";

// Importación correcta del utils/password como indicaste
import { SALT_ROUNDS } from "../../src/utils/password.js";

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

  const userExists = await prisma.user.findUnique({
    where: { email: userData.email },
  });
  // Si existe eliminamos todos sus roles y permisos asociados
  if (userExists) {
    // obtenemos cada uno de sus roles y eliminamos los permisos asociados
    const userRoles = await prisma.role.findMany({
      where: {
        users: {
          some: { id: userExists.id },
        },
      },
    });
    for (const role of userRoles) {
      await prisma.permission.deleteMany({
        where: { roleId: role.id },
      });
    }
    // eliminamos la relación de roles con el usuario
    await prisma.user.update({
      where: { id: userExists.id },
      data: {
        roles: {
          set: [],
        },
      },
    });
  }

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
          type: PermissionType.View, // Usando el Enum importado
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
  console.log("🌱 Iniciando Seed con Enums de Prisma...");

  // ---------------------------------------------------------
  // CASO 1: HEAD CHEFF
  // ---------------------------------------------------------
  // const headChefPermissions = [
  //   {
  //     resource: Resource.InventoryItem_cocina,
  //     methods: [Method.Create, Method.Read, Method.Update]
  //   },
  //   {
  //     resource: Resource.InventoryLog_cocina,
  //     methods: [Method.Create, Method.Read]
  //   },
  //   {
  //     resource: Resource.KitchenAsset_cocina,
  //     methods: [Method.Create, Method.Read, Method.Update, Method.Delete]
  //   },
  //   {
  //     resource: Resource.AssetLog_cocina,
  //     methods: [Method.Create, Method.Read]
  //   },
  //   {
  //     resource: Resource.KitchenStaff_cocina,
  //     methods: [Method.Create, Method.Read, Method.Update, Method.Delete]
  //   },
  //   {
  //     resource: Resource.KitchenCategory_cocina,
  //     methods: [Method.Create, Method.Update]
  //   },
  //   {
  //     resource: Resource.KitchenProduct_cocina,
  //     methods: [Method.Create, Method.Update]
  //   },
  //   {
  //     resource: Resource.Recipe_cocina,
  //     methods: [Method.Create, Method.Read]
  //   },
  //   {
  //     resource: Resource.KdsProductionQueue_cocina,
  //     methods: [Method.Read, Method.Update]
  //   },
  //   {
  //     resource: Resource.StaffShift_cocina,
  //     methods: [Method.Create, Method.Read, Method.Update]
  //   },

  //   // Permisos de vistas
  //   {
  //     resource: Resource.KdsProductionQueue_view,
  //     methods: [Method.View]
  //   },
  //   {
  //     resource: Resource.ConsumibleInventory_view,
  //     methods: [Method.View]
  //   },
  //   {
  //     resource: Resource.FixedAssetManagement_view,
  //     methods: [Method.View]
  //   },
  //   {
  //     resource: Resource.RecipeProductCatalog_view,
  //     methods: [Method.View]
  //   }, 
  //   {
  //     resource: Resource.StaffShiftSheduler_view,
  //     methods: [Method.View]
  //   },
  //   {
  //     resource: Resource.KitchenStaffManagement_view,
  //     methods: [Method.View]
  //   }
  // ];
  // Supervisor de cocina 

  // const headChefPermissions = [
  //   {
  //     resource: Resource.CocinaSupervisor_view,
  //     methods: [Method.View]
  //   },
  // ];
  

  // const headChefUser = {
  //   name: "Usuario",
  //   lastName: "Prueba 5",
  //   email: "usuario.p5@charlotte.com",
  //   password: "SuperSeguraPassword",
  //   birthDate: "2005-01-01",
  //   dni: "V30000005",
  //   isActive: true,
  // };

  // // await manageRoleAndUser(
  // //   "Head Cheff",
  // //   "Rol principal de cocina con gestión de inventario y personal",
  // //   headChefPermissions,
  // //   headChefUser
  // // );
  // await manageRoleAndUser(
  //   "Supervisor de cocina",
  //   "",
  //   headChefPermissions,
  //   headChefUser
  // );

  // ---------------------------------------------------------
  // CASO 2: CHEF
  // ---------------------------------------------------------
  // Chef
  const chefPermissions = [
    {
      resource: Resource.CocinaChef_view,
      methods: [Method.View]
    }
  ];

  const chefUser = {
    name: "Usuario",
    lastName: "Prueba 6",
    email: "usuario.p6@charlotte.com",
    password: "SuperSeguraPassword",
    birthDate: "2005-01-01",
    dni: "V30000006",
    isActive: true,
  };

  // await manageRoleAndUser(
  //   "Chef",
  //   "Rol operativo de cocina (preparación y despacho)",
  //   chefPermissions,
  //   chefUser
  // );
  await manageRoleAndUser(
    "Chef",
    "",
    chefPermissions,
    chefUser
  );

  // ---------------------------------------------------------
  // CASO 3: HEAD WAITER
  // ---------------------------------------------------------
  // const headWaiterPermissions = [
  //   {
  //     resource: Resource.KitchenAsset_cocina,
  //     methods: [Method.Read, Method.Create] // Create = Reportar Activo
  //   },
  //   {
  //     resource: Resource.AssetLog_cocina,
  //     methods: [Method.Create]
  //   },
  //   {
  //     resource: Resource.KdsProductionQueue_cocina,
  //     methods: [Method.Read, Method.Update]
  //   },
  //   {
  //     resource: Resource.KitchenStaff_cocina,
  //     methods: [Method.Create, Method.Read, Method.Update, Method.Delete]
  //   },
  //   {
  //     resource: Resource.StaffShift_cocina,
  //     methods: [Method.Create, Method.Read, Method.Update]
  //   },
  //   // Permisos de vistas
  //   {
  //     resource: Resource.WaitersOffice_view,
  //     methods: [Method.View]
  //   },
  //   {
  //     resource: Resource.FixedAssetManagement_view,
  //     methods: [Method.View]
  //   },
  //    {
  //     resource: Resource.StaffShiftSheduler_view,
  //     methods: [Method.View]
  //   },
  //   {
  //     resource: Resource.KitchenStaffManagement_view,
  //     methods: [Method.View]
  //   }
  // ];
  // Cocinero
  const headWaiterPermissions = [
    {
      resource: Resource.CocinaCocinero_view,
      methods: [Method.View]
    },
  ];

  const headWaiterUser = {
    name: "Usuario",
    lastName: "Prueba 7",
    email: "usuario.p7@charlotte.com",
    password: "SuperSeguraPassword",
    birthDate: "2005-01-01",
    dni: "V30000007",
    isActive: true,
  };

  // await manageRoleAndUser(
  //   "Head Waiter",
  //   "Jefe de meseros, gestión de personal y supervisión de comandas",
  //   headWaiterPermissions,
  //   headWaiterUser
  // );
  await manageRoleAndUser(
    "Cocinero",
    "",
    headWaiterPermissions,
    headWaiterUser
  );

  // ---------------------------------------------------------
  // CASO 4: WAITER
  // ---------------------------------------------------------
  // const waiterPermissions = [
  //   {
  //     resource: Resource.KdsProductionQueue_cocina,
  //     methods: [Method.Read, Method.Update] 
  //   },
  //   {
  //     resource: Resource.StaffShift_cocina,
  //     methods: [Method.Create, Method.Update]
  //   },

  //   // Permisos de vistas
  //   {
  //     resource: Resource.WaitersOffice_view,
  //     methods: [Method.View]
  //   },
  //   {
  //     resource: Resource.FixedAssetManagement_view,
  //     methods: [Method.View]
  //   }
  // ];
  // Camarero
  const waiterPermissions = [
    {
      resource: Resource.CocinaCamarero_view,
      methods: [Method.View] 
    },
  ];

  const waiterUser = {
    name: "Usuario",
    lastName: "Prueba 8",
    email: "usuario.p8@charlotte.com",
    password: "SuperSeguraPassword",
    birthDate: "2005-01-01",
    dni: "V30000008",
    isActive: true,
  };

  // await manageRoleAndUser(
  //   "Waiter",
  //   "Mesero operativo, marca platos como servidos y gestiona sus turnos",
  //   waiterPermissions,
  //   waiterUser
  // );
  await manageRoleAndUser(
    "Camarero",
    "",
    waiterPermissions,
    waiterUser
  );

  console.log("\n🌱 Seed completado exitosamente.");
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
import z from "zod";
import { PermissionType, Method } from "@prisma/client";

// Definición de los tipos de permiso que se permiten (ej. RESOURCE o ROUTE)
const PERMISSION_TYPES = Object.values(PermissionType);

const PERMISSION_METHODS = Object.values(Method);

const permissionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "El nombre del permiso es obligatorio." }),
  type: z.enum(PERMISSION_TYPES, {
    /* ... */
  }),
  resource: z.string().trim().min(1, { message: "El recurso es obligatorio." }),
  method: z.enum(PERMISSION_METHODS, {
    /* ... */
  }),
  roleId: z
    .number()
    .int()
    .positive({ message: "El ID del rol debe ser un número entero positivo." }),
});

const validatePermission = (data) => {
  return permissionSchema.safeParse(data);
};

const validatePartialPermission = (data) => {
  return permissionSchema.partial().safeParse(data);
};

export { validatePermission, validatePartialPermission };

import z from "zod";
import { Resource, Method } from "@prisma/client";

// Definición de los tipos de permiso que se permiten (Resource y View)
const RESOURCE_OPTIONS = Object.values(Resource);

const PERMISSION_METHODS = Object.values(Method);

const hasPermissionSchema = z.object({
  resource: z.enum(RESOURCE_OPTIONS, {
    /* ... */
  }),
  method: z.enum(PERMISSION_METHODS, {
    /* ... */
  }),
});

const validateHasPermission = (data) => {
  return hasPermissionSchema.safeParse(data);
};

const validatePartialHasPermission = (data) => {
  return hasPermissionSchema.partial().safeParse(data);
};

export { validateHasPermission, validatePartialHasPermission };

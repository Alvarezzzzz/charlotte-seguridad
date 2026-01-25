import z from "zod";
import { Resource, Method } from "@prisma/client";

// Definición de los tipos de permiso que se permiten (Resource y View)
const RESOURCE_OPTIONS = Object.values(Resource);

const PERMISSION_METHODS = Object.values(Method);

const hasPermissionSchema = z.object({
  resources: z.array(z.enum(RESOURCE_OPTIONS)),
  method: z.enum(PERMISSION_METHODS),
});

const validateHasPermissionView = (data) => {
  return hasPermissionSchema.safeParse(data);
};

const validatePartialHasPermissionView = (data) => {
  return hasPermissionSchema.partial().safeParse(data);
};

export { validateHasPermissionView, validatePartialHasPermissionView };

import { PermissionType, Method, Resource } from "@prisma/client";
import z from "zod";

const PERMISSION_TYPES = Object.values(PermissionType);

const PERMISSION_METHODS = Object.values(Method);

const PERMISSION_RESOURCES = Object.values(Resource);

const permissionSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(PERMISSION_TYPES),
  resource: z.nativeEnum(PERMISSION_RESOURCES), 
  method: z.nativeEnum(PERMISSION_METHODS),
  roleId: z.number().int()
});

const validatePermission = (data) => {
  return permissionSchema.safeParse(data);
};

const validatePartialPermission = (data) => {
  return permissionSchema.partial().safeParse(data);
};

export { validatePermission, validatePartialPermission };

import { PermissionType, Method, DataType } from "@prisma/client";
import z from "zod";

const PERMISSION_TYPES = Object.values(PermissionType);

const PERMISSION_METHODS = Object.values(Method);

const permissionSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(PermissionType),
  resource: z.string(), 
  method: z.nativeEnum(Method),
  roleId: z.number().int()
});

const validatePermission = (data) => {
  return permissionSchema.safeParse(data);
};

const validatePartialPermission = (data) => {
  return permissionSchema.partial().safeParse(data);
};

export { validatePermission, validatePartialPermission };

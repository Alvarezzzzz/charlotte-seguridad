import z from "zod";


const permissionSchema = z.object({});

const validatePermission = (data) => {
  return permissionSchema.safeParse(data);
}
const validatePartialPermission = (data) => {
  return permissionSchema.partial().safeParse(data);
}
export { validatePermission, validatePartialPermission };
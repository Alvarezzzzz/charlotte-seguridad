import { PermissionType, Method, Resource } from "@prisma/client";
import { validarRecursosUnicos } from "../utils/erros.js";
import z from "zod";

const permissionItemSchema = z.object({
  name: z.string().min(1, "El nombre del permiso es requerido"),
  type: z.nativeEnum(PermissionType, {
    errorMap: () => ({
      message: "El 'type' no es válido según PermissionType",
    }),
  }),
  resource: z.nativeEnum(Resource, {
    errorMap: () => ({ message: "El 'resource' no es válido según Resource" }),
  }),
  method: z.nativeEnum(Method, {
    errorMap: () => ({ message: "El 'method' no es válido según Method" }),
  }),
});

const permissionUpdateItemSchema = permissionItemSchema.extend({
  id: z.number().int("El ID del permiso debe ser un número entero"),
});

const roleSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),

  permissions: z
    .array(permissionItemSchema)
    .optional()
    .superRefine((items, ctx) => {
      if (!items || items.length === 0) return;

      const validacion = validarRecursosUnicos(items);

      if (!validacion.esValido) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: validacion.mensaje,
          path: [],
        });
      }
    }),

  users: z.array(z.number()).optional(),
});

const updateRoleSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),

  existing_permissions: z.array(permissionUpdateItemSchema).optional(),

  new_permissions: z.array(permissionItemSchema).optional(),

  users: z.array(z.number()).optional(),
});

const validateRole = (data) => {
  return roleSchema.safeParse(data);
};

const validatePartialRole = (data) => {
  return roleSchema.partial().safeParse(data);
};

const validateUpdateRole = (data) => {
  return updateRoleSchema.safeParse(data);
};

const validatePartialUpdateRole = (data) => {
  return updateRoleSchema.partial().safeParse(data);
};

export {
  validateRole,
  validatePartialRole,
  validateUpdateRole,
  validatePartialUpdateRole,
};

import z from "zod";
import { DataType } from "@prisma/client";

const userSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  address: z.string().optional(),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^(0414|0412|0426|0422|0424|0416)\d{7}$/.test(val),
      "El teléfono debe seguir el formato venezolano (0414, 0412, 0426, 0422, 0424 o 0416 seguido de 7 números)"
    ),
  dataType: z.enum(Object.values(DataType)).optional(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)")
    .refine(
      (val) => {
        const date = new Date(val);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Fin del día de hoy
        return date <= today;
      },
      "La fecha de nacimiento no puede ser futura"
    ),
  dni: z
    .string()
    .min(1, "El DNI es requerido")
    .regex(/^[VE]\d{6,8}$/i, "El DNI debe tener prefijo V o E obligatorio seguido de 6 a 8 números (ejemplo: V31629822)"),
  isActive: z.boolean().optional().default(true),
  roles: z.array(z.number().int().positive()).optional(),
});

const validateUser = (data) => {
  return userSchema.safeParse(data);
};

const validatePartialUser = (data) => {
  return userSchema.partial().safeParse(data);
};

export { validateUser, validatePartialUser };

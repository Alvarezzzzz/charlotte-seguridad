import z from "zod";

const userSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  address: z.string().optional(),
  phone: z.string().optional(),
  dataType: z.enum(['MESERO', 'GERENTE', 'ADMIN', 'COCINA', 'DELIVERY']).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  dni: z.string().min(1, "El DNI es requerido"),
  roles: z.array(z.number().int().positive()).optional(),
});

const validateUser = (data) => {
  return userSchema.safeParse(data);
}

const validatePartialUser = (data) => {
  return userSchema.partial().safeParse(data);
}

export { validateUser, validatePartialUser };

import z from "zod";

const roleSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  permissions: z.array(z.number()).optional(), 
  users: z.array(z.number()).optional()        
});

const validateRole = (data) => {
  return roleSchema.safeParse(data);
};

const validatePartialRole = (data) => {
  return roleSchema.partial().safeParse(data);
};

export { validateRole, validatePartialRole };

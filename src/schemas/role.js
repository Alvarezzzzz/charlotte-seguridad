import z from "zod";

// Define el esquema de validación para un rol
const roleSchema = z.object({

    name: z.string().trim().min(1, { message: "El nombre del rol es obligatorio." }),

    description: z.string().trim().min(1, { message: "La descripción es obligatoria." }),

    isAdmin: z.boolean(),


});

const validateRole = (data) => {
    return roleSchema.safeParse(data);
}

const validatePartialRole = (data) => {
    return roleSchema.partial().safeParse(data);
}

export { validateRole, validatePartialRole };
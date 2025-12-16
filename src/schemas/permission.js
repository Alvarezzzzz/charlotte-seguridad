import z from "zod";

// Definición de los tipos de permiso que se permiten (ej. RESOURCE o ROUTE)
const PERMISSION_TYPES = ["RECURSO", "VISTA"];

const PERMISSION_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "CREATE", "READ", "UPDATE"];


const permissionSchema = z.object({
    
    name: z.string().trim().min(1, { message: "El nombre del permiso es obligatorio." }),
    type: z.enum(PERMISSION_TYPES, { /* ... */ }),
    resource: z.string().trim().min(1, { message: "El recurso es obligatorio." }),
    method: z.enum(PERMISSION_METHODS, { /* ... */ }),
    roleId: z.number().int().positive({ message: "El ID del rol debe ser un número entero positivo." }),
});

const validatePermission = (data) => {
    return permissionSchema.safeParse(data);
}

const validatePartialPermission = (data) => {
    return permissionSchema.partial().safeParse(data);
}

export { validatePermission, validatePartialPermission };
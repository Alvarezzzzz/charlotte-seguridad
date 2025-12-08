import z from "zod";


const roleSchema = z.object({});

const validateRole = (data) => {
  return roleSchema.safeParse(data);
}
const validatePartialRole = (data) => {
  return roleSchema.partial().safeParse(data);
}
export { validateRole, validatePartialRole };
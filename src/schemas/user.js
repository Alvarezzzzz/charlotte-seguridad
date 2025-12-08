import z from "zod";


const userSchema = z.object({});

const validateUser = (data) => {
  return userSchema.safeParse(data);
}
const validatePartialUser = (data) => {
  return userSchema.partial().safeParse(data);
}
export { validateUser, validatePartialUser };
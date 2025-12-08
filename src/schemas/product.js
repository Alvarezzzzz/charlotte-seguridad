import z from "zod";

const productSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  quantity: z.number().min(0, { message: "Quantity must be at least 0" }),
  price: z.number().min(0, { message: "Price must be at least 0" }),
  stock: z.number().min(0, { message: "Stock must be at least 0" }),
  category: z.enum(["Electronics", "Clothing", "Books", "Home", "Sports"], { message: "Invalid category" }),
});

const validateProduct = (data) => {
  return productSchema.safeParse(data);
}
const validatePartialProduct = (data) => {
  return productSchema.partial().safeParse(data);
}
export { validateProduct, validatePartialProduct };
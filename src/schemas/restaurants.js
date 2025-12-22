import z from "zod";

const restaurantGeoSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180), // Nombre exacto de la DB
  radius: z.number().positive()
});

export const validateRestaurantGeo = (data) => restaurantGeoSchema.safeParse(data);
export const validatePartialRestaurantGeo = (data) => restaurantGeoSchema.partial().safeParse(data);
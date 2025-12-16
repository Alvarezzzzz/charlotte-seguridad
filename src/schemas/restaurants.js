import z from "zod";

const restaurantGeoSchema = z.object({

    latitude: z.number({
        required_error: "La latitud es obligatoria.",
        invalid_type_error: "La latitud debe ser un número.",
    })
    .min(-90, { message: "La latitud no debe ser menor a -90." })
    .max(90, { message: "La latitud no debe ser mayor a 90." }),

    longitud: z.number({
        required_error: "La longitud es obligatoria.",
        invalid_type_error: "La longitud debe ser un número.",
    })
    .min(-180, { message: "La longitud no debe ser menor a -180." })
    .max(180, { message: "La longitud no debe ser mayor a 180." }),

    radius: z.number({
        required_error: "El radio de búsqueda es obligatorio.",
        invalid_type_error: "El radio debe ser un número.",
    })
    .positive({ message: "El radio debe ser un valor positivo." }),
});


const validateRestaurantGeo = (data) => {

    return restaurantGeoSchema.safeParse(data);
}

const validatePartialRestaurantGeo = (data) => {

    return restaurantGeoSchema.partial().safeParse(data);
}

export { validateRestaurantGeo, validatePartialRestaurantGeo, restaurantGeoSchema };
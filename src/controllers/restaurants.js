import { validateRestaurantGeo, validatePartialRestaurantGeo } from "../schemas/restaurants.js";
import  { RestaurantModel } from "../models/restaurants.js";

export class RestaurantController {
    constructor() {
        this.restaurantModel = new RestaurantModel();
    }

    createRestaurant = async (req, res) => {
        try {
            const result = validateRestaurantGeo(req.body);

            if (!result.success) {
                return res.status(400).json({ error: JSON.parse(result.error.message) });
            }
            const newRestaurant = await this.restaurantModel.create({ data: result.data });

            res.status(201).json(newRestaurant);
        } catch (error) {
            console.error("Error creating restaurant:", error.message);
            if (error.code === 'P2002') { 
                return res.status(409).json({ error: "Restaurant name already exists" });
            }
            res.status(500).json({ error: "Could not create role" });
        }
    };



getRestaurantById = async (req, res) => {
    try {
        let { id } = req.params; 

    
        if (typeof id === 'string' && id.startsWith(':')) {
            id = id.replace(':', '');
        }

        console.log(id, "id restaurant controller limpio"); 
      
        if (!id) {
            return res.status(400).json({ error: "Missing Restaurant ID in URL path." });
        }
        
        const restaurant = await this.restaurantModel.findById({ id: Number(id) }); 
        
        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }

        res.json(restaurant);
        
    } catch (error) {
       
        console.error("Error getting restaurant by ID:", error.message);
        res.status(500).json({ error: "Could not retrieve restaurant" });
    }
};

    updateRestaurant = async (req, res) => {
        try {

            const result = validatePartialRestaurantGeo(req.body);

            if (!result.success) {
                return res.status(400).json({ error: JSON.parse(result.error.message) });
            }

            const { id } = req.params;

            const updatedRestaurant = await this.restaurantModel.update({ 
                id: Number(id), 
                data: result.data 
            });

            if (!updatedRestaurant) {
         
                return res.status(404).json({ error: "Restaurant not found" });
            }

            res.json(updatedRestaurant);
        } catch (error) {
            console.error("Error updating restaurant:", error.message);
            res.status(500).json({ error: "Could not update restaurant" });
        }
    };

    
    deleteRestaurant = async (req, res) => {
        try {
            const { id } = req.params;

           
            const deleted = await this.restaurantModel.delete({ id: Number(id) });

            if (!deleted) {
           
                return res.status(404).json({ error: "Restaurant not found" });
            }

            res.status(200).json({ message: "Restaurant successfully deleted" });
        } catch (error) {
            console.error("Error deleting restaurant:", error.message);
            res.status(500).json({ error: "Could not delete restaurant" });
        }
    };

    getAllRestaurants = async (req, res) => { 
        try {
            const restaurants = await this.restaurantModel.getAll();
            res.json(restaurants);
        } catch (error) {
            console.error("Error getting all restaurants:", error.message);
            res.status(500).json({ error: "Could not retrieve restaurants" });
        }
    };

    // Endpoint 3: Actualizar coordenadas del restaurante (sin ID en ruta)
    updateRestaurantCoordinates = async (req, res) => {
        try {
            // Verificar autenticación
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Token de autenticación requerido',
                });
            }

            // Verificar permisos
            const { prisma } = await import('../db/client.js');
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                include: {
                    roles: {
                        include: {
                            permissions: true,
                        },
                    },
                },
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no encontrado',
                });
            }

            // Verificar si tiene permisos o es admin
            const hasPermission = user.isAdmin || user.roles.some(role => 
                role.permissions.some(perm => 
                    perm.type === 'RECURSO' && 
                    perm.resource === 'Restaurant_seguridad' && 
                    (perm.method === 'UPDATE' || perm.method === 'ALL')
                )
            );

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para actualizar las coordenadas del restaurante',
                });
            }

            // Validar body
            const result = validatePartialRestaurantGeo(req.body);

            if (!result.success) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Datos inválidos para la actualización del restaurante',
                    errors: JSON.parse(result.error.message) 
                });
            }

            // Verificar que ya se haya configurado el restaurante (debe existir la instancia)
            const restaurants = await this.restaurantModel.getAll();
            
            if (!restaurants || restaurants.length === 0) {
                return res.status(422).json({
                    success: false,
                    message: 'Debe configurar las coordenadas del restaurante primero',
                });
            }

            // Actualizar la primera (y única) instancia
            const restaurantId = restaurants[0].id;
            await this.restaurantModel.update({ 
                id: restaurantId, 
                data: result.data 
            });

            res.json({
                message: 'Coordenadas actualizadas correctamente',
            });
        } catch (error) {
            console.error("Error updating restaurant coordinates:", error.message);
            res.status(500).json({ 
                success: false,
                message: 'Error al actualizar las coordenadas del restaurante' 
            });
        }
    };
}
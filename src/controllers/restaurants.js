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
}
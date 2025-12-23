import { validateRestaurantGeo, validatePartialRestaurantGeo } from "../schemas/restaurants.js";
import { RestaurantModel } from "../models/restaurants.js";
import { UserModel } from "../models/user.js";

export class RestaurantController {
  constructor() {
    this.restaurantModel = new RestaurantModel();
  }

getRestaurantInfo = async (req, res) => {
  try {
    const hasPermission = req.user.isAdmin || 
      (await UserModel.checkUserPermission(req.user.id, "Restaurant_seguridad", "Read"));

    if (!hasPermission) return res.status(403).json({ success: false, message: "No autorizado" });

    const restaurants = await this.restaurantModel.getAll();
    if (!restaurants || restaurants.length === 0) return res.status(404).json({ success: false, message: "No configurado" });

    const r = restaurants[0];
    
    
    return res.json({
      latitude: Number(r.latitude),
      longitud: Number(r.longitud),
      radius: Number(r.radius)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

  getRestaurantById = async (req, res) => {
    try {
      const { id } = req.params;
      const restaurant = await this.restaurantModel.findById({ id });
      if (!restaurant) return res.status(404).json({ success: false, message: "No encontrado" });

      return res.json(restaurant);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  createRestaurant = async (req, res) => {
  try {
  
    const hasPermission = req.user.isAdmin || 
      (await UserModel.checkUserPermission(req.user.id, "Restaurant_seguridad", "Create")) ||
      (await UserModel.checkUserPermission(req.user.id, "Restaurant_seguridad", "All"));

    if (!hasPermission) {
      return res.status(403).json({ success: false, message: "No tiene permisos" });
    }

    const result = validateRestaurantGeo(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, errors: result.error.format() });
    }

    const existingRestaurants = await this.restaurantModel.getAll();
    if (existingRestaurants.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: "Ya existe un registro en la tabla de Restaurant" 
      });
    }

    await this.restaurantModel.create({
      data: result.data 
    });

  
    return res.status(201).json({
      message: "Coordenadas del restaurante configuradas correctamente",
    });

  } catch (error) {
    console.error("Error en POST Restaurant:", error);
    return res.status(500).json({ success: false, message: "Error interno" });
  }
};

  updateRestaurantCoordinates = async (req, res) => {
    try {
      const hasPermission = req.user.isAdmin || 
        (await UserModel.checkUserPermission(req.user.id, "Restaurant_seguridad", "Update"));

      if (!hasPermission) return res.status(403).json({ success: false, message: "No autorizado" });

      const result = validatePartialRestaurantGeo(req.body);
      if (!result.success) return res.status(400).json({ success: false, errors: result.error.format() });

      const restaurants = await this.restaurantModel.getAll();
      if (!restaurants || restaurants.length === 0) return res.status(422).json({ success: false, message: "Configurar primero" });

      await this.restaurantModel.update({ id: restaurants[0].id, data: result.data });
      return res.json({ message: "Coordenadas actualizadas correctamente" });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  
  deleteRestaurant = async (req, res) => {
    try {
      const hasPermission = req.user.isAdmin || 
        (await UserModel.checkUserPermission(req.user.id, "Restaurant_seguridad", "Delete"));

      if (!hasPermission) return res.status(403).json({ success: false, message: "No autorizado" });

      const { id } = req.params;
      await this.restaurantModel.delete({ id });
      return res.json({ message: "Restaurante eliminado exitosamente" });
    } catch (error) {
      return res.status(400).json({ success: false, message: "Error al eliminar" });
    }
  };
}
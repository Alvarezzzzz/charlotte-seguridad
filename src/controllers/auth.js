import { UserModel } from "../models/user.js";
import { generateToken, verifyToken } from "../utils/jwt.js";
import { comparePassword, validatePassword } from "../utils/password.js";
import { prisma } from "../db/client.js";
import { validateHasPermission } from "../schemas/auth.js";

export class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: "Email y contraseña son requeridos",
        });
        return;
      }

      const user = await UserModel.findByEmail(email);

      if (!user) {
        res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        });
        return;
      }

      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        });
        return;
      }

      // Verificar que el usuario esté activo
      if (!user.isActive) {
        res.status(401).json({
          success: false,
          message: "Usuario inactivo. No se puede iniciar sesión",
        });
        return;
      }

      // Obtener IDs de roles
      const roleIds = user.roles.map((role) => role.id);

      // Crear payload del token
      const tokenPayload = {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        address: user.address,
        phone: user.phone,
        dataType: user.dataType,
        birthDate: user.birthDate.toISOString().split("T")[0],
        dni: user.dni,
        isAdmin: user.isAdmin,
        isActive: user.isActive,
        roles: roleIds,
      };

      const token = generateToken(tokenPayload);

      res.json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: error.message || "Error al iniciar sesión",
      });
    }
  }

  async getRoles(req, res) {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
        return;
      }

      const { roles } = req.body;

      if (!roles || !Array.isArray(roles) || roles.length === 0) {
        res.status(400).json({
          success: false,
          message: "Se requiere un array de IDs de roles",
        });
        return;
      }

      // Verificar que el usuario existe y tiene esos roles
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          roles: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
        return;
      }

      // Verificar que el usuario obtenido del token de sesión esté activo
      if (!user.isActive) {
        res.status(403).json({
          success: false,
          message: "Usuario inactivo. No se puede realizar esta acción",
        });
        return;
      }

      // Verificar que todos los roles pertenecen al usuario
      const userRoleIds = user.roles.map((r) => r.id);
      const allRolesBelongToUser = roles.every((id) =>
        userRoleIds.includes(id)
      );

      if (!allRolesBelongToUser) {
        res.status(403).json({
          success: false,
          message: "Uno o más roles no pertenecen al usuario",
        });
        return;
      }

      // Verificar que todos los roles existen
      const rolesData = await prisma.role.findMany({
        where: { id: { in: roles } },
        include: {
          permissions: true,
        },
      });

      if (rolesData.length !== roles.length) {
        res.status(404).json({
          success: false,
          message: "Uno o más roles no existen",
        });
        return;
      }

      const result = rolesData.map((role) => ({
        id: role.id,
        name: role.name,
        isAdmin: role.isAdmin,
        permissions: role.permissions.map((perm) => ({
          id: perm.id,
          type: perm.type,
          resource: perm.resource,
          method: perm.method,
          isAdmin: role.isAdmin,
          roleId: perm.roleId,
        })),
      }));

      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(400).json({
        success: false,
        message: error.message || "Error al obtener roles",
      });
    }
  }

  async verifyLocation(req, res) {
    try {
      const { latitude, longitude } = req.body;

      if (latitude === undefined || longitude === undefined) {
        res.status(400).json({
          success: false,
          message: "Latitud y longitud son requeridos",
        });
        return;
      }

      // Obtener la configuración del restaurante
      const restaurant = await prisma.restaurant.findFirst({
        orderBy: { id: "asc" },
      });

      if (!restaurant) {
        res.status(400).json({
          success: false,
          message: "La ubicación del restaurante no está configurada",
        });
        return;
      }

      const { isWithinRadius } = await import("../utils/location.js");
      const restLat = Number(restaurant.latitude);
      const restLon = Number(restaurant.longitud);
      const restRadius = Number(restaurant.radius);

      const is_inside = isWithinRadius(
        latitude,
        longitude,
        restLat,
        restLon,
        restRadius
      );
      if (is_inside) {
        const locationToken = generateToken(
          {
            is_inside: true,
          },
          "10min"
        );
        const locationRefreshToken = generateToken(
          {
            is_inside: true,
          },
          "30min"
        );
        return res.json({
          locationToken,
          locationRefreshToken,
          is_inside,
          latitude,
          longitude,
        });
      }
      return res.json({
        is_inside,
        latitude,
        longitude,
      });
    } catch (error) {
      console.error(error);
      res.status(400).json({
        success: false,
        message: error.message || "Error al verificar ubicación",
      });
    }
  }

  async changePasswordAdmin(req, res) {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
        return;
      }
      const { user_id, new_password } = req.body;

      if (!user_id || !new_password) {
        res.status(400).json({
          success: false,
          message: "user_id y new_password son requeridos",
        });
        return;
      }

      

      // Verificar que el usuario existe
      const targetUser = await UserModel.findById(user_id);
      if (!targetUser) {
        res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
        return;
      }

      // Validar nueva contraseña
      const passwordValidation = validatePassword(new_password);
      if (!passwordValidation.valid) {
        res.status(400).json({
          success: false,
          message: passwordValidation.message,
        });
        return;
      }

      await UserModel.changePassword(user_id, new_password);

      res.json({
        message: "Cambio de contraseña ejecutado exitosamente",
      });
    } catch (error) {
      console.error(error);
      res.status(400).json({
        success: false,
        message: error.message || "Error al cambiar contraseña",
      });
    }
  }

  async changePassword(req, res) {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
        return;
      }

      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        res.status(400).json({
          success: false,
          message: "current_password y new_password son requeridos",
        });
        return;
      }

      // Verificar token de sesión válido y consultar información del usuario en BD
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
        return;
      }

      // Verificar que el usuario del token de sesión esté activo
      if (!user.isActive) {
        res.status(403).json({
          success: false,
          message: "Usuario inactivo. No se puede realizar esta acción",
        });
        return;
      }

      // Verificar que la contraseña actual coincida con la del body
      const isCurrentPasswordValid = await comparePassword(
        current_password,
        user.password
      );
      if (!isCurrentPasswordValid) {
        res.status(400).json({
          success: false,
          message: "La contraseña actual es incorrecta",
        });
        return;
      }

      // Verificar que la nueva contraseña sea correcta
      const passwordValidation = validatePassword(new_password);
      if (!passwordValidation.valid) {
        res.status(400).json({
          success: false,
          message: passwordValidation.message,
        });
        return;
      }

      await UserModel.changePassword(req.user.id, new_password);

      res.json({
        message: "Cambio de contraseña ejecutado exitosamente",
      });
    } catch (error) {
      console.error(error);
      res.status(400).json({
        success: false,
        message: error.message || "Error al cambiar contraseña",
      });
    }
  }

  async clientSession(req, res) {
    try {
      const { table_id, customer_name, customer_dni, role } = req.body;

      // Validar presencia de campos
      if (
        table_id === undefined ||
        customer_name === undefined ||
        customer_dni === undefined ||
        role === undefined
      ) {
        res.status(400).json({
          success: false,
          message:
            "table_id, customer_name, customer_dni y role son requeridos",
        });
        return;
      }

      // Validar table_id numérico y positivo
      const tableIdNumber = Number(table_id);
      if (!Number.isInteger(tableIdNumber) || tableIdNumber <= 0) {
        res.status(400).json({
          success: false,
          message: "table_id debe ser un número entero positivo",
        });
        return;
      }

      // Validar nombre no vacío
      const normalizedName = String(customer_name).trim();
      if (!normalizedName) {
        res.status(400).json({
          success: false,
          message: "customer_name no puede estar vacío",
        });
        return;
      }

      // Validar cédula (prefijo opcional V/E/J/P y 5-15 dígitos)
      const normalizedDni = String(customer_dni).trim();
      const dniRegex = /^(?:[VEJP]-?)?\d{5,15}$/i;
      if (!dniRegex.test(normalizedDni)) {
        res.status(400).json({
          success: false,
          message:
            "customer_dni debe ser una cédula válida (prefijo opcional V/E/J/P y solo dígitos, entre 5 y 15 caracteres)",
        });
        return;
      }

      // Validar que role sea un string y que solo acepte el valor "GUEST"
      if (typeof role !== "string") {
        res.status(400).json({
          success: false,
          message: "role debe ser un string",
        });
        return;
      }

      if (role !== "GUEST") {
        res.status(400).json({
          success: false,
          message: 'role solo puede tener el valor "GUEST"',
        });
        return;
      }

      const tokenPayload = {
        table_id: tableIdNumber,
        customer_name: normalizedName,
        customer_dni: normalizedDni.toUpperCase(),
        role: role,
      };

      const token = generateToken(tokenPayload);

      res.json({ token });
    } catch (error) {
      console.error(error);
      res.status(400).json({
        success: false,
        message: error.message || "Error al generar sesión de cliente",
      });
    }
  }

  async hasPermission(req, res) {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
        return;
      }

      const { resource, method } = req.body;
      const result = validateHasPermission({ resource, method });
      if (!result.success) {
        const formattedErrors = result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }));

        res.status(400).json({
          success: false,
          message: "Error de validación en los datos enviados",
          errors: formattedErrors,
        });

        return;
      }
      const hasPermission = await UserModel.checUserAnyPermission(
        req.user.id,
        resource,
        method
      );

      res.json({
        hasPermission: hasPermission === true,
      });
    } catch (error) {
      console.error(error);
      res.status(400).json({
        success: false,
        message: error.message || "Error al verificar permisos",
      });
    }
  }

  async verifyLocationToken(req, res) {
    try {
      const { locationToken, locationRefreshToken } = req.body;
      let decoded;
      let decodedRefresh;

      if (!locationToken) {
        res.status(400).json({
          success: false,
          message: "locationToken es requerido",
        });
        return;
      }
      try {
        decoded = verifyToken(locationToken);
      } catch (error) {
        // Token inválido o expirado
      }
      if (!decoded) {
        try {
          decodedRefresh = verifyToken(locationRefreshToken);
        } catch (error) {
          // Token inválido o expirado
        }
        if (!decodedRefresh) {
          return res.status(401).json({
            is_inside: false,
            message: "Tokens de ubicación inválidos o expirados",
          });
        }

        const newLocationToken = generateToken(
          {
            is_inside: true,
          },
          "10min"
        );
        const newRefreshToken = generateToken(
          {
            is_inside: true,
          },
          "30min"
        );
        return res.json({
          locationToken: newLocationToken,
          locationRefreshToken: newRefreshToken,
          is_inside: true,
        });
      }
      res.json({
        is_inside: true,
      });
    } catch (error) {
      console.error(error);
      res.status(400).json({
        success: false,
        message: error.message || "Error al verificar token de ubicación",
      });
    }
  }
}

import z from "zod";

const permissionSchema = z.object({
  name: z.string().min(1),
  
  type: z.literal("View"), 
  
  resource: z.enum([
    "Security_view", 
    "Kitchen_view", 
    "Atc_view",
    "KpiDashboard_view",
    "DeliveryPickup_view"
  ]), 
  
  method: z.literal("View"),
  
  roleId: z.number().int()
});

const validatePermission = (data) => {
  return permissionSchema.safeParse(data);
};

const validatePartialPermission = (data) => {
  return permissionSchema.partial().safeParse(data);
};

const hotValidatePermission = validatePermission;
const hotValidatePartialPermission = validatePartialPermission;

export { hotValidatePermission, hotValidatePartialPermission };
// export { validatePermission, validatePartialPermission };
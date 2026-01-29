import z from "zod";

const permissionSchema = z.object({
  name: z.string().min(1),
  
  type: z.literal("View"), 
  
  resource: z.enum(['AtcSupervisorSala_view', 'AtcMaitre_view', 'DpSupervisor_view', 'DpDespachador_view', 'CocinaChef_view', 'CocinaCocinero_view', 'CocinaCamarero_view', 'SeguridadPersonal_view', 'KpiGerente_view']), 
  
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
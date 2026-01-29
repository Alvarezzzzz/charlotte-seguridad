import { Resource, Method, PermissionType, DataType } from "@prisma/client";

const permissionTypes = Object.values(PermissionType);
const permissionResources = Object.values(Resource);
const permissionMethods = Object.values(Method);
const userDataTypes = Object.values(DataType);

export class EnumController {
  constructor() {}

  getUserDataTypes = async (req, res) => {
    try {
      res.json(userDataTypes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    };
  };
  
  getPermissionTypes = async (req, res) => {
    try {
      res.json(permissionTypes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getPermissionResources = async (req, res) => {
    try {
      
      const resources = permissionResources.filter(r => !r.endsWith('_view'));
      const views = permissionResources.filter(r => r.endsWith('_view'));
      const definitiveViews = ['AtcSupervisorSala_view', 'AtcMaitre_view', 'DpSupervisor_view', 'DpDespachador_view', 'CocinaSupervisor_view', 'CocinaChef_view', 'CocinaCocinero_view', 'CocinaCamarero_view', 'SeguridadPersonal_view', 'KpiGerente_view'];
      res.json({ "Resources": resources, "Views": views, "DefinitiveViews": definitiveViews });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getPermissionMethods = async (req, res) => {
    try {
      const methods = permissionMethods.filter(m => m !== 'View');
      const views = permissionMethods.filter(m => m === 'View');
      const definitiveMethod = ['View'];
      res.json({ "Methods": methods, "View": views, "DefinitiveMethod": definitiveMethod });
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }    
  };

}
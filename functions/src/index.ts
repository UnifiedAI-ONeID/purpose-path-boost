import { list, update, exportCsv } from './api';
import { adminCrm } from './admin-crm';

// This structure creates callable functions with names like 'api-admin-leads-list'
export const api = {
  admin: {
    leads: {
      list: list,
      update: update,
      export: exportCsv,
    },
    crm: adminCrm,
  },
};

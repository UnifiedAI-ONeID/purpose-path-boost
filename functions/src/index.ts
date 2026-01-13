import { list, update, exportCsv } from './api';
import { adminCrm } from './admin-crm';
import { getCalendarBookings, syncCalendarBookings, deleteCalendarBooking } from './admin-calendar';

// This structure creates callable functions with names like 'api-admin-leads-list'
export const api = {
  admin: {
    leads: {
      list: list,
      update: update,
      export: exportCsv,
    },
    crm: adminCrm,
    calendar: {
      bookings: getCalendarBookings,
      sync: syncCalendarBookings,
      delete: deleteCalendarBooking,
    },
  },
};

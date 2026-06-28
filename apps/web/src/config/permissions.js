export const PERMISSIONS = {
  SUPER_ADMIN: [
    'super_admin',
  ],

  ORGANIZER: [
    'organizer',
    'super_admin',
  ],

  DASHBOARD: [
  'super_admin',
  'organizer',
  'technical_team',
  'registration_team',
  'food_staff',
  'hospitality_team',
  'logistics_team',
  'volunteer_coordinator',
  'volunteer',
],

  STAFF_MANAGEMENT: [
    'organizer',
    'super_admin',
  ],

  DELEGATES: [
  'organizer',
  'registration_team',
  'super_admin',
],

  EVENTS: [
    'organizer',
    'super_admin',
  ],

  REPORTS: [
    'organizer',
    'super_admin',
  ],

  REGISTRATION: [
    'registration_team',
    'organizer',
    'super_admin',
  ],

  ATTENDANCE: [
    'technical_team',
    'organizer',
    'super_admin',
  ],

  FOOD: [
    'food_staff',
    'organizer',
    'super_admin',
  ],

  ACCOMMODATION: [
    'hospitality_team',
    'organizer',
    'super_admin',
  ],

  LOGISTICS: [
    'logistics_team',
    'organizer',
    'super_admin',
  ],

  VOLUNTEERS: [
    'volunteer_coordinator',
    'organizer',
    'super_admin',
  ],

  VOLUNTEER: [
    'volunteer',
    'organizer',
    'super_admin',
  ],
};
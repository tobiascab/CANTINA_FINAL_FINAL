
import { Dish } from './types';

export const DESAYUNO_PRICE = 8000;
export const COMBO_SURCHARGE = 5000;
export const MAX_COMBO_PRICE = 27000;
export const MIN_COMBO_PRICE = 22000;

// IMPORTANTE: Guarda tu imagen como 'logo.png' en la raíz del proyecto
export const LOGO_URL = 'logo.png';
export const APP_TITLE = "COMEDOR REDUCTO";
export const ORG_NAME = "Cooperativa Reducto Ltda.";

export const DISHES_OF_THE_DAY: Dish[] = [
  {
    id: 'puchero',
    name: 'Puchero Tradicional',
    basePrice: 15000,
    image: '/images/almuerzo.png'
  },
  {
    id: 'asado',
    name: 'Asado a la Olla',
    basePrice: 25000,
    image: '/images/almuerzo.png'
  }
];

export const CATEGORY_IMAGES = {
  desayuno: '/images/desayuno.png',
  almuerzo: '/images/almuerzo.png',
  combo: '/images/combo.png'
};

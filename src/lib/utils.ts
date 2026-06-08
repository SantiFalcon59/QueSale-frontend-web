import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatPrice = (price: number | string | undefined | null): string => {
  const num = Number(price);
  if (isNaN(num) || num === 0) return 'Gratis';
  return '$' + num.toLocaleString('es-AR');
};

export const NO_EVENT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ccircle cx='200' cy='120' r='30' fill='%23d1d5db'/%3E%3Crect x='160' y='110' width='80' height='8' rx='4' fill='%23d1d5db'/%3E%3Cpath d='M150,180 Q200,210 250,180' stroke='%23d1d5db' stroke-width='4' fill='none'/%3E%3Ctext x='200' y='230' text-anchor='middle' fill='%239ca3af' font-family='sans-serif' font-size='16' font-weight='600'%3ESin imagen%3C/text%3E%3C/svg%3E";

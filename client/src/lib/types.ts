export interface Measurement {
  name: string;
  value: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  photo?: string;
  measurements: Measurement[];
  description?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  customerId: string;
  description: string; // Acts as Order ID display
  customMeasurements: Measurement[];
  materials: string[]; // URLs/Paths to images
  styles: string[]; // URLs/Paths to images
  deadline: string; // ISO date string
  cost: string;
  notes?: string; // Optional notes about the order
  status: 'pending' | 'completed';
  createdAt: string;
}

export interface GalleryAlbum {
  id: string;
  name: string;
  createdAt: string;
}

export interface GalleryItem {
  id: string;
  url: string;
  albumId: string;
  createdAt: string;
}

export type Theme = 'dark' | 'light';

export const formatPhoneForWhatsapp = (phone: string): string => {
  // Remove spaces
  let clean = phone.replace(/\s+/g, '');
  
  // If starts with 080, 081, 090, 070 etc (Nigerian mobile prefixes start with 0)
  if (clean.startsWith('0')) {
    return '+234' + clean.substring(1);
  }
  
  // If already starts with 234, ensure +
  if (clean.startsWith('234')) {
    return '+' + clean;
  }
  
  return clean;
};

export const DEFAULT_MEASUREMENTS = [
  { name: 'Bust', value: '' },
  { name: 'Waist', value: '' },
  { name: 'Hips', value: '' },
  { name: 'Shoulder', value: '' },
  { name: 'Sleeve Length', value: '' },
  { name: 'Full Length', value: '' },
];

export const INITIAL_DEFAULT_MEASUREMENTS = DEFAULT_MEASUREMENTS;

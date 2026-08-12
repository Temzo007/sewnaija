import { getCustomers, getOrders, getSettings } from "./db";
import type { Measurement } from "./types";

/**
 * Exports everything stored by this app — customers, orders, all photos,
 * measurement templates and the theme — as a single JSON file in the exact
 * "full-backup" format that the new SIVASTY app understands. The user can
 * then restore it in SIVASTY via Settings > Restore / Import backup (or the
 * "Already have data? Restore backup" option on its start screen).
 */

const CUSTOMER_COLORS = ['#F97316', '#8B5CF6', '#3B82F6', '#EC4899', '#10B981', '#F59E0B'];

// Matches the default fabric gradient used when creating orders in SIVASTY.
const DEFAULT_FABRIC_GRADIENT = 'linear-gradient(135deg, #10B981, #059669)';

type LegacyCustomer = {
  id: string;
  name: string;
  phone: string;
  photo?: string;
  measurements: Measurement[];
  description?: string;
  createdAt: string;
};

type LegacyOrder = {
  id: string;
  customerId: string;
  description: string;
  customMeasurements: Measurement[];
  materials: string[];
  styles: string[];
  deadline: string;
  cost: string;
  notes?: string;
  status: 'pending' | 'completed';
  createdAt: string;
};

const toMeasurementRecord = (items?: Measurement[]): Record<string, string> => {
  const record: Record<string, string> = {};
  (items || []).forEach(item => {
    const name = item?.name?.trim();
    if (!name) return;
    record[name] = item.value ?? '';
  });
  return record;
};

const toInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map(part => part[0]?.toUpperCase() || '').join('');
  return initials || 'SN';
};

const colorFor = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return CUSTOMER_COLORS[hash % CUSTOMER_COLORS.length];
};

const imageDataUrls = (images?: string[]): string[] =>
  (images || []).filter((image): image is string => typeof image === 'string' && image.startsWith('data:'));

export const exportSivastyBackup = async (): Promise<{ customers: number; orders: number }> => {
  const [customers, orders, settings] = await Promise.all([
    getCustomers(),
    getOrders(),
    getSettings(),
  ]);

  const exportedCustomers = (customers as LegacyCustomer[]).map(customer => ({
    id: customer.id,
    name: customer.name,
    initials: toInitials(customer.name),
    color: colorFor(customer.id),
    phone: customer.phone,
    photoUrl: customer.photo && customer.photo.startsWith('data:') ? customer.photo : undefined,
    notes: customer.description || '',
    measurements: toMeasurementRecord(customer.measurements),
    measurementImages: [] as string[],
    createdAt: customer.createdAt,
  }));

  const exportedOrders = (orders as LegacyOrder[]).map(order => ({
    id: order.id,
    customerId: order.customerId,
    // The old app uses the order description as its display title.
    title: order.description,
    description: order.notes || '',
    status: order.status === 'completed' ? 'completed' : 'pending',
    deadline: order.deadline,
    price: Number(order.cost) || 0,
    measurements: toMeasurementRecord(order.customMeasurements),
    notes: order.notes || '',
    fabricType: 'Custom',
    fabricGradient: DEFAULT_FABRIC_GRADIENT,
    payments: [] as unknown[],
    materialPhotos: imageDataUrls(order.materials),
    stylePhotos: imageDataUrls(order.styles),
    measurementImages: [] as string[],
    createdAt: order.createdAt,
  }));

  const measurementTemplates = (settings?.defaultMeasurements || [])
    .map(item => item?.name?.trim())
    .filter((name): name is string => Boolean(name));

  const payload = {
    app: 'sivasty',
    kind: 'full-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    store: {
      hasOnboarded: true,
      theme: settings?.theme === 'dark' ? 'dark' : 'light',
      businessInfo: { name: 'SewNaija', ownerName: 'Tailor' },
      customers: exportedCustomers,
      orders: exportedOrders,
      galleryItems: [],
      cachedStarredSharedItems: [],
      measurementTemplates,
      lastRoute: '',
      galleryQuery: '',
      galleryCategory: 'All',
      recentlyViewedDesignIds: [],
      newOrderDraft: null,
    },
    favoritedDesignIds: [] as string[],
    galleryMetadata: [] as unknown[],
    galleryImages: [] as unknown[],
  };

  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `sivasty-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  return { customers: exportedCustomers.length, orders: exportedOrders.length };
};

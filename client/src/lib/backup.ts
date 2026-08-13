import { getSettings, iterateCustomers, iterateOrders, countCustomers, countOrders } from "./db";
import type { Measurement } from "./types";

/**
 * Exports everything stored by this app — customers, orders, all photos,
 * measurement templates and the theme — as a single JSON file in the exact
 * "full-backup" format that the new SIVASTY app understands. The user can
 * then restore it in SIVASTY via Settings > Restore / Import backup (or the
 * "Already have data? Restore backup" option on its start screen).
 *
 * Memory is treated as a scarce resource here: records are read one at a
 * time through IndexedDB cursors, photos are recompressed before they are
 * serialised, and the final JSON is assembled as many small string chunks
 * handed to the Blob constructor — never one giant JSON.stringify of the
 * whole dataset. This keeps the export from crashing the browser tab even
 * when dozens of camera photos are attached.
 */

const CUSTOMER_COLORS = ['#F97316', '#8B5CF6', '#3B82F6', '#EC4899', '#10B981', '#F59E0B'];

// Matches the default fabric gradient used when creating orders in SIVASTY.
const DEFAULT_FABRIC_GRADIENT = 'linear-gradient(135deg, #10B981, #059669)';

// Photos bigger than this (in pixels or data URL size) are re-encoded so the
// backup stays small and the tab does not run out of memory.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;
const COMPRESS_THRESHOLD = 300 * 1024;

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

// Re-encodes a large photo as a downscaled JPEG. Falls back to the original
// data URL whenever decoding or canvas is unavailable.
const compressDataUrl = async (dataUrl: string): Promise<string> => {
  if (!dataUrl.startsWith('data:image/')) return dataUrl;
  const needsReencode = dataUrl.length > COMPRESS_THRESHOLD;
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('decode failed'));
      img.src = dataUrl;
    });
    const needsResize = Math.max(img.naturalWidth, img.naturalHeight) > MAX_DIMENSION;
    if (!needsResize && !needsReencode) {
      img.src = '';
      return dataUrl;
    }
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      img.src = '';
      return dataUrl;
    }
    // White background so transparent PNGs do not turn black as JPEG.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    const compressed = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    img.src = '';
    canvas.width = 0;
    canvas.height = 0;
    return compressed.length < dataUrl.length ? compressed : dataUrl;
  } catch {
    return dataUrl;
  }
};

// Lets the UI breathe between records so the progress label keeps updating.
const yieldToUi = () => new Promise<void>(resolve => setTimeout(resolve, 0));

export const exportSivastyBackup = async (
  onProgress?: (done: number, total: number) => void,
): Promise<{ customers: number; orders: number }> => {
  const [customerTotal, orderTotal, settings] = await Promise.all([
    countCustomers(),
    countOrders(),
    getSettings(),
  ]);
  const total = customerTotal + orderTotal;
  let done = 0;
  const report = () => onProgress?.(done, total);

  const theme = settings?.theme === 'dark' ? 'dark' : 'light';
  const measurementTemplates = (settings?.defaultMeasurements || [])
    .map(item => item?.name?.trim())
    .filter((name): name is string => Boolean(name));

  // The JSON is assembled as small chunks so no single giant string is ever
  // held in memory; the Blob constructor joins them natively.
  const parts: string[] = [];
  parts.push(
    `{"app":"sivasty","kind":"full-backup","version":1,"exportedAt":${JSON.stringify(new Date().toISOString())},` +
    `"store":{"hasOnboarded":true,"theme":${JSON.stringify(theme)},` +
    `"businessInfo":{"name":"SewNaija","ownerName":"Tailor"},"customers":[`,
  );

  let customerCount = 0;
  await iterateCustomers(async (customer) => {
    const legacy = customer as unknown as LegacyCustomer;
    const photo = legacy.photo && legacy.photo.startsWith('data:')
      ? await compressDataUrl(legacy.photo)
      : undefined;
    if (customerCount > 0) parts.push(',');
    parts.push(JSON.stringify({
      id: legacy.id,
      name: legacy.name,
      initials: toInitials(legacy.name),
      color: colorFor(legacy.id),
      phone: legacy.phone,
      photoUrl: photo,
      notes: legacy.description || '',
      measurements: toMeasurementRecord(legacy.measurements),
      measurementImages: [] as string[],
      createdAt: legacy.createdAt,
    }));
    customerCount++;
    done++;
    report();
    await yieldToUi();
  });

  parts.push(`],"orders":[`);

  let orderCount = 0;
  await iterateOrders(async (order) => {
    const legacy = order as unknown as LegacyOrder;
    const materialPhotos: string[] = [];
    for (const image of imageDataUrls(legacy.materials)) {
      materialPhotos.push(await compressDataUrl(image));
    }
    const stylePhotos: string[] = [];
    for (const image of imageDataUrls(legacy.styles)) {
      stylePhotos.push(await compressDataUrl(image));
    }
    if (orderCount > 0) parts.push(',');
    parts.push(JSON.stringify({
      id: legacy.id,
      customerId: legacy.customerId,
      // The old app uses the order description as its display title.
      title: legacy.description,
      description: legacy.notes || '',
      status: legacy.status === 'completed' ? 'completed' : 'pending',
      deadline: legacy.deadline,
      price: Number(legacy.cost) || 0,
      measurements: toMeasurementRecord(legacy.customMeasurements),
      notes: legacy.notes || '',
      fabricType: 'Custom',
      fabricGradient: DEFAULT_FABRIC_GRADIENT,
      payments: [] as unknown[],
      materialPhotos,
      stylePhotos,
      measurementImages: [] as string[],
      createdAt: legacy.createdAt,
    }));
    orderCount++;
    done++;
    report();
    await yieldToUi();
  });

  parts.push(
    `],"galleryItems":[],"cachedStarredSharedItems":[],` +
    `"measurementTemplates":${JSON.stringify(measurementTemplates)},` +
    `"lastRoute":"","galleryQuery":"","galleryCategory":"All","recentlyViewedDesignIds":[],"newOrderDraft":null},` +
    `"favoritedDesignIds":[],"galleryMetadata":[],"galleryImages":[]}`,
  );

  const blob = new Blob(parts, { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `sivasty-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Give the browser a moment to start the download before releasing the URL.
  setTimeout(() => URL.revokeObjectURL(url), 10000);

  return { customers: customerCount, orders: orderCount };
};

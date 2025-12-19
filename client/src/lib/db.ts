import { Customer, Order, GalleryItem, GalleryAlbum, Theme, DEFAULT_MEASUREMENTS } from "./types";
import { queryClient } from "./queryClient";

const STORAGE_KEYS = {
  CUSTOMERS: 'sewnaija_customers',
  ORDERS: 'sewnaija_orders',
  GALLERY: 'sewnaija_gallery',
  GALLERY_ALBUMS: 'sewnaija_gallery_albums',
  THEME: 'sewnaija_theme',
  DEFAULT_MEASUREMENTS: 'sewnaija_default_measurements',
  SETUP_COMPLETE: 'sewnaija_setup_complete'
};

// Helper to simulate async delay for "realism"
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

class TinyDB {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage`, e);
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to localStorage`, e);
    }
  }

  // --- Customers ---
  async getCustomers(): Promise<Customer[]> {
    await delay();
    return this.get<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    await delay();
    const customers = this.get<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    return customers.find(c => c.id === id);
  }

  async addCustomer(data: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    await delay();
    const customers = this.get<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const newCustomer: Customer = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    this.set(STORAGE_KEYS.CUSTOMERS, [newCustomer, ...customers]);
    return newCustomer;
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    await delay();
    const customers = this.get<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Customer not found");
    
    const updated = { ...customers[index], ...data };
    customers[index] = updated;
    this.set(STORAGE_KEYS.CUSTOMERS, customers);
    return updated;
  }

  async deleteCustomer(id: string): Promise<void> {
    await delay();
    const customers = this.get<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    this.set(STORAGE_KEYS.CUSTOMERS, customers.filter(c => c.id !== id));
    // Also delete associated orders? Maybe keep them for records but orphan them? 
    // Requirement says "Delete", usually implies cascading or simple removal. Let's just remove customer.
  }

  // --- Orders ---
  async getOrders(): Promise<Order[]> {
    await delay();
    return this.get<Order[]>(STORAGE_KEYS.ORDERS, []);
  }

  async getOrder(id: string): Promise<Order | undefined> {
    await delay();
    const orders = this.get<Order[]>(STORAGE_KEYS.ORDERS, []);
    return orders.find(o => o.id === id);
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    await delay();
    const orders = this.get<Order[]>(STORAGE_KEYS.ORDERS, []);
    return orders.filter(o => o.customerId === customerId);
  }

  async addOrder(data: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<Order> {
    await delay();
    const orders = this.get<Order[]>(STORAGE_KEYS.ORDERS, []);
    const newOrder: Order = {
      ...data,
      status: 'pending',
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    this.set(STORAGE_KEYS.ORDERS, [newOrder, ...orders]);
    return newOrder;
  }

  async updateOrder(id: string, data: Partial<Order>): Promise<Order> {
    await delay();
    const orders = this.get<Order[]>(STORAGE_KEYS.ORDERS, []);
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) throw new Error("Order not found");

    const updated = { ...orders[index], ...data };
    orders[index] = updated;
    this.set(STORAGE_KEYS.ORDERS, orders);
    return updated;
  }

  async deleteOrder(id: string): Promise<void> {
    await delay();
    const orders = this.get<Order[]>(STORAGE_KEYS.ORDERS, []);
    this.set(STORAGE_KEYS.ORDERS, orders.filter(o => o.id !== id));
  }

  // --- Gallery Albums ---
  async getGalleryAlbums(): Promise<GalleryAlbum[]> {
    await delay();
    const albums = this.get<GalleryAlbum[]>(STORAGE_KEYS.GALLERY_ALBUMS, []);
    // Initialize with default albums if empty
    if (albums.length === 0) {
      const defaults: GalleryAlbum[] = [
        { id: 'album-1', name: 'Styles', createdAt: new Date().toISOString() },
        { id: 'album-2', name: 'Inspirations', createdAt: new Date().toISOString() },
        { id: 'album-3', name: 'Fabrics', createdAt: new Date().toISOString() }
      ];
      this.set(STORAGE_KEYS.GALLERY_ALBUMS, defaults);
      return defaults;
    }
    return albums;
  }

  async createGalleryAlbum(name: string): Promise<GalleryAlbum> {
    await delay();
    const albums = this.get<GalleryAlbum[]>(STORAGE_KEYS.GALLERY_ALBUMS, []);
    const newAlbum: GalleryAlbum = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString()
    };
    this.set(STORAGE_KEYS.GALLERY_ALBUMS, [newAlbum, ...albums]);
    return newAlbum;
  }

  async deleteGalleryAlbum(albumId: string): Promise<void> {
    await delay();
    const albums = this.get<GalleryAlbum[]>(STORAGE_KEYS.GALLERY_ALBUMS, []);
    this.set(STORAGE_KEYS.GALLERY_ALBUMS, albums.filter(a => a.id !== albumId));
    // Also delete gallery items in this album
    const gallery = this.get<GalleryItem[]>(STORAGE_KEYS.GALLERY, []);
    this.set(STORAGE_KEYS.GALLERY, gallery.filter(item => item.albumId !== albumId));
  }

  // --- Gallery ---
  async getGallery(): Promise<GalleryItem[]> {
    await delay();
    return this.get<GalleryItem[]>(STORAGE_KEYS.GALLERY, []);
  }

  async getGalleryByAlbum(albumId: string): Promise<GalleryItem[]> {
    await delay();
    const gallery = this.get<GalleryItem[]>(STORAGE_KEYS.GALLERY, []);
    return gallery.filter(item => item.albumId === albumId);
  }

  async addToGallery(url: string, albumId: string): Promise<GalleryItem> {
    await delay();
    const gallery = this.get<GalleryItem[]>(STORAGE_KEYS.GALLERY, []);
    const newItem: GalleryItem = {
      id: Date.now().toString(),
      url,
      albumId,
      createdAt: new Date().toISOString()
    };
    this.set(STORAGE_KEYS.GALLERY, [newItem, ...gallery]);
    return newItem;
  }

  async deleteFromGallery(itemId: string): Promise<void> {
    await delay();
    const gallery = this.get<GalleryItem[]>(STORAGE_KEYS.GALLERY, []);
    this.set(STORAGE_KEYS.GALLERY, gallery.filter(item => item.id !== itemId));
  }

  // --- Theme ---
  getTheme(): Theme {
    return this.get<Theme>(STORAGE_KEYS.THEME, 'light');
  }

  setTheme(theme: Theme): void {
    this.set(STORAGE_KEYS.THEME, theme);
    // Apply immediately to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // --- Setup & Default Measurements ---
  isSetupComplete(): boolean {
    return this.get<boolean>(STORAGE_KEYS.SETUP_COMPLETE, false);
  }

  setSetupComplete(complete: boolean): void {
    this.set(STORAGE_KEYS.SETUP_COMPLETE, complete);
  }

  getDefaultMeasurements(): { name: string; value: string }[] {
    return this.get(STORAGE_KEYS.DEFAULT_MEASUREMENTS, DEFAULT_MEASUREMENTS);
  }

  setDefaultMeasurements(measurements: { name: string; value: string }[]): void {
    this.set(STORAGE_KEYS.DEFAULT_MEASUREMENTS, measurements);
  }
}

export const db = new TinyDB();

// Initialize theme on load
const savedTheme = db.getTheme();
if (savedTheme === 'dark') document.documentElement.classList.add('dark');

// Seed some data if empty for demo purposes
const seedData = async () => {
  const customers = await db.getCustomers();
  if (customers.length === 0) {
    console.log("Seeding demo data...");
    const c1 = await db.addCustomer({
      name: "Amara Okeke",
      phone: "08012345678",
      description: "Likes Ankara styles, very particular about fit.",
      measurements: DEFAULT_MEASUREMENTS,
      photo: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    });
    
    await db.addOrder({
      customerId: c1.id,
      description: "ORD-001: Wedding Aso Ebi",
      customMeasurements: [],
      materials: [],
      styles: [],
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      cost: "45000"
    });
  }
};

seedData();

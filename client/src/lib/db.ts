import { Customer, Order, GalleryItem, Theme, DEFAULT_MEASUREMENTS } from "./types";
import { queryClient } from "./queryClient";

const STORAGE_KEYS = {
  CUSTOMERS: 'sewnaija_customers',
  ORDERS: 'sewnaija_orders',
  GALLERY: 'sewnaija_gallery',
  THEME: 'sewnaija_theme'
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

  // --- Gallery ---
  async getGallery(): Promise<GalleryItem[]> {
    await delay();
    return this.get<GalleryItem[]>(STORAGE_KEYS.GALLERY, []);
  }

  async addToGallery(url: string): Promise<GalleryItem> {
    await delay();
    const gallery = this.get<GalleryItem[]>(STORAGE_KEYS.GALLERY, []);
    const newItem: GalleryItem = {
      id: Date.now().toString(),
      url,
      createdAt: new Date().toISOString()
    };
    this.set(STORAGE_KEYS.GALLERY, [newItem, ...gallery]);
    return newItem;
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

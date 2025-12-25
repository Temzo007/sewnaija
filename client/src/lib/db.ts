import { Customer, Order, Theme, Measurement } from "./types";

const DB_NAME = 'SewNaijaDB';
const DB_VERSION = 1;

interface DBSettings {
  id: 1;
  theme: Theme;
  defaultMeasurements: Measurement[];
  setupComplete: boolean;
}

let db: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('customers')) {
        db.createObjectStore('customers', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('orders')) {
        db.createObjectStore('orders', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    };
  });
};

const initSettings = async () => {
  const db = await openDB();
  const transaction = db.transaction(['settings'], 'readwrite');
  const store = transaction.objectStore('settings');
  const request = store.get(1);
  request.onsuccess = () => {
    if (!request.result) {
      store.add({
        id: 1,
        theme: 'light',
        defaultMeasurements: [
          { name: 'Bust', value: '' },
          { name: 'Waist', value: '' },
          { name: 'Hips', value: '' },
          { name: 'Shoulder', value: '' },
          { name: 'Sleeve Length', value: '' },
          { name: 'Full Length', value: '' },
        ],
        setupComplete: false
      });
    }
  };
};

initSettings();

export const getCustomers = async (): Promise<Customer[]> => {
  const db = await openDB();
  const transaction = db.transaction(['customers'], 'readonly');
  const store = transaction.objectStore('customers');
  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
  });
};

export const getCustomer = async (id: string): Promise<Customer | undefined> => {
  const db = await openDB();
  const transaction = db.transaction(['customers'], 'readonly');
  const store = transaction.objectStore('customers');
  return new Promise((resolve) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
  });
};

export const addCustomer = async (data: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> => {
  const customer: Customer = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };
  const db = await openDB();
  const transaction = db.transaction(['customers'], 'readwrite');
  const store = transaction.objectStore('customers');
  store.add(customer);
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve(customer);
    transaction.onerror = () => reject(transaction.error);
  });
};

export const updateCustomer = async (id: string, changes: Partial<Customer>): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(['customers'], 'readwrite');
  const store = transaction.objectStore('customers');
  const request = store.get(id);
  request.onsuccess = () => {
    const customer = request.result;
    if (customer) {
      Object.assign(customer, changes);
      store.put(customer);
    }
  };
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const deleteCustomer = async (id: string): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(['customers'], 'readwrite');
  const store = transaction.objectStore('customers');
  store.delete(id);
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getOrders = async (): Promise<Order[]> => {
  const db = await openDB();
  const transaction = db.transaction(['orders'], 'readonly');
  const store = transaction.objectStore('orders');
  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
  });
};

export const getOrder = async (id: string): Promise<Order | undefined> => {
  const db = await openDB();
  const transaction = db.transaction(['orders'], 'readonly');
  const store = transaction.objectStore('orders');
  return new Promise((resolve) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
  });
};

export const addOrder = async (data: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<Order> => {
  const order: Order = {
    ...data,
    status: 'pending',
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };
  const db = await openDB();
  const transaction = db.transaction(['orders'], 'readwrite');
  const store = transaction.objectStore('orders');
  store.add(order);
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve(order);
    transaction.onerror = () => reject(transaction.error);
  });
};

export const updateOrder = async (id: string, changes: Partial<Order>): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(['orders'], 'readwrite');
  const store = transaction.objectStore('orders');
  const request = store.get(id);
  request.onsuccess = () => {
    const order = request.result;
    if (order) {
      Object.assign(order, changes);
      store.put(order);
    }
  };
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const deleteOrder = async (id: string): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(['orders'], 'readwrite');
  const store = transaction.objectStore('orders');
  store.delete(id);
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getSettings = async (): Promise<DBSettings | undefined> => {
  const db = await openDB();
  const transaction = db.transaction(['settings'], 'readonly');
  const store = transaction.objectStore('settings');
  return new Promise((resolve) => {
    const request = store.get(1);
    request.onsuccess = () => resolve(request.result);
  });
};

export const updateSettings = async (changes: Partial<DBSettings>): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(['settings'], 'readwrite');
  const store = transaction.objectStore('settings');
  const request = store.get(1);
  request.onsuccess = () => {
    const settings = request.result;
    if (settings) {
      Object.assign(settings, changes);
      store.put(settings);
    }
  };
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getTheme = async (): Promise<Theme> => {
  const settings = await getSettings();
  return settings?.theme || 'light';
};

export const setTheme = async (theme: Theme): Promise<void> => {
  await updateSettings({ theme });
  // Apply immediately to document
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export const isSetupComplete = async (): Promise<boolean> => {
  const settings = await getSettings();
  return settings?.setupComplete || false;
};

export const setSetupComplete = async (complete: boolean): Promise<void> => {
  await updateSettings({ setupComplete: complete });
};

export const getDefaultMeasurements = async (): Promise<Measurement[]> => {
  const settings = await getSettings();
  return settings?.defaultMeasurements || [
    { name: 'Bust', value: '' },
    { name: 'Waist', value: '' },
    { name: 'Hips', value: '' },
    { name: 'Shoulder', value: '' },
    { name: 'Sleeve Length', value: '' },
    { name: 'Full Length', value: '' },
  ];
};

export const setDefaultMeasurements = async (measurements: Measurement[]): Promise<void> => {
  await updateSettings({ defaultMeasurements: measurements });
};

// Initialize theme on load
getTheme().then(theme => {
  if (theme === 'dark') document.documentElement.classList.add('dark');
});


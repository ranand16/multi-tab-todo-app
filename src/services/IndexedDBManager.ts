import { Todo } from "../interfaces/Todo";

export default class IndexedDBManager {
  private dbName: string;
  private dbVersion: number;
  private objectStoreName: string;
  private db: IDBDatabase | null;

  constructor(dbName: string, dbVersion: number, objectStoreName: string) {
    this.dbName = dbName;
    this.dbVersion = dbVersion;
    this.objectStoreName = objectStoreName;
    this.db = null;
  }

  async initialize(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        console.error('Database error:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.objectStoreName)) {
          db.createObjectStore(this.objectStoreName, { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  async loadAll(): Promise<Todo[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(this.objectStoreName, 'readonly');
      const objectStore = transaction.objectStore(this.objectStoreName);
      const getAllRequest = objectStore.getAll();

      getAllRequest.onsuccess = (event) => {
        resolve((event.target as IDBRequest<Todo[]>).result);
      };

      getAllRequest.onerror = (event) => {
        console.error('Error loading data:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }

  async add(item: Omit<Todo, 'id'>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(this.objectStoreName, 'readwrite');
      const objectStore = transaction.objectStore(this.objectStoreName);
      const addRequest = objectStore.add(item);

      addRequest.onsuccess = () => {
        resolve();
      };

      addRequest.onerror = (event) => {
        console.error('Error adding item:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }

  close(): void {
    this.db?.close();
    this.db = null;
  }
}

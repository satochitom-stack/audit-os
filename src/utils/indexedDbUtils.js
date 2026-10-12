// Native IndexedDB helper for storing central document attachments safely
// Avoids localStorage 5MB quota exhaustion for PDF and document files

const DB_NAME = 'AuditOS_CentralHub';
const DB_VERSION = 1;
const STORE_NAME = 'document_files';

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save an uploaded file (Base64 dataUrl or Blob) associated with a document ID
 * @param {string} id - Document ID
 * @param {object} fileData - { fileName, fileType, fileSize, dataUrl, mimeType }
 */
export async function saveDocumentFile(id, fileData) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ id, ...fileData, updatedAt: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to save file to IndexedDB:', err);
    return false;
  }
}

/**
 * Get an uploaded file associated with a document ID
 * @param {string} id - Document ID
 * @returns {Promise<object|null>}
 */
export async function getDocumentFile(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to get file from IndexedDB:', err);
    return null;
  }
}

/**
 * Delete an uploaded file associated with a document ID
 * @param {string} id - Document ID
 */
export async function deleteDocumentFile(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to delete file from IndexedDB:', err);
    return false;
  }
}

const DB_KEY = 'SASTA_TRUST_DB';

export const initDB = () => {
  if (!localStorage.getItem(DB_KEY)) {
    localStorage.setItem(DB_KEY, JSON.stringify({
      occasions: [],
      receipts: []
    }));
  }
};

const getDB = () => {
  initDB();
  return JSON.parse(localStorage.getItem(DB_KEY));
};

const saveDB = (data) => {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
};

// Simulate network delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const getOccasions = async () => {
  await delay();
  return getDB().occasions.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const addOccasion = async (occasionData) => {
  await delay();
  const db = getDB();
  const newOccasion = {
    ...occasionData,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    media: [] // Array of media strings (base64 or URL)
  };
  db.occasions.push(newOccasion);
  saveDB(db);
  return newOccasion;
};

export const deleteOccasion = async (occasionId) => {
  await delay(300);
  const db = getDB();
  db.occasions = db.occasions.filter(o => o.id !== occasionId);
  saveDB(db);
  return true;
};

export const updateOccasion = async (occasionId, updatedData) => {
  await delay(300);
  const db = getDB();
  const index = db.occasions.findIndex(o => o.id === occasionId);
  if (index !== -1) {
    db.occasions[index] = { ...db.occasions[index], ...updatedData };
    saveDB(db);
    return db.occasions[index];
  }
  throw new Error('Occasion not found');
};

export const deleteMediaFromOccasion = async (occasionId, mediaIndex) => {
  await delay(300);
  const db = getDB();
  const index = db.occasions.findIndex(o => o.id === occasionId);
  if (index !== -1) {
    db.occasions[index].media.splice(mediaIndex, 1);
    saveDB(db);
    return db.occasions[index];
  }
  throw new Error('Occasion not found');
};

export const addMediaToOccasion = async (occasionId, mediaArray) => {
  await delay();
  const db = getDB();
  const index = db.occasions.findIndex(o => o.id === occasionId);
  if (index !== -1) {
    if (db.occasions[index].media.length + mediaArray.length <= 50) {
       db.occasions[index].media.push(...mediaArray);
       saveDB(db);
       return db.occasions[index];
    } else {
       throw new Error('Maximum 50 media files allowed per occasion.');
    }
  }
  throw new Error('Occasion not found');
};

export const getReceipts = async () => {
  await delay();
  return getDB().receipts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const addReceipt = async (receiptData) => {
  await delay();
  const db = getDB();
  const newReceipt = {
    ...receiptData,
    id: 'RCPT-' + Date.now().toString().slice(-6),
    createdAt: new Date().toISOString(),
  };
  db.receipts.push(newReceipt);
  saveDB(db);
  return newReceipt;
};

// File to Base64 (simple helper)
export const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

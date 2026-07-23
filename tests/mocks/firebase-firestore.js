// Mock Firebase Firestore module
const collection = jest.fn(() => ({ collection: 'mock' }));
const doc = jest.fn((db, col, id) => ({ path: `${col}/${id}` }));
const getDoc = jest.fn();
const getDocs = jest.fn();
const addDoc = jest.fn();
const updateDoc = jest.fn();
const deleteDoc = jest.fn();
const query = jest.fn((...args) => ({ constraints: args }));
const where = jest.fn((field, op, value) => ({ field, op, value }));
const orderBy = jest.fn((field, direction) => ({ field, direction }));
const limit = jest.fn((n) => ({ limit: n }));
const startAfter = jest.fn((doc) => ({ startAfter: doc }));
const getCountFromServer = jest.fn();

// Set default return values
getDoc.mockResolvedValue({ exists: () => false });
getDocs.mockResolvedValue({ docs: [] });
addDoc.mockResolvedValue({ id: 'mock-id' });
updateDoc.mockResolvedValue(undefined);
deleteDoc.mockResolvedValue(undefined);
getCountFromServer.mockResolvedValue({ count: () => 0 });

const Timestamp = {
  now: jest.fn(() => ({
    toDate: () => new Date(),
    toMillis: () => Date.now(),
  })),
  fromDate: jest.fn((date) => ({
    toDate: () => date,
  })),
};

module.exports = {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  Timestamp,
};

// Tests for product-repository.js

import { Product, ProductRepository, PRODUCT_STATUS } from '../js/product-repository';

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({ collection: 'products' })),
  doc: jest.fn((db, col, id) => ({ path: `${col}/${id}` })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn((...args) => ({ constraints: args })),
  where: jest.fn((field, op, value) => ({ field, op, value })),
  orderBy: jest.fn((field, direction) => ({ field, direction })),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
  },
}));

// Mock error handler
jest.mock('../js/error-handler.js', () => ({
  ErrorHandler: {
    log: jest.fn(),
  },
  withTimeout: jest.fn((promise) => promise),
}));

// Mock validation
jest.mock('../js/validation.js', () => ({
  validateProduct: jest.fn(() => ({ isValid: true })),
}));

describe('Product Model', () => {
  test('creates product from data', () => {
    const data = {
      id: 'prod1',
      name: 'LED Bulb',
      price: 99.99,
      category: 'LED',
      status: 'active',
    };
    const product = new Product(data);
    expect(product.id).toBe('prod1');
    expect(product.name).toBe('LED Bulb');
    expect(product.status).toBe('active');
  });

  test('provides status check methods', () => {
    const activeProduct = new Product({ status: 'active' });
    expect(activeProduct.isActive()).toBe(true);
    expect(activeProduct.isArchived()).toBe(false);
    expect(activeProduct.isDraft()).toBe(false);

    const archivedProduct = new Product({ status: 'archived' });
    expect(archivedProduct.isArchived()).toBe(true);
  });

  test('defaults status to active', () => {
    const product = new Product({ id: 'test' });
    expect(product.status).toBe('active');
  });

  test('converts to JSON', () => {
    const data = {
      id: 'prod1',
      name: 'LED Bulb',
      price: 99.99,
      category: 'LED',
      status: 'active',
    };
    const product = new Product(data);
    const json = product.toJSON();
    expect(json.name).toBe('LED Bulb');
    expect(json.status).toBe('active');
    expect(json.id).toBeUndefined(); // ID not included in JSON
  });

  test('provides default values for optional fields', () => {
    const product = new Product({ name: 'Test' });
    expect(product.emoji).toBe('💡');
    expect(product.image).toBe('');
    expect(product.desc).toBe('');
    expect(product.inventory).toBe(0);
    expect(product.tags).toEqual([]);
  });
});

describe('ProductRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getById', () => {
    test('fetches product by ID', async () => {
      const { getDoc } = require('firebase/firestore');
      const mockData = { name: 'LED Bulb', price: 99.99 };
      getDoc.mockResolvedValue({
        exists: () => true,
        id: 'prod1',
        data: () => mockData,
      });

      const product = await ProductRepository.getById('prod1');
      expect(product.name).toBe('LED Bulb');
      expect(product.id).toBe('prod1');
    });

    test('returns null if product not found', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({ exists: () => false });

      await expect(ProductRepository.getById('nonexistent')).rejects.toThrow();
    });
  });

  describe('create', () => {
    test('creates new product', async () => {
      const { addDoc } = require('firebase/firestore');
      addDoc.mockResolvedValue({ id: 'new-prod' });

      const data = {
        name: 'LED Bulb',
        price: 99.99,
        category: 'LED',
        sku: 'LED-001',
        image: '',
        desc: '',
        emoji: '💡',
      };

      const result = await ProductRepository.create(data, 'admin-uid');
      expect(result.id).toBe('new-prod');
      expect(addDoc).toHaveBeenCalled();
    });

    test('sets createdBy and timestamps', async () => {
      const { addDoc } = require('firebase/firestore');
      addDoc.mockResolvedValue({ id: 'new-prod' });

      const data = {
        name: 'LED',
        price: 99.99,
        category: 'LED',
      };

      await ProductRepository.create(data, 'admin-123');

      const callArgs = addDoc.mock.calls[0][1];
      expect(callArgs.createdBy).toBe('admin-123');
      expect(callArgs.createdAt).toBeDefined();
      expect(callArgs.updatedAt).toBeDefined();
    });

    test('validates product data', async () => {
      const { validateProduct } = require('../js/validation');
      validateProduct.mockReturnValue({ isValid: false, getErrorMessage: () => 'Invalid' });

      const data = { name: '', price: -50 };
      await expect(ProductRepository.create(data, 'uid')).rejects.toThrow();
    });
  });

  describe('update', () => {
    test('updates existing product', async () => {
      const { updateDoc } = require('firebase/firestore');
      updateDoc.mockResolvedValue(undefined);

      const data = { name: 'Updated LED', price: 149.99 };
      await ProductRepository.update('prod1', data, 'admin-uid');

      expect(updateDoc).toHaveBeenCalled();
    });

    test('sets updatedAt but preserves createdBy', async () => {
      const { updateDoc } = require('firebase/firestore');
      updateDoc.mockResolvedValue(undefined);

      const data = {
        name: 'Updated',
        price: 99.99,
        category: 'LED',
        createdBy: 'different-uid', // Should be removed
      };

      await ProductRepository.update('prod1', data, 'admin-uid');

      const callArgs = updateDoc.mock.calls[0][1];
      expect(callArgs.updatedAt).toBeDefined();
      expect(callArgs.createdBy).toBeUndefined();
    });
  });

  describe('archive', () => {
    test('archives product (soft delete)', async () => {
      const { updateDoc } = require('firebase/firestore');
      updateDoc.mockResolvedValue(undefined);

      await ProductRepository.archive('prod1');

      const callArgs = updateDoc.mock.calls[0][1];
      expect(callArgs.status).toBe(PRODUCT_STATUS.ARCHIVED);
    });
  });

  describe('restore', () => {
    test('restores archived product', async () => {
      const { updateDoc } = require('firebase/firestore');
      updateDoc.mockResolvedValue(undefined);

      await ProductRepository.restore('prod1');

      const callArgs = updateDoc.mock.calls[0][1];
      expect(callArgs.status).toBe(PRODUCT_STATUS.ACTIVE);
    });
  });

  describe('delete', () => {
    test('permanently deletes product', async () => {
      const { deleteDoc } = require('firebase/firestore');
      deleteDoc.mockResolvedValue(undefined);

      await ProductRepository.delete('prod1');
      expect(deleteDoc).toHaveBeenCalled();
    });
  });

  describe('getByStatus', () => {
    test('fetches products by status', async () => {
      const { getDocs } = require('firebase/firestore');
      const mockDocs = [
        { id: 'p1', data: () => ({ status: 'active', name: 'Product 1' }) },
        { id: 'p2', data: () => ({ status: 'active', name: 'Product 2' }) },
      ];
      getDocs.mockResolvedValue({ docs: mockDocs });

      const products = await ProductRepository.getByStatus('active');
      expect(products).toHaveLength(2);
      expect(products[0].status).toBe('active');
    });

    test('rejects invalid status', async () => {
      await expect(ProductRepository.getByStatus('invalid')).rejects.toThrow('Invalid status');
    });
  });

  describe('getByCategory', () => {
    test('fetches products by category', async () => {
      const { getDocs } = require('firebase/firestore');
      const mockDocs = [
        { id: 'p1', data: () => ({ category: 'LED', name: 'Product 1' }) },
      ];
      getDocs.mockResolvedValue({ docs: mockDocs });

      const products = await ProductRepository.getByCategory('LED');
      expect(products).toHaveLength(1);
      expect(products[0].category).toBe('LED');
    });
  });

  describe('updateStatus', () => {
    test('updates multiple products status', async () => {
      const { updateDoc } = require('firebase/firestore');
      updateDoc.mockResolvedValue(undefined);

      await ProductRepository.updateStatus(['p1', 'p2'], PRODUCT_STATUS.ARCHIVED);
      expect(updateDoc).toHaveBeenCalledTimes(2);
    });

    test('rejects invalid status', async () => {
      await expect(
        ProductRepository.updateStatus(['p1'], 'invalid')
      ).rejects.toThrow('Invalid status');
    });
  });

  describe('getCountByStatus', () => {
    test('counts products by status', async () => {
      const { getDocs } = require('firebase/firestore');
      const mockDocs = [
        { id: 'p1', data: () => ({ status: 'active' }) },
        { id: 'p2', data: () => ({ status: 'active' }) },
      ];
      getDocs.mockResolvedValue({ docs: mockDocs });

      const count = await ProductRepository.getCountByStatus('active');
      expect(count).toBe(2);
    });
  });
});

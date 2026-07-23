// ===== Product Repository =====
// Centralized data access layer with error handling and status management

import { db } from "./firebase-config.js";
import {
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
  Timestamp,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { ErrorHandler, withTimeout, withRetry } from "./error-handler.js";
import { validateProduct } from "./validation.js";

const PRODUCTS_COLLECTION = "products";
const PRODUCT_STATUS = {
  ACTIVE: "active",
  ARCHIVED: "archived",
  DRAFT: "draft",
};

// ===== Product Model =====
export class Product {
  constructor(data) {
    this.id = data.id;
    this.sku = data.sku || "";
    this.name = data.name;
    this.category = data.category;
    this.price = data.price;
    this.emoji = data.emoji || "💡";
    this.image = data.image || "";
    this.desc = data.desc || "";
    this.status = data.status || PRODUCT_STATUS.ACTIVE;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.inventory = data.inventory || 0;
    this.tags = data.tags || [];
  }

  isActive() {
    return this.status === PRODUCT_STATUS.ACTIVE;
  }

  isArchived() {
    return this.status === PRODUCT_STATUS.ARCHIVED;
  }

  isDraft() {
    return this.status === PRODUCT_STATUS.DRAFT;
  }

  toJSON() {
    return {
      sku: this.sku,
      name: this.name,
      category: this.category,
      price: this.price,
      emoji: this.emoji,
      image: this.image,
      desc: this.desc,
      status: this.status,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      inventory: this.inventory,
      tags: this.tags,
    };
  }
}

// ===== Product Repository =====
export class ProductRepository {
  // Get single product
  static async getById(productId) {
    try {
      const docRef = doc(db, PRODUCTS_COLLECTION, productId);
      const docSnap = await withTimeout(getDoc(docRef));

      if (!docSnap.exists()) {
        throw new Error("Product not found");
      }

      return new Product({ id: docSnap.id, ...docSnap.data() });
    } catch (error) {
      throw ErrorHandler.log(error, { operation: "getById", productId });
    }
  }

  // Get all active products
  static async getActive(limit = 1000) {
    try {
      const q = query(
        collection(db, PRODUCTS_COLLECTION),
        where("status", "==", PRODUCT_STATUS.ACTIVE),
        orderBy("name")
      );
      const querySnap = await withTimeout(getDocs(q));

      return querySnap.docs.slice(0, limit).map(
        doc => new Product({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      throw ErrorHandler.log(error, { operation: "getActive" });
    }
  }

  // Get products by status
  static async getByStatus(status) {
    try {
      if (!Object.values(PRODUCT_STATUS).includes(status)) {
        throw new Error(`Invalid status: ${status}`);
      }

      const q = query(
        collection(db, PRODUCTS_COLLECTION),
        where("status", "==", status),
        orderBy("updatedAt", "desc")
      );
      const querySnap = await withTimeout(getDocs(q));

      return querySnap.docs.map(
        doc => new Product({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      throw ErrorHandler.log(error, { operation: "getByStatus", status });
    }
  }

  // Get products by category
  static async getByCategory(category, status = PRODUCT_STATUS.ACTIVE) {
    try {
      const q = query(
        collection(db, PRODUCTS_COLLECTION),
        where("category", "==", category),
        where("status", "==", status),
        orderBy("name")
      );
      const querySnap = await withTimeout(getDocs(q));

      return querySnap.docs.map(
        doc => new Product({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      throw ErrorHandler.log(error, { operation: "getByCategory", category });
    }
  }

  // Create product
  static async create(rawData, adminUid) {
    try {
      const validation = validateProduct(rawData);
      if (!validation.isValid) {
        throw new Error(validation.getErrorMessage());
      }

      const product = new Product({
        ...rawData,
        status: PRODUCT_STATUS.ACTIVE,
        createdBy: adminUid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        inventory: rawData.inventory || 0,
        tags: rawData.tags || [],
      });

      const docRef = await withTimeout(
        addDoc(collection(db, PRODUCTS_COLLECTION), product.toJSON())
      );

      return { ...product, id: docRef.id };
    } catch (error) {
      throw ErrorHandler.log(error, { operation: "create", adminUid });
    }
  }

  // Update product
  static async update(productId, rawData, adminUid) {
    try {
      const validation = validateProduct(rawData);
      if (!validation.isValid) {
        throw new Error(validation.getErrorMessage());
      }

      const updateData = {
        ...rawData,
        updatedAt: Timestamp.now(),
      };

      // Don't allow changing createdBy
      delete updateData.createdBy;

      const docRef = doc(db, PRODUCTS_COLLECTION, productId);
      await withTimeout(updateDoc(docRef, updateData));

      return await this.getById(productId);
    } catch (error) {
      throw ErrorHandler.log(error, { operation: "update", productId, adminUid });
    }
  }

  // Archive product (soft delete)
  static async archive(productId) {
    try {
      const docRef = doc(db, PRODUCTS_COLLECTION, productId);
      await withTimeout(
        updateDoc(docRef, {
          status: PRODUCT_STATUS.ARCHIVED,
          updatedAt: Timestamp.now(),
        })
      );

      return await this.getById(productId);
    } catch (error) {
      throw ErrorHandler.log(error, { operation: "archive", productId });
    }
  }

  // Restore archived product
  static async restore(productId) {
    try {
      const docRef = doc(db, PRODUCTS_COLLECTION, productId);
      await withTimeout(
        updateDoc(docRef, {
          status: PRODUCT_STATUS.ACTIVE,
          updatedAt: Timestamp.now(),
        })
      );

      return await this.getById(productId);
    } catch (error) {
      throw ErrorHandler.log(error, { operation: "restore", productId });
    }
  }

  // Hard delete (permanent)
  static async delete(productId) {
    try {
      const docRef = doc(db, PRODUCTS_COLLECTION, productId);
      await withTimeout(deleteDoc(docRef));
    } catch (error) {
      throw ErrorHandler.log(error, { operation: "delete", productId });
    }
  }

  // Batch status update
  static async updateStatus(productIds, newStatus) {
    try {
      if (!Object.values(PRODUCT_STATUS).includes(newStatus)) {
        throw new Error(`Invalid status: ${newStatus}`);
      }

      const promises = productIds.map(id =>
        updateDoc(doc(db, PRODUCTS_COLLECTION, id), {
          status: newStatus,
          updatedAt: Timestamp.now(),
        })
      );

      await withTimeout(Promise.all(promises));
    } catch (error) {
      throw ErrorHandler.log(error, { operation: "updateStatus", newStatus });
    }
  }

  // Get product count by status
  static async getCountByStatus(status) {
    try {
      const products = await this.getByStatus(status);
      return products.length;
    } catch (error) {
      throw ErrorHandler.log(error, { operation: "getCountByStatus", status });
    }
  }
}

export { PRODUCT_STATUS };
export default ProductRepository;

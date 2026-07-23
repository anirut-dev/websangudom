// ===== Optimized Firestore Queries =====
// Server-side filtering, pagination, and indexing for performance
// Reduces bandwidth, improves load times, reduces memory usage

import { db } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getCountFromServer
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// ===== Query Pagination State =====
export class ProductPagination {
  constructor(pageSize = 20) {
    this.pageSize = pageSize;
    this.currentPage = [];
    this.lastDoc = null;
    this.hasMore = true;
    this.totalCount = null;
  }

  reset() {
    this.currentPage = [];
    this.lastDoc = null;
    this.hasMore = true;
  }
}

// ===== Product Queries =====

/**
 * Get products with server-side filtering
 * @param {string} category - Category filter (empty string = all)
 * @param {string} searchTerm - Search term for product name
 * @param {number} pageSize - Items per page
 * @param {DocumentSnapshot} lastDoc - Last document from previous page
 * @returns {Promise<{products: Array, lastDoc: DocumentSnapshot, hasMore: boolean}>}
 */
export async function getProductsWithFilters(category, searchTerm, pageSize = 20, lastDoc = null) {
  try {
    // Build query constraints
    const constraints = [orderBy("name")];

    // Add category filter if specified
    if (category && category !== "ทั้งหมด") {
      constraints.push(where("category", "==", category));
    }

    // Add search filter if specified
    // Note: Full-text search requires custom indexes
    // For now, using name prefix matching (requires index)
    if (searchTerm) {
      const searchUpper = searchTerm.toUpperCase();
      const searchLower = searchTerm.toLowerCase();

      constraints.push(where("name", ">=", searchTerm));
      constraints.push(where("name", "<", searchTerm + "z"));
    }

    // Add pagination
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    // Limit results
    constraints.push(limit(pageSize + 1)); // +1 to check if more exist

    const q = query(collection(db, "products"), ...constraints);
    const snap = await getDocs(q);

    const products = [];
    let hasMore = false;
    let newLastDoc = null;

    snap.docs.forEach((doc, index) => {
      if (index < pageSize) {
        products.push({
          id: doc.id,
          ...doc.data()
        });
        newLastDoc = doc;
      } else {
        hasMore = true;
      }
    });

    return {
      products,
      lastDoc: newLastDoc,
      hasMore,
      count: products.length
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
}

/**
 * Get product count with filters
 * More efficient than fetching all docs just to count
 */
export async function getProductCount(category = null) {
  try {
    const constraints = [];

    if (category && category !== "ทั้งหมด") {
      constraints.push(where("category", "==", category));
    }

    const q = query(collection(db, "products"), ...constraints);
    const snap = await getCountFromServer(q);

    return snap.data().count;
  } catch (error) {
    console.error("Error getting product count:", error);
    return 0;
  }
}

/**
 * Get distinct categories for filtering
 * Requires building from products (or maintain separately)
 */
export async function getCategories() {
  try {
    const q = query(collection(db, "products"), orderBy("category"));
    const snap = await getDocs(q);

    const categories = new Set();
    snap.docs.forEach(doc => {
      const category = doc.data().category;
      if (category) categories.add(category);
    });

    return Array.from(categories).sort((a, b) => a.localeCompare(b, "th"));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

/**
 * Get single product by ID
 */
export async function getProductById(productId) {
  try {
    const q = query(
      collection(db, "products"),
      where("__name__", "==", productId)
    );
    const snap = await getDocs(q);

    if (snap.empty) return null;

    const doc = snap.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

// ===== Firestore Indexes =====
// These indexes should be created in Firebase Console for optimal performance
// Or generate from firestore.indexes.json

export const RECOMMENDED_INDEXES = [
  {
    name: "products-category-name",
    fields: [
      { name: "category", direction: "ASCENDING" },
      { name: "name", direction: "ASCENDING" }
    ]
  },
  {
    name: "products-name-search",
    fields: [
      { name: "name", direction: "ASCENDING" }
    ]
  },
  {
    name: "products-price-range",
    fields: [
      { name: "price", direction: "ASCENDING" }
    ]
  },
  {
    name: "products-status-category",
    fields: [
      { name: "status", direction: "ASCENDING" },
      { name: "category", direction: "ASCENDING" }
    ]
  }
];

export default {
  ProductPagination,
  getProductsWithFilters,
  getProductCount,
  getCategories,
  getProductById,
  RECOMMENDED_INDEXES
};

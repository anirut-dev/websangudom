/**
 * Firebase Cloud Functions for Sang Udom Lighting Centre
 *
 * Deployment:
 * 1. Install Firebase CLI: npm install -g firebase-tools
 * 2. Initialize functions: firebase init functions
 * 3. Deploy: firebase deploy --only functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// ===== Audit Logging =====
// Log all product modifications for security and compliance

/**
 * Log product creation
 */
exports.logProductCreate = functions.firestore
  .document("products/{productId}")
  .onCreate(async (snap, context) => {
    const productId = context.params.productId;
    const product = snap.data();
    const timestamp = admin.firestore.Timestamp.now();

    try {
      await db.collection("audit_logs").add({
        action: "CREATE",
        collection: "products",
        documentId: productId,
        timestamp: timestamp,
        userId: context.auth?.uid || "anonymous",
        data: product,
        changes: {
          before: null,
          after: product
        }
      });

      console.log(`✓ Logged product creation: ${productId}`);
    } catch (error) {
      console.error(`✗ Failed to log product creation: ${error.message}`);
    }
  });

/**
 * Log product updates
 */
exports.logProductUpdate = functions.firestore
  .document("products/{productId}")
  .onUpdate(async (change, context) => {
    const productId = context.params.productId;
    const before = change.before.data();
    const after = change.after.data();
    const timestamp = admin.firestore.Timestamp.now();

    try {
      // Track what changed
      const changes = {};
      for (const key in after) {
        if (before[key] !== after[key]) {
          changes[key] = {
            before: before[key],
            after: after[key]
          };
        }
      }

      await db.collection("audit_logs").add({
        action: "UPDATE",
        collection: "products",
        documentId: productId,
        timestamp: timestamp,
        userId: context.auth?.uid || "anonymous",
        changes: changes
      });

      console.log(`✓ Logged product update: ${productId}`);
    } catch (error) {
      console.error(`✗ Failed to log product update: ${error.message}`);
    }
  });

/**
 * Log product deletion
 */
exports.logProductDelete = functions.firestore
  .document("products/{productId}")
  .onDelete(async (snap, context) => {
    const productId = context.params.productId;
    const product = snap.data();
    const timestamp = admin.firestore.Timestamp.now();

    try {
      await db.collection("audit_logs").add({
        action: "DELETE",
        collection: "products",
        documentId: productId,
        timestamp: timestamp,
        userId: context.auth?.uid || "anonymous",
        data: product,
        changes: {
          before: product,
          after: null
        }
      });

      console.log(`✓ Logged product deletion: ${productId}`);
    } catch (error) {
      console.error(`✗ Failed to log product deletion: ${error.message}`);
    }
  });

// ===== Custom Claims Management =====
// Manage admin roles through custom claims instead of hardcoding UIDs

/**
 * Set admin role for a user
 * Usage: firebase functions:shell
 * > setAdminRole('user-uid', true)
 */
exports.setAdminRole = functions.https.onCall(async (data, context) => {
  // Verify caller is admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be logged in"
    );
  }

  const callerClaims = context.auth.token;
  if (!callerClaims.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can manage roles"
    );
  }

  const { uid, isAdmin } = data;

  try {
    await admin.auth().setCustomUserClaims(uid, { admin: isAdmin });

    // Log the action
    await db.collection("audit_logs").add({
      action: "SET_ADMIN_ROLE",
      timestamp: admin.firestore.Timestamp.now(),
      userId: context.auth.uid,
      targetUserId: uid,
      isAdmin: isAdmin
    });

    return { success: true, message: `Admin role ${isAdmin ? "granted" : "revoked"}` };
  } catch (error) {
    console.error("Error setting admin role:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// ===== Admin Functions =====
// Cloud Functions that verify admin status before executing

/**
 * Verify if user is admin
 */
exports.isUserAdmin = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    return { isAdmin: false };
  }

  const claims = context.auth.token;
  return { isAdmin: claims.admin === true };
});

/**
 * Get audit log for a product
 * Shows who created/edited/deleted and when
 */
exports.getProductAuditLog = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in");
  }

  const { productId } = data;
  if (!productId) {
    throw new functions.https.HttpsError("invalid-argument", "productId required");
  }

  try {
    const logs = await db
      .collection("audit_logs")
      .where("documentId", "==", productId)
      .where("collection", "==", "products")
      .orderBy("timestamp", "desc")
      .limit(100)
      .get();

    return {
      productId,
      logs: logs.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
      }))
    };
  } catch (error) {
    console.error("Error fetching audit log:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Clean up old audit logs (retention policy)
 * Runs daily to delete logs older than 90 days
 */
exports.cleanupAuditLogs = functions.pubsub
  .schedule("every day 03:00")
  .timeZone("Asia/Bangkok")
  .onRun(async (context) => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    try {
      const query = db
        .collection("audit_logs")
        .where("timestamp", "<", admin.firestore.Timestamp.fromDate(ninetyDaysAgo));

      const docs = await query.get();
      console.log(`Deleting ${docs.size} audit logs older than 90 days`);

      // Delete in batches
      const batch = db.batch();
      docs.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log("✓ Audit log cleanup completed");

      return { deleted: docs.size };
    } catch (error) {
      console.error("Error cleaning up audit logs:", error);
      throw error;
    }
  });

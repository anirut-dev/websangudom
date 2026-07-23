// ===== Product Validation =====
// Input validation for data integrity and error prevention

/**
 * Validation result object
 */
export class ValidationResult {
  constructor(isValid = true, errors = []) {
    this.isValid = isValid;
    this.errors = errors;
  }

  addError(field, message) {
    this.isValid = false;
    this.errors.push({ field, message });
  }

  getErrorMessage() {
    if (this.isValid) return null;
    return this.errors.map(e => `${e.field}: ${e.message}`).join("\n");
  }
}

// ===== Field Validators =====

export function validateProductName(name) {
  const trimmed = String(name || "").trim();

  if (!trimmed) {
    return { valid: false, error: "ชื่อสินค้า จำเป็นต้องกรอก" };
  }

  if (trimmed.length < 2) {
    return { valid: false, error: "ชื่อสินค้า ต้องอย่างน้อย 2 ตัวอักษร" };
  }

  if (trimmed.length > 200) {
    return { valid: false, error: "ชื่อสินค้า ต้องไม่เกิน 200 ตัวอักษร" };
  }

  return { valid: true, value: trimmed };
}

export function validateProductPrice(price) {
  const num = Number(price);

  if (isNaN(num)) {
    return { valid: false, error: "ราคา ต้องเป็นตัวเลข" };
  }

  if (num <= 0) {
    return { valid: false, error: "ราคา ต้องมากกว่า 0" };
  }

  if (num > 999999999) {
    return { valid: false, error: "ราคา มีค่ามากเกินไป" };
  }

  if (!Number.isInteger(num * 100)) {
    return { valid: false, error: "ราคา ทศนิยมได้สูงสุด 2 ตำแหน่ง" };
  }

  return { valid: true, value: num };
}

export function validateProductCategory(category, validCategories = []) {
  const trimmed = String(category || "").trim();

  if (!trimmed) {
    return { valid: false, error: "หมวดหมู่ จำเป็นต้องเลือก" };
  }

  if (validCategories.length > 0 && !validCategories.includes(trimmed)) {
    return { valid: false, error: "หมวดหมู่ ไม่ถูกต้อง" };
  }

  return { valid: true, value: trimmed };
}

export function validateProductSKU(sku) {
  const trimmed = String(sku || "").trim();

  if (!trimmed) {
    return { valid: true, value: "" }; // SKU optional
  }

  if (trimmed.length > 50) {
    return { valid: false, error: "SKU ต้องไม่เกิน 50 ตัวอักษร" };
  }

  // SKU should be alphanumeric + some special chars
  if (!/^[a-zA-Z0-9\-_]+$/.test(trimmed)) {
    return { valid: false, error: "SKU ควรใช้ตัวอักษร ตัวเลข และ dash/underscore เท่านั้น" };
  }

  return { valid: true, value: trimmed };
}

export function validateProductImage(imageUrl) {
  const trimmed = String(imageUrl || "").trim();

  if (!trimmed) {
    return { valid: true, value: "" }; // Image optional
  }

  // Check if URL format is valid
  try {
    new URL(trimmed);
  } catch {
    return { valid: false, error: "ลิงค์รูป ต้องเป็น URL ที่ถูกต้อง" };
  }

  // Check if it's from a trusted image host
  const allowedHosts = ["cloudinary.com", "res.cloudinary.com"];
  const url = new URL(trimmed);

  if (!allowedHosts.some(host => url.hostname.includes(host))) {
    console.warn("⚠️ Image from untrusted host:", url.hostname);
  }

  return { valid: true, value: trimmed };
}

export function validateProductDescription(desc) {
  const trimmed = String(desc || "").trim();

  if (!trimmed) {
    return { valid: true, value: "" }; // Description optional
  }

  if (trimmed.length > 2000) {
    return { valid: false, error: "รายละเอียด ต้องไม่เกิน 2000 ตัวอักษร" };
  }

  return { valid: true, value: trimmed };
}

export function validateProductEmoji(emoji) {
  const trimmed = String(emoji || "").trim();

  if (!trimmed) {
    return { valid: true, value: "💡" }; // Default emoji
  }

  // Simple emoji length check (emoji can be multiple bytes)
  if (trimmed.length > 10) {
    return { valid: false, error: "อิโมจิ มีความยาวมากเกินไป" };
  }

  return { valid: true, value: trimmed };
}

// ===== Product Validation =====

/**
 * Validate entire product object
 */
export function validateProduct(product, validCategories = []) {
  const result = new ValidationResult();

  // Validate name
  const nameValidation = validateProductName(product.name);
  if (!nameValidation.valid) {
    result.addError("name", nameValidation.error);
  }

  // Validate price
  const priceValidation = validateProductPrice(product.price);
  if (!priceValidation.valid) {
    result.addError("price", priceValidation.error);
  }

  // Validate category
  const categoryValidation = validateProductCategory(product.category, validCategories);
  if (!categoryValidation.valid) {
    result.addError("category", categoryValidation.error);
  }

  // Validate SKU (optional)
  const skuValidation = validateProductSKU(product.sku);
  if (!skuValidation.valid) {
    result.addError("sku", skuValidation.error);
  }

  // Validate image (optional)
  const imageValidation = validateProductImage(product.image);
  if (!imageValidation.valid) {
    result.addError("image", imageValidation.error);
  }

  // Validate description (optional)
  const descValidation = validateProductDescription(product.desc);
  if (!descValidation.valid) {
    result.addError("desc", descValidation.error);
  }

  // Validate emoji (optional)
  const emojiValidation = validateProductEmoji(product.emoji);
  if (!emojiValidation.valid) {
    result.addError("emoji", emojiValidation.error);
  }

  return result;
}

/**
 * Sanitize product data before saving
 */
export function sanitizeProduct(product) {
  return {
    sku: String(product.sku || "").trim(),
    name: String(product.name || "").trim(),
    category: String(product.category || "").trim(),
    price: Number(product.price) || 0,
    emoji: String(product.emoji || "💡").trim(),
    image: String(product.image || "").trim(),
    desc: String(product.desc || "").trim()
  };
}

export default {
  ValidationResult,
  validateProductName,
  validateProductPrice,
  validateProductCategory,
  validateProductSKU,
  validateProductImage,
  validateProductDescription,
  validateProductEmoji,
  validateProduct,
  sanitizeProduct
};

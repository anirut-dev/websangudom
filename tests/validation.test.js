// Tests for validation.js

import {
  validateProductName,
  validateProductPrice,
  validateProductCategory,
  validateProductSKU,
  validateProductImage,
  validateProductDescription,
  validateProductEmoji,
  validateProduct,
  sanitizeProduct,
  ValidationResult,
} from '../js/validation';

describe('ValidationResult', () => {
  test('creates valid result by default', () => {
    const result = new ValidationResult();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('creates invalid result with errors', () => {
    const result = new ValidationResult(false, [{ field: 'name', message: 'Required' }]);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });

  test('addError marks as invalid and adds error', () => {
    const result = new ValidationResult();
    result.addError('price', 'Must be positive');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({ field: 'price', message: 'Must be positive' });
  });

  test('getErrorMessage formats errors correctly', () => {
    const result = new ValidationResult();
    result.addError('name', 'Required');
    result.addError('price', 'Invalid');
    const message = result.getErrorMessage();
    expect(message).toContain('name: Required');
    expect(message).toContain('price: Invalid');
  });
});

describe('validateProductName', () => {
  test('accepts valid name', () => {
    const result = validateProductName('LED Bulb');
    expect(result.valid).toBe(true);
    expect(result.value).toBe('LED Bulb');
  });

  test('rejects empty name', () => {
    const result = validateProductName('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  test('rejects name too short', () => {
    const result = validateProductName('A');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  test('rejects name too long', () => {
    const result = validateProductName('A'.repeat(201));
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  test('trims whitespace', () => {
    const result = validateProductName('  LED Bulb  ');
    expect(result.valid).toBe(true);
    expect(result.value).toBe('LED Bulb');
  });
});

describe('validateProductPrice', () => {
  test('accepts valid price', () => {
    const result = validateProductPrice(99.99);
    expect(result.valid).toBe(true);
    expect(result.value).toBe(99.99);
  });

  test('rejects non-numeric price', () => {
    const result = validateProductPrice('abc');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  test('rejects zero price', () => {
    const result = validateProductPrice(0);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  test('rejects negative price', () => {
    const result = validateProductPrice(-50);
    expect(result.valid).toBe(false);
  });

  test('rejects price too large', () => {
    const result = validateProductPrice(999999999.99);
    expect(result.valid).toBe(false);
  });

  test('accepts two decimal places', () => {
    const result = validateProductPrice(99.99);
    expect(result.valid).toBe(true);
  });

  test('rejects more than two decimals', () => {
    const result = validateProductPrice(99.999);
    expect(result.valid).toBe(false);
  });
});

describe('validateProductCategory', () => {
  test('accepts valid category', () => {
    const result = validateProductCategory('LED');
    expect(result.valid).toBe(true);
    expect(result.value).toBe('LED');
  });

  test('rejects empty category', () => {
    const result = validateProductCategory('');
    expect(result.valid).toBe(false);
  });

  test('validates against whitelist', () => {
    const valid = validateProductCategory('LED', ['LED', 'Bulb']);
    expect(valid.valid).toBe(true);

    const invalid = validateProductCategory('Invalid', ['LED', 'Bulb']);
    expect(invalid.valid).toBe(false);
  });

  test('trims whitespace', () => {
    const result = validateProductCategory('  LED  ');
    expect(result.valid).toBe(true);
    expect(result.value).toBe('LED');
  });
});

describe('validateProductSKU', () => {
  test('accepts valid SKU', () => {
    const result = validateProductSKU('LED-001');
    expect(result.valid).toBe(true);
  });

  test('allows empty SKU (optional)', () => {
    const result = validateProductSKU('');
    expect(result.valid).toBe(true);
    expect(result.value).toBe('');
  });

  test('rejects SKU too long', () => {
    const result = validateProductSKU('A'.repeat(51));
    expect(result.valid).toBe(false);
  });

  test('rejects invalid characters in SKU', () => {
    const result = validateProductSKU('LED@001');
    expect(result.valid).toBe(false);
  });

  test('accepts alphanumeric, dash, underscore', () => {
    const result = validateProductSKU('LED_001-v2');
    expect(result.valid).toBe(true);
  });
});

describe('validateProductImage', () => {
  test('accepts valid URL', () => {
    const result = validateProductImage('https://example.com/image.jpg');
    expect(result.valid).toBe(true);
  });

  test('allows empty URL (optional)', () => {
    const result = validateProductImage('');
    expect(result.valid).toBe(true);
  });

  test('rejects invalid URL format', () => {
    const result = validateProductImage('not-a-url');
    expect(result.valid).toBe(false);
  });

  test('warns about untrusted hosts', () => {
    const result = validateProductImage('https://untrusted.com/image.jpg');
    expect(result.valid).toBe(true); // Still valid, just warns
  });
});

describe('validateProductDescription', () => {
  test('accepts valid description', () => {
    const result = validateProductDescription('High quality LED bulb');
    expect(result.valid).toBe(true);
  });

  test('allows empty description (optional)', () => {
    const result = validateProductDescription('');
    expect(result.valid).toBe(true);
  });

  test('rejects description too long', () => {
    const result = validateProductDescription('A'.repeat(2001));
    expect(result.valid).toBe(false);
  });
});

describe('validateProductEmoji', () => {
  test('accepts valid emoji', () => {
    const result = validateProductEmoji('💡');
    expect(result.valid).toBe(true);
  });

  test('defaults to 💡', () => {
    const result = validateProductEmoji('');
    expect(result.value).toBe('💡');
  });

  test('rejects emoji string too long', () => {
    const result = validateProductEmoji('A'.repeat(11));
    expect(result.valid).toBe(false);
  });
});

describe('validateProduct', () => {
  const validProduct = {
    name: 'LED Bulb',
    price: 99.99,
    category: 'LED',
    sku: 'LED-001',
    image: 'https://example.com/image.jpg',
    desc: 'High quality',
    emoji: '💡',
  };

  test('validates complete valid product', () => {
    const result = validateProduct(validProduct);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('catches multiple validation errors', () => {
    const invalid = {
      name: '', // Invalid
      price: -50, // Invalid
      category: '', // Invalid
    };
    const result = validateProduct(invalid);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('validates against whitelist categories', () => {
    const result = validateProduct(validProduct, ['LED', 'Bulb']);
    expect(result.isValid).toBe(true);
  });

  test('rejects invalid category from whitelist', () => {
    const result = validateProduct(validProduct, ['OTHER']);
    expect(result.isValid).toBe(false);
  });
});

describe('sanitizeProduct', () => {
  test('trims and normalizes product data', () => {
    const input = {
      name: '  LED Bulb  ',
      price: '99.99',
      category: '  LED  ',
      emoji: '💡 ',
    };
    const result = sanitizeProduct(input);
    expect(result.name).toBe('LED Bulb');
    expect(result.category).toBe('LED');
    expect(result.emoji).toBe('💡');
  });

  test('converts price to number', () => {
    const input = {
      name: 'Bulb',
      price: '99.99',
      category: 'LED',
    };
    const result = sanitizeProduct(input);
    expect(typeof result.price).toBe('number');
    expect(result.price).toBe(99.99);
  });

  test('provides defaults for optional fields', () => {
    const input = {
      name: 'Bulb',
      price: '99',
      category: 'LED',
    };
    const result = sanitizeProduct(input);
    expect(result.emoji).toBe('💡'); // Default
    expect(result.sku).toBe(''); // Empty default
    expect(result.image).toBe(''); // Empty default
    expect(result.desc).toBe(''); // Empty default
  });
});

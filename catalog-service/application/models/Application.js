const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function(v) {
        return v >= 0 && Number.isFinite(v);
      },
      message: 'Price must be a valid positive number'
    }
  },
  
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative'],
    validate: {
      validator: function(v) {
        return v === null || v === undefined || (v >= 0 && Number.isFinite(v));
      },
      message: 'Original price must be a valid positive number'
    }
  },
  
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    lowercase: true,
    enum: {
      values: [
        'electronics',
        'laptops',
        'smartphones',
        'tablets',
        'headphones',
        'cameras',
        'gaming',
        'accessories',
        'home',
        'kitchen',
        'books',
        'fashion',
        'sports',
        'health',
        'beauty',
        'toys',
        'automotive'
      ],
      message: 'Category must be one of the predefined values'
    }
  },
  
  subcategory: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
    maxlength: [100, 'Brand name cannot exceed 100 characters']
  },
  
  model: {
    type: String,
    trim: true,
    maxlength: [100, 'Model name cannot exceed 100 characters']
  },
  
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5'],
    validate: {
      validator: function(v) {
        return v >= 0 && v <= 5 && Number.isFinite(v);
      },
      message: 'Rating must be between 0 and 5'
    }
  },
  
  reviewCount: {
    type: Number,
    default: 0,
    min: [0, 'Review count cannot be negative']
  },
  
  // Technical specifications
  specifications: {
    // Electronics specific
    battery: {
      type: String,
      trim: true
    },
    storage: {
      type: String,
      trim: true
    },
    memory: {
      type: String,
      trim: true
    },
    processor: {
      type: String,
      trim: true
    },
    displaySize: {
      type: String,
      trim: true
    },
    operatingSystem: {
      type: String,
      trim: true
    },
    
    // Physical specifications
    weight: {
      type: String,
      trim: true
    },
    dimensions: {
      type: String,
      trim: true
    },
    color: {
      type: String,
      trim: true,
      lowercase: true
    },
    
    // General specifications
    warranty: {
      type: String,
      trim: true
    },
    
    // Custom specifications (flexible)
    custom: {
      type: Map,
      of: String,
      default: new Map()
    }
  },
  
  // Product images
  images: [{
    url: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Image URL must be a valid HTTP/HTTPS URL'
      }
    },
    alt: {
      type: String,
      trim: true,
      maxlength: [200, 'Image alt text cannot exceed 200 characters']
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  // Inventory
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  
  inStock: {
    type: Boolean,
    default: true
  },
  
  // Product status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  isOnSale: {
    type: Boolean,
    default: false
  },
  
  // SEO and search
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Metadata
  createdBy: {
    type: String,
    default: 'system'
  },
  
  updatedBy: {
    type: String,
    default: 'system'
  }
  
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for better query performance
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ brand: 1 });
productSchema.index({ isActive: 1, inStock: 1 });
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ 
  name: 'text', 
  description: 'text', 
  brand: 'text', 
  'tags': 'text' 
}, {
  weights: {
    name: 10,
    brand: 5,
    tags: 3,
    description: 1
  },
  name: 'product_text_index'
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0] || null;
});

// Pre-save middleware
productSchema.pre('save', function(next) {
  // Generate slug if not provided
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  // Update inStock based on stock quantity
  this.inStock = this.stock > 0;
  
  // Set isOnSale if there's a discount
  if (this.originalPrice && this.originalPrice > this.price) {
    this.isOnSale = true;
  }
  
  // Ensure at least one image is primary
  if (this.images && this.images.length > 0) {
    const hasPrimary = this.images.some(img => img.isPrimary);
    if (!hasPrimary) {
      this.images[0].isPrimary = true;
    }
  }
  
  next();
});

// Static methods
productSchema.statics.findByCategory = function(category) {
  return this.find({ 
    category: new RegExp(category, 'i'), 
    isActive: true 
  });
};

productSchema.statics.findInPriceRange = function(minPrice, maxPrice) {
  return this.find({ 
    price: { $gte: minPrice, $lte: maxPrice },
    isActive: true 
  });
};

productSchema.statics.findFeatured = function() {
  return this.find({ 
    isFeatured: true, 
    isActive: true,
    inStock: true 
  });
};

productSchema.statics.searchProducts = function(searchTerm) {
  return this.find(
    { 
      $text: { $search: searchTerm },
      isActive: true 
    },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } });
};

// Instance methods
productSchema.methods.updateStock = function(quantity) {
  this.stock = Math.max(0, quantity);
  this.inStock = this.stock > 0;
  return this.save();
};

productSchema.methods.addToStock = function(quantity) {
  this.stock += quantity;
  this.inStock = this.stock > 0;
  return this.save();
};

productSchema.methods.removeFromStock = function(quantity) {
  this.stock = Math.max(0, this.stock - quantity);
  this.inStock = this.stock > 0;
  return this.save();
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

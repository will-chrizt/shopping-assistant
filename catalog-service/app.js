const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { body, query, param, validationResult } = require('express-validator');
require('dotenv').config();

// Import models
const Product = require('./models/Product');
const { seedDatabase } = require('./utils/seedData');

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, process.env.AI_SERVICE_URL] 
    : true,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 
      `mongodb://${process.env.MONGODB_HOST || 'localhost'}:${process.env.MONGODB_PORT || 27017}/${process.env.MONGODB_DATABASE || 'shopping_assistant'}`;
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connected successfully');
    
    // Seed database if in development
    if (process.env.NODE_ENV !== 'production' || process.env.SEED_DATABASE === 'true') {
      await seedDatabase();
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'catalog-service',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Catalog Service',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      products: '/products',
      productById: '/products/:id',
      productReviews: '/products/:id/reviews',
      categories: '/categories',
      search: '/products?search=term',
      health: '/health'
    }
  });
});

// GET /products - List and filter products
app.get('/products', [
  query('category').optional().isString().trim(),
  query('minPrice').optional().isNumeric(),
  query('maxPrice').optional().isNumeric(),
  query('minRating').optional().isNumeric().isFloat({ min: 0, max: 5 }),
  query('search').optional().isString().trim(),
  query('sortBy').optional().isIn(['price', 'rating', 'name', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('page').optional().isInt({ min: 1 })
], validateRequest, async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      minRating,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 20,
      page = 1
    } = req.query;

    // Build query
    let query = {};

    if (category) {
      query.category = new RegExp(category, 'i');
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { category: new RegExp(search, 'i') }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await Product.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      filters: {
        category,
        minPrice,
        maxPrice,
        minRating,
        search
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch products'
    });
  }
});

// GET /products/:id - Get single product
app.get('/products/:id', [
  param('id').isMongoId().withMessage('Invalid product ID')
], validateRequest, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    
    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        message: `Product with ID ${req.params.id} does not exist`
      });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch product'
    });
  }
});

// GET /products/:id/reviews - Get product reviews
app.get('/products/:id/reviews', [
  param('id').isMongoId().withMessage('Invalid product ID'),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('rating').optional().isInt({ min: 1, max: 5 })
], validateRequest, async (req, res) => {
  try {
    const { limit = 10, rating } = req.query;
    
    // Check if product exists
    const product = await Product.findById(req.params.id).select('name').lean();
    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        message: `Product with ID ${req.params.id} does not exist`
      });
    }

    // Generate mock reviews based on product ID and rating
    const reviews = generateMockReviews(req.params.id, product.name, parseInt(limit), rating ? parseInt(rating) : null);

    res.json({
      productId: req.params.id,
      productName: product.name,
      totalReviews: reviews.length,
      reviews
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch reviews'
    });
  }
});

// GET /categories - Get all categories
app.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const count = await Product.countDocuments({ category });
        return { name: category, count };
      })
    );

    res.json({
      categories: categoriesWithCount,
      totalCategories: categories.length
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch categories'
    });
  }
});

// Mock review generator
function generateMockReviews(productId, productName, limit = 10, filterRating = null) {
  const reviews = [];
  const reviewTemplates = [
    {
      rating: 5,
      templates: [
        "Excellent product! Highly recommended for anyone looking for quality.",
        "Outstanding value for money. Exceeded my expectations in every way.",
        "Perfect! Exactly what I was looking for. Great build quality.",
        "Amazing product with great features. Very satisfied with my purchase.",
        "Top-notch quality and excellent customer service. Five stars!"
      ]
    },
    {
      rating: 4,
      templates: [
        "Good product overall. Minor issues but generally satisfied.",
        "Great value for the price. Would recommend to others.",
        "Solid product with good features. Only minor complaints.",
        "Very good quality. Works as expected with no major issues.",
        "Happy with my purchase. Good product for the price point."
      ]
    },
    {
      rating: 3,
      templates: [
        "Average product. Does the job but nothing special.",
        "Okay quality. Some features could be improved.",
        "Decent product but has room for improvement.",
        "It's alright. Meets basic requirements but could be better.",
        "Fair product. Works fine but not outstanding."
      ]
    },
    {
      rating: 2,
      templates: [
        "Disappointed with the quality. Expected better for the price.",
        "Has some issues that need to be addressed.",
        "Not great. Several problems encountered during use.",
        "Below average quality. Would not recommend.",
        "Poor value for money. Many better alternatives available."
      ]
    },
    {
      rating: 1,
      templates: [
        "Terrible product. Complete waste of money.",
        "Very poor quality. Broke after minimal use.",
        "Worst purchase I've made. Avoid at all costs.",
        "Absolutely horrible. Does not work as advertised.",
        "Extremely disappointed. Requesting a refund."
      ]
    }
  ];

  const reviewers = [
    'Alex Johnson', 'Sarah Miller', 'Mike Brown', 'Emily Davis', 'John Wilson',
    'Jessica Garcia', 'David Martinez', 'Lisa Anderson', 'Ryan Thompson', 'Amanda White',
    'Chris Lee', 'Jennifer Taylor', 'Mark Robinson', 'Laura Clark', 'Kevin Lewis'
  ];

  // Generate deterministic but varied reviews
  const seed = productId.slice(-8);
  let randomIndex = parseInt(seed, 16);

  for (let i = 0; i < limit; i++) {
    // Generate rating (weighted towards higher ratings)
    const ratingWeights = [0.05, 0.1, 0.15, 0.3, 0.4]; // 1-5 stars probability
    let rating = 5;
    const ratingRand = (randomIndex % 100) / 100;
    let cumulative = 0;
    
    for (let r = 0; r < ratingWeights.length; r++) {
      cumulative += ratingWeights[r];
      if (ratingRand <= cumulative) {
        rating = r + 1;
        break;
      }
    }

    // Filter by rating if specified
    if (filterRating && rating !== filterRating) {
      randomIndex = (randomIndex * 1103515245 + 12345) & 0x7fffffff;
      continue;
    }

    const ratingTemplates = reviewTemplates.find(rt => rt.rating === rating);
    const templateIndex = randomIndex % ratingTemplates.templates.length;
    const reviewerIndex = (randomIndex + i) % reviewers.length;

    // Generate date (within last 6 months)
    const daysAgo = randomIndex % 180;
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() - daysAgo);

    reviews.push({
      id: `review_${productId}_${i}`,
      rating,
      comment: ratingTemplates.templates[templateIndex],
      reviewer: reviewers[reviewerIndex],
      date: reviewDate.toISOString(),
      verified: (randomIndex % 4) !== 0, // 75% verified purchases
      helpful: Math.max(0, (randomIndex % 20) - 5) // 0-15 helpful votes
    });

    randomIndex = (randomIndex * 1103515245 + 12345) & 0x7fffffff;
  }

  return reviews;
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Catalog Service running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📦 Products API: http://localhost:${PORT}/products`);
  });
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = app;

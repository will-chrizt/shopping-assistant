const Product = require('../models/Product');

const sampleProducts = [
  // Laptops
  {
    name: "MacBook Pro 16-inch M3 Pro",
    description: "Apple's most powerful laptop with M3 Pro chip, featuring exceptional performance for professional workflows, stunning 16-inch Liquid Retina XDR display, and all-day battery life.",
    price: 2499,
    originalPrice: 2699,
    category: "laptops",
    subcategory: "premium",
    brand: "Apple",
    model: "MacBook Pro 16",
    rating: 4.8,
    reviewCount: 1247,
    specifications: {
      processor: "Apple M3 Pro chip",
      memory: "18GB Unified Memory",
      storage: "512GB SSD",
      displaySize: "16-inch",
      battery: "Up to 22 hours",
      operatingSystem: "macOS",
      weight: "2.16 kg",
      color: "space gray"
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
        alt: "MacBook Pro 16-inch front view",
        isPrimary: true
      }
    ],
    stock: 25,
    isFeatured: true,
    tags: ["professional", "creative", "programming", "video-editing"]
  },
  
  {
    name: "Dell XPS 13 Developer Edition",
    description: "Ultra-portable laptop with Ubuntu pre-installed, perfect for developers and professionals who need powerful performance in a compact form factor.",
    price: 1299,
    originalPrice: 1499,
    category: "laptops",
    subcategory: "ultrabook",
    brand: "Dell",
    model: "XPS 13",
    rating: 4.6,
    reviewCount: 892,
    specifications: {
      processor: "Intel Core i7-1360P",
      memory: "16GB LPDDR5",
      storage: "512GB SSD",
      displaySize: "13.4-inch",
      battery: "Up to 12 hours",
      operatingSystem: "Ubuntu 22.04 LTS",
      weight: "1.24 kg",
      color: "platinum silver"
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800",
        alt: "Dell XPS 13 laptop",
        isPrimary: true
      }
    ],
    stock: 18,
    isFeatured: true,
    tags: ["developer", "linux", "ultraportable", "business"]
  },

  {
    name: "Lenovo ThinkPad X1 Carbon Gen 11",
    description: "Business-grade ultrabook with military-grade durability, exceptional keyboard, and enterprise security features. Perfect for professionals on the go.",
    price: 1899,
    category: "laptops",
    subcategory: "business",
    brand: "Lenovo",
    model: "ThinkPad X1 Carbon",
    rating: 4.7,
    reviewCount: 634,
    specifications: {
      processor: "Intel Core i7-1355U",
      memory: "16GB LPDDR5",
      storage: "1TB SSD",
      displaySize: "14-inch",
      battery: "Up to 15 hours",
      operatingSystem: "Windows 11 Pro",
      weight: "1.12 kg",
      color: "black"
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800",
        alt: "Lenovo ThinkPad laptop",
        isPrimary: true
      }
    ],
    stock: 12,
    tags: ["business", "durable", "security", "enterprise"]
  },

  // Smartphones
  {
    name: "iPhone 15 Pro Max",
    description: "Apple's flagship smartphone with titanium design, A17 Pro chip, advanced camera system with 5x optical zoom, and USB-C connectivity.",
    price: 1199,
    category: "smartphones",
    subcategory: "flagship",
    brand: "Apple",
    model: "iPhone 15 Pro Max",
    rating: 4.9,
    reviewCount: 2156,
    specifications: {
      processor: "A17 Pro chip",
      memory: "8GB",
      storage: "256GB",
      displaySize: "6.7-inch",
      battery: "Up to 29 hours video playback",
      operatingSystem: "iOS 17",
      weight: "221g",
      color: "natural titanium"
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800",

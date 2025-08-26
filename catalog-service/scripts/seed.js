// scripts/seed.js - Standalone seed script
const mongoose = require('mongoose');
const { seedDatabase } = require('../utils/seedData');
require('dotenv').config();

const connectAndSeed = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 
      `mongodb://${process.env.MONGODB_HOST || 'localhost'}:${process.env.MONGODB_PORT || 27017}/${process.env.MONGODB_DATABASE || 'shopping_assistant'}`;
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    await seedDatabase();
    
    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
};

connectAndSeed();

// ==========================================

// scripts/clearDb.js - Clear database script
const mongoose = require('mongoose');
const { clearDatabase } = require('../utils/seedData');
require('dotenv').config();

const connectAndClear = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 
      `mongodb://${process.env.MONGODB_HOST || 'localhost'}:${process.env.MONGODB_PORT || 27017}/${process.env.MONGODB_DATABASE || 'shopping_assistant'}`;
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('Are you sure you want to clear all products? (yes/no): ', async (answer) => {
      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        await clearDatabase();
        console.log('Database cleared successfully');
      } else {
        console.log('Operation cancelled');
      }
      
      readline.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error during clearing:', error);
    process.exit(1);
  }
};

connectAndClear();

// ==========================================

// scripts/updateProducts.js - Update products script
const mongoose = require('mongoose');
const { updateSampleData } = require('../utils/seedData');
require('dotenv').config();

const connectAndUpdate = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 
      `mongodb://${process.env.MONGODB_HOST || 'localhost'}:${process.env.MONGODB_PORT || 27017}/${process.env.MONGODB_DATABASE || 'shopping_assistant'}`;
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    await updateSampleData();
    
    console.log('Products updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during update:', error);
    process.exit(1);
  }
};

connectAndUpdate();

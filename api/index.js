// api/index.js - Vercel serverless function entry point
require('dotenv').config();

// Import the Express app
const app = require('../dist/app.js').default || require('../dist/app.js');

// Export for Vercel serverless functions
module.exports = app;
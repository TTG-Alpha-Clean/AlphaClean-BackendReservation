// api/index.ts - Vercel serverless function entry point
import "dotenv/config";
import app from "../app";

// Export the Express app for Vercel serverless functions
export default app;
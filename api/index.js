// Vercel serverless function entry point
const handler = require('../dist/main.js').default;
module.exports = handler;


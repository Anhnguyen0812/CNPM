require('dotenv').config();
const app = require('./app');

// Set port explicitly to 5000, ignoring any environment variables
const PORT = 5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
});
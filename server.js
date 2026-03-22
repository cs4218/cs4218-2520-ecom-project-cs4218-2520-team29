import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import connectDB from './config/db.js';

// Configure env
dotenv.config();

// Database connection
//if (process.env.NODE_ENV !== "test") {
connectDB();
//}

// Create Express app
const app = express();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
import authRoute from './routes/authRoute.js';
import productRoute from './routes/productRoutes.js';
import categoryRoute from './routes/categoryRoutes.js';

app.use('/api/v1/auth', authRoute);
app.use('/api/v1/product', productRoute);
app.use('/api/v1/category', categoryRoute);

// Export app for testing
export default app;

// Only start server if NODE_ENV is not 'test'
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 6060;
  app.listen(PORT, () => {
    console.log(
      `Server running on ${process.env.DEV_MODE} mode on ${PORT}`.bgCyan.white
    );
  });
}
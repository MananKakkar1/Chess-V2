import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import chessMoveRoutes from './routes/chessMoves.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/chess', chessMoveRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Chess API is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

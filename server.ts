import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { authenticateJWT, AuthRequest } from './src/middleware/authMiddleware';
import authRoutes from './src/routes/authRoutes';
import { connectDB } from './src/config/db';
import { initRedis } from './src/config/redis';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get("/api/profile", authenticateJWT, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});



const startServer = async () => {
  try {
    await connectDB();
    await initRedis();
    
    const PORT = process.env.PORT;
    app.listen(PORT, () => console.log(`🚀 Serveur lancé sur le port ${PORT}`));
  } catch (err) {
    console.error('❌ Erreur au démarrage du serveur:', err);
    process.exit(1);
  }
};

startServer();
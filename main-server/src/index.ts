import express, { Express, Request, Response } from 'express';
import router from './routes/index';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDb } from './configs/db';
import { envs } from './configs';

connectDb();

const app: Express = express();
app.use(express.json());
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:3001',
      'https://vidmux.vercel.app',
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }),
);

// Handle preflight requests
app.options(
  '*',
  cors({
    origin: ['http://localhost:5173'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(cookieParser());

app.get('/', (req: Request, res: Response) => {
  res.send('vibes API');
});

app.use('/api', router);

const port = envs.port;
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { cors } from 'cors';
import { config } from './config.js';
import { setupRoutes } from './routes.js';
import { setupSocket } from './socket.js';
const app = express();
const server = createServer(app);

import { config } from 'dotenv';
config();

//? Ensure __dirname is defined for ESM SSR evaluation (Vite) before importing modules that rely on it.
import './shims/dirname-shim';

import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import EmployeeRouter from './routes/Employee.route';
import LeaveRouter from './routes/Leave.route';
import LeaveBalanceRouter from './routes/LeaveBalance.route';
import PrismaService from './services/prisma.service';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

//* Middleware for parsing JSON
app.use(express.json());

//* Corss middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Content-Length, X-Requested-With'
  );

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

//* API Routes
app.use('/api', EmployeeRouter);
app.use('/api', LeaveRouter);
app.use('/api', LeaveBalanceRouter);

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  })
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/*
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  //* For Ctrl+C event
  console.info('Shutting down gracefully...');
  await PrismaService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  //* For termination event
  console.info('Shutting down gracefully...');
  await PrismaService.disconnect();
  process.exit(0);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);

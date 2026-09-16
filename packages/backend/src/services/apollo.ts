import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { prisma } from './database';
import { Context } from './context';
import { resolvers } from '../resolvers';

import { readFileSync } from 'fs'; // Node.js module to read files
import path from 'path'; // Node.js module to handle file paths reliably

const typeDefs = readFileSync(path.join(__dirname, '../../schema.graphql'), {
  encoding: 'utf-8',
});

// Which browser origins may call this API.
//
// This is deliberately NOT `startStandaloneServer`. That helper hardcodes
// `cors()` with no arguments — Access-Control-Allow-Origin: * — and accepts no
// CORS option at all, so there is no way to restrict it there. Express +
// expressMiddleware is Apollo's documented path for controlling CORS.
//
// Set CORS_ORIGIN on the host to a comma-separated list of frontend origins:
//   CORS_ORIGIN=https://vision2035.thetipiraisers.org
//   CORS_ORIGIN=https://vision2035.thetipiraisers.org,https://staging.example.org
//
// An origin is scheme + host + port with no trailing path, so
// "https://example.org" — not "https://example.org/".
function corsOptions(): cors.CorsOptions {
  const configured = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

  if (configured.length > 0) {
    return { origin: configured };
  }

  // Unset. In production this is a real gap, but refusing to boot would take
  // a live site down over a config omission — so warn loudly in the host's
  // logs instead and keep serving.
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[cors] CORS_ORIGIN is not set — every origin is allowed. ' +
        'Set it to the frontend URL (e.g. https://vision2035.thetipiraisers.org) ' +
        'so other sites cannot call this API from their visitors\' browsers.'
    );
  }
  return { origin: true };
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
    // Lets in-flight requests finish when the host sends SIGTERM during a
    // deploy, instead of cutting them off mid-response.
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  app.use(
    '/',
    cors(corsOptions()),
    express.json({ limit: '50mb' }),
    expressMiddleware(server, {
      context: async () => ({ prisma }),
    })
  );

  // Production hosts (Render/Fly/Railway) inject the port via the PORT env var;
  // fall back to 4000 for local dev where the frontend expects localhost:4000.
  const port = Number(process.env.PORT) || 4000;
  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));

  const allowed = process.env.CORS_ORIGIN?.trim();
  console.log(`Server ready at: http://localhost:${port}/`);
  console.log(`CORS allowed origins: ${allowed ? allowed : '(all — CORS_ORIGIN not set)'}`);
}

startServer();

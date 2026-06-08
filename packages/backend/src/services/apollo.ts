import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { prisma } from './database';
import { Context } from './context';
import { resolvers } from '../resolvers'; 

import { readFileSync } from 'fs'; // Node.js module to read files
import path from 'path'; // Node.js module to handle file paths reliably

const typeDefs = readFileSync(path.join(__dirname, '../../schema.graphql'), {
  encoding: 'utf-8',
});
const server = new ApolloServer<Context>({
  typeDefs,
  resolvers,
});

async function startServer (){
// Production hosts (Render/Fly/Railway) inject the port via the PORT env var;
// fall back to 4000 for local dev where the frontend expects localhost:4000.
const port = Number(process.env.PORT) || 4000;
const { url } = await startStandaloneServer(server, {
  context: async () => ({
    prisma: prisma,
  }),
  listen: { port },
});

console.log(`Server ready at: ${ url }`)
}

startServer();
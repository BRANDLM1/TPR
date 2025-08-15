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
const { url } = await startStandaloneServer(server, {
  context: async () => ({
    prisma: prisma,
  }),
  listen: { port: 4000 },
});

console.log(`Server ready at: ${ url }`)
}

startServer();
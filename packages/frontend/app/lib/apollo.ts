import { ApolloClient, InMemoryCache } from "@apollo/client";

export const client = new ApolloClient({
  // uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT,
  uri: "http://localhost:4000/", 
  cache: new InMemoryCache(),
});
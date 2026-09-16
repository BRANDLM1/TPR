import { ApolloClient, InMemoryCache } from "@apollo/client";

const DEFAULT_ENDPOINT = "http://localhost:4000/";

// Validate rather than trusting the env var verbatim. A misconfigured
// NEXT_PUBLIC_GRAPHQL_ENDPOINT (an empty string, a stray placeholder, a
// variable name pasted instead of its value) is still truthy, so a plain
// `?? DEFAULT` would sail past it and bake the bad value into the bundle —
// every query then resolves against the page origin and 404s, with no clue
// as to why. Next.js inlines NEXT_PUBLIC_* at build time, so a bad value is
// frozen into the deployed JS: it has to be caught here or not at all.
function resolveEndpoint(): string {
  const raw = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT?.trim();
  if (!raw) return DEFAULT_ENDPOINT;

  try {
    // Absolute URL — the normal production case.
    return new URL(raw).toString();
  } catch {
    // Same-origin paths ("/graphql") are legitimate behind a proxy.
    if (raw.startsWith("/")) return raw;

    console.error(
      `[apollo] NEXT_PUBLIC_GRAPHQL_ENDPOINT is not a usable URL: "${raw}". ` +
        `Expected an absolute URL (https://api.example.org/) or a same-origin ` +
        `path (/graphql). Falling back to ${DEFAULT_ENDPOINT}.`
    );
    return DEFAULT_ENDPOINT;
  }
}

const uri = resolveEndpoint();

export const client = new ApolloClient({
  uri,
  cache: new InMemoryCache(),
});

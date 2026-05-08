# @squareexp/idp-sdk

TypeScript SDK for integrating web apps and Node services with Base IDP.

## Install

```bash
npm install @squareexp/idp-sdk
```

## Credential Source

Get credentials from Base client registration (admin flow), not from local guesses.
Use the registered:
- `client_id`
- optional `client_secret` (server-side only)
- exact redirect URI
- scope list

## Environment

Server-side:

```env
BASE_IDP_ISSUER=https://authlayer.squareexp.com
BASE_IDP_CLIENT_ID=<your-client-id>
BASE_IDP_CLIENT_SECRET=<your-client-secret-if-confidential>
BASE_IDP_REDIRECT_URI=<exact-registered-callback-url>
BASE_IDP_SCOPES="openid profile <product>:read <product>:write"
BASE_IDP_REQUIRED_SCOPE=<product>:read
BASE_IDP_AUDIENCE=square-experience
```

Vite/browser-safe:

```env
VITE_BASE_IDP_ISSUER=https://authlayer.squareexp.com
VITE_BASE_IDP_CLIENT_ID=<public-client-id>
VITE_BASE_IDP_REDIRECT_URI=<exact-registered-callback-url>
VITE_BASE_IDP_SCOPES="openid profile <product>:read"
```

Never expose `BASE_IDP_CLIENT_SECRET` in browser bundles.

## React Login Button

```tsx
import { createReactSquareAuth } from "@squareexp/idp-sdk/react";

const auth = createReactSquareAuth({
  issuer: "https://authlayer.squareexp.com",
  clientId: "crm-web",
  redirectUri: "https://crm.squareexp.com/auth/square/callback",
  scopes: "openid profile crm:read crm:write",
});

export function LoginButton() {
  return <button {...auth.buttonProps({ state: "/dashboard" })}>Continue with Square</button>;
}
```

## Next.js App Router

```ts
import { createNextSquareAuth } from "@squareexp/idp-sdk/next";

const square = createNextSquareAuth({
  issuer: process.env.BASE_IDP_ISSUER!,
  clientId: process.env.BASE_IDP_CLIENT_ID!,
  clientSecret: process.env.BASE_IDP_CLIENT_SECRET!,
  redirectUri: process.env.BASE_IDP_REDIRECT_URI!,
  scopes: process.env.BASE_IDP_SCOPES!,
  requiredScope: "crm:read",
});

export const GET = square.login;
```

Callback route:

```ts
export const GET = square.callback;
```

## Express/Nest Route Protection

```ts
import { createExpressMiddleware, squareConfigFromNodeEnv } from "@squareexp/idp-sdk/node";

const requireSquareAuth = createExpressMiddleware(squareConfigFromNodeEnv(), {
  requiredScope: "crm:read",
  attachUser: true,
});
```

## Server Token Verification

```ts
import { SquareIdPServerClient } from "@squareexp/idp-sdk/server";

const square = new SquareIdPServerClient({
  issuer: process.env.BASE_IDP_ISSUER!,
  clientId: process.env.BASE_IDP_CLIENT_ID!,
  redirectUri: process.env.BASE_IDP_REDIRECT_URI!,
  scopes: process.env.BASE_IDP_SCOPES!,
  requiredScope: "crm:read",
});

const principal = await square.verifyAccessToken(accessToken);
```

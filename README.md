# @squareexp/base-idp

TypeScript SDK for integrating web apps and Node services with Base IDP.

## Install

```bash
npm install @squareexp/base-idp
```

## Credential Source

Get credentials from Base client registration (admin flow), not from local guesses.
Use the registered:
- `client_id`
- optional `client_secret` (server-side only)
- exact redirect URI
- scope list
- `allowed_auth_methods`
- `requested_claims`

## Fast Init

The SDK ships with a bootstrap command that prints the env block and registration payload for a client, and can optionally POST the registration to Base:

```bash
npx base-idp init \
  --client-id console-gateway \
  --display-name "Base Console" \
  --product console \
  --app-domain console.cloud.squareexp.com \
  --redirect-uri http://localhost:3010/api/auth/callback \
  --allowed-redirect-uris http://localhost:3010/api/auth/callback \
  --allowed-origins http://localhost:3010 \
  --allowed-scopes "openid profile console:manage" \
  --allowed-auth-methods password,magic_link \
  --requested-claims email,profile
```

Add `--post --admin-token <token>` to register directly through the Base admin API.

## Cloud Releases

This package is also emitted as a release artifact when we cut an SDK release.
The release bundle contains the packed npm tarball plus matching Go, Rust, and Laravel artifacts for the same Base IdP version.

To generate the local release bundle:

```bash
./scripts/release-base-idp-sdks.sh sdk-v1.0.0
```

To download a published bundle:

```bash
gh release download sdk-v1.0.0 --repo <owner>/<repo>
```

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

`BASE_IDP_SECRET` is still accepted by the runtime as a legacy alias, but `BASE_IDP_CLIENT_SECRET` is the preferred env name.

Vite/browser-safe:

```env
VITE_BASE_IDP_ISSUER=https://authlayer.squareexp.com
VITE_BASE_IDP_CLIENT_ID=<public-client-id>
VITE_BASE_IDP_REDIRECT_URI=<exact-registered-callback-url>
VITE_BASE_IDP_SCOPES="openid profile <product>:read"
```

Never expose `BASE_IDP_CLIENT_SECRET` in browser bundles.

## Server-Side Backend Wiring

Use these surfaces when your app server talks to Base:

- `createNextBaseIdpAuth(...)` for Next.js App Router login and callback handlers
- `BaseIdpServerClient` for direct token exchange, refresh, and verification
- `createExpressMiddleware(...)` for Express / raw `http` route protection
- `createNestBaseIdpGuard(...)` for NestJS guards

If your service only needs to validate a bearer token, use the server client’s `verifyAccessToken(...)` method and keep the Base key + issuer in env. If the service also exchanges codes or refreshes tokens, provide the client secret too.

## React Login Button

```tsx
import { createReactBaseIdpAuth } from "@squareexp/base-idp/react";

const auth = createReactBaseIdpAuth({
  issuer: "https://authlayer.squareexp.com",
  clientId: "crm-web",
  redirectUri: "https://crm.squareexp.com/auth/square/callback",
  scopes: "openid profile crm:read crm:write",
});

export function LoginButton() {
  return <button {...auth.buttonProps({ state: "/dashboard" })}>Continue with Base IdP</button>;
}
```

## Next.js App Router

```ts
import { createNextBaseIdpAuth } from "@squareexp/base-idp/next";

const baseIdp = createNextBaseIdpAuth({
  issuer: process.env.BASE_IDP_ISSUER!,
  clientId: process.env.BASE_IDP_CLIENT_ID!,
  clientSecret: process.env.BASE_IDP_CLIENT_SECRET!,
  redirectUri: process.env.BASE_IDP_REDIRECT_URI!,
  scopes: process.env.BASE_IDP_SCOPES!,
  requiredScope: "crm:read",
});

export const GET = baseIdp.login;
```

Callback route:

```ts
export const GET = baseIdp.callback;
```

## Express/Nest Route Protection

```ts
import { createExpressMiddleware, baseIdpConfigFromNodeEnv } from "@squareexp/base-idp/node";

const requireBaseIdpAuth = createExpressMiddleware(baseIdpConfigFromNodeEnv(), {
  requiredScope: "crm:read",
  attachUser: true,
});
```

## Server Token Verification

```ts
import { BaseIdpServerClient } from "@squareexp/base-idp/server";

const baseIdp = new BaseIdpServerClient({
  issuer: process.env.BASE_IDP_ISSUER!,
  clientId: process.env.BASE_IDP_CLIENT_ID!,
  redirectUri: process.env.BASE_IDP_REDIRECT_URI!,
  scopes: process.env.BASE_IDP_SCOPES!,
  requiredScope: "crm:read",
});

const principal = await baseIdp.verifyAccessToken(accessToken);
```

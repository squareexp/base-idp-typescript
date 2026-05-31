import { BaseIdPServerClient } from "./server.js";
export function createSvelteKitBaseIdpAuth(config) {
    const client = new BaseIdPServerClient(config);
    return {
        client,
        loginLocation(event, defaultReturnTo = "/") {
            const returnTo = event.url.searchParams.get("return_to") ?? defaultReturnTo;
            return client.authorizeUrl({ state: returnTo });
        },
        async callback(event, codeVerifier) {
            const code = event.url.searchParams.get("code");
            if (!code)
                throw new Error("missing OAuth authorization code");
            const state = event.url.searchParams.get("state") ?? undefined;
            const tokens = await client.exchangeCode({ code, codeVerifier });
            const principal = await client.verifyAccessToken(tokens.access_token);
            return { tokens, principal, state };
        },
    };
}
//# sourceMappingURL=sveltekit.js.map
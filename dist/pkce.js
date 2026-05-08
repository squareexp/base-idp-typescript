import { base64UrlEncode, utf8Encode } from "./base64url.js";
const VERIFIER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
export async function generatePKCE(bytes = 48) {
    const random = new Uint8Array(bytes);
    crypto.getRandomValues(random);
    let verifier = "";
    for (const byte of random) {
        verifier += VERIFIER_CHARS[byte % VERIFIER_CHARS.length];
    }
    const input = utf8Encode(verifier);
    const digest = await crypto.subtle.digest("SHA-256", input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength));
    return {
        verifier,
        challenge: base64UrlEncode(new Uint8Array(digest)),
        method: "S256",
    };
}
//# sourceMappingURL=pkce.js.map
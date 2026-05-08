export type FetchLike = typeof fetch;
export type SquareIdPConfig = {
    issuer: string;
    clientId: string;
    redirectUri: string;
    scopes: string | string[];
    audience?: string;
    clientSecret?: string;
    requiredScope?: string;
    fetch?: FetchLike;
};
export type SquareIdentityMetadata = {
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
    paseto_public_key_endpoint: string;
    token_format: "paseto";
    paseto_purpose: "v4.public";
    grant_types_supported: string[];
    code_challenge_methods_supported?: string[];
    token_endpoint_auth_methods_supported?: string[];
};
export type SquarePublicKey = {
    kid: string;
    alg: "v4.public";
    kty: "OKP";
    crv: "Ed25519";
    public_key_base64: string;
    implicit_assertion?: string;
};
export type SquarePublicKeySet = {
    keys: SquarePublicKey[];
};
export type AuthorizeUrlOptions = {
    responseType?: "code";
    state?: string;
    nonce?: string;
    scopes?: string | string[];
    redirectUri?: string;
    codeChallenge?: string;
    codeChallengeMethod?: "S256";
};
export type TokenExchangeOptions = {
    code: string;
    codeVerifier?: string;
    redirectUri?: string;
};
export type RefreshOptions = {
    refreshToken: string;
    scopes?: string | string[];
};
export type TokenPair = {
    access_token: string;
    refresh_token: string;
    token_type: "PASETO" | string;
    expires_in: number;
    refresh_token_expires_at: string;
};
export type AccountContext = {
    kind: "client" | "student" | "developer" | "team" | "organization" | string;
    tenant_id?: string;
    actor_id?: string;
    owner_id?: string;
};
export type AccessClaims = {
    iss: string;
    sub: string;
    aud: string;
    exp: string;
    nbf: string;
    iat: string;
    jti: string;
    gid: string;
    email?: string;
    name?: string;
    token_use: "access" | string;
    sid: string;
    ctx: AccountContext;
    role: string;
    ent?: string[];
    ev?: string;
    aal: number;
    amr?: string[];
    azp?: string;
    scp?: string[];
};
export type VerifiedPrincipal = {
    id: string;
    subject: string;
    email?: string;
    name?: string;
    role: string;
    scopes: string[];
    accountContext: AccountContext;
    claims: AccessClaims;
};
export type VerifyAccessTokenOptions = {
    issuer?: string;
    audience?: string;
    requiredScope?: string;
    maxClockSkewSeconds?: number;
};
export type PKCEPair = {
    verifier: string;
    challenge: string;
    method: "S256";
};
//# sourceMappingURL=types.d.ts.map
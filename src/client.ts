import { idpError } from "./errors.js";
import type {
  AuthorizeUrlOptions,
  BaseIdPConfig,
  ClientConfigResponse,
  FetchLike,
  BaseIdpIdentityMetadata,
  RefreshOptions,
  ResolvedConfig,
  BaseIdpPublicKeySet,
  TokenExchangeOptions,
  TokenPair,
} from "./types.js";

export class BaseIdPClient {
  protected readonly cfg: Required<ResolvedConfig>;

  private metadataCache?: BaseIdpIdentityMetadata;
  private keyCache?: BaseIdpPublicKeySet;

  constructor(private readonly rawConfig: BaseIdPConfig) {
    if (!rawConfig.key) {
      throw idpError("invalid_config", "base key is required (set BASE_IDP_KEY)");
    }
    if (!rawConfig.issuer) {
      throw idpError("invalid_config", "issuer is required (set BASE_IDP_ISSUER)");
    }
    const fetcher = rawConfig.fetch ?? globalThis.fetch;
    if (!fetcher) {
      throw idpError("invalid_config", "fetch is required in this runtime");
    }
    this.cfg = {
      issuer: trimSlash(rawConfig.issuer),
      key: rawConfig.key,
      clientId: "",
      redirectUri: "",
      scopes: [],
      audience: "square-experience",
      fetch: fetcher as FetchLike,
      clientSecret: rawConfig.secret ?? "",
      confidential: false,
      allowedScopes: [],
      allowedAuthMethods: [],
      requiredScope: "",
    };
  }

  get issuer(): string {
    return this.cfg.issuer;
  }

  get clientId(): string {
    return this.cfg.clientId;
  }

  scopes(value: string | string[] = this.cfg.scopes): string[] {
    return Array.isArray(value) ? value.filter(Boolean) : value.split(/\s+/).filter(Boolean);
  }

  async resolveConfig(): Promise<ResolvedConfig> {
    if (this.cfg.clientId) return this.cfg;

    const response = await this.cfg.fetch(
      `${this.cfg.issuer}/v1/client-config?key=${encodeURIComponent(this.cfg.key)}`,
      { headers: { Accept: "application/json" } },
    );
    const payload = (await response.json().catch(() => ({}))) as ClientConfigResponse;
    if (!response.ok) {
      throw idpError("config_discovery_failed", "base idp: config discovery failed", response.status, payload);
    }

    this.cfg.issuer = trimSlash(payload.issuer);
    this.cfg.clientId = payload.client_id;
    this.cfg.confidential = payload.confidential;
    this.cfg.allowedScopes = payload.allowed_scopes;
    this.cfg.allowedAuthMethods = payload.allowed_auth_methods;
    if (!this.cfg.redirectUri && payload.allowed_redirect_uris.length > 0) {
      this.cfg.redirectUri = payload.allowed_redirect_uris[0];
    }
    if (this.cfg.scopes.length === 0 && payload.allowed_scopes.length > 0) {
      this.cfg.scopes = payload.allowed_scopes;
    }
    return this.cfg;
  }

  async discovery(force = false): Promise<BaseIdpIdentityMetadata> {
    if (this.metadataCache && !force) return this.metadataCache;

    const response = await this.cfg.fetch(`${this.cfg.issuer}/.well-known/square-identity`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw idpError("discovery_failed", "idp discovery endpoint rejected the request", response.status);
    }
    this.metadataCache = (await response.json()) as BaseIdpIdentityMetadata;
    return this.metadataCache;
  }

  async publicKeys(force = false): Promise<BaseIdpPublicKeySet> {
    if (this.keyCache && !force) return this.keyCache;

    const metadata = await this.discovery();
    const response = await this.cfg.fetch(metadata.paseto_public_key_endpoint, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw idpError("key_fetch_failed", "idp public-key endpoint rejected the request", response.status);
    }
    this.keyCache = (await response.json()) as BaseIdpPublicKeySet;
    return this.keyCache;
  }

  authorizeUrl(options: AuthorizeUrlOptions = {}): string {
    if (!this.cfg.clientId) {
      throw idpError("not_initialized", "client is not initialized; call resolveConfig() or await auto-init");
    }
    const url = new URL(`${this.cfg.issuer}/oauth2/authorize`);
    url.searchParams.set("response_type", options.responseType ?? "code");
    url.searchParams.set("client_id", this.cfg.clientId);
    url.searchParams.set("redirect_uri", options.redirectUri ?? this.cfg.redirectUri);
    url.searchParams.set("scope", this.scopes(options.scopes).join(" "));
    if (options.state) url.searchParams.set("state", options.state);
    if (options.nonce) url.searchParams.set("nonce", options.nonce);
    if (options.authSessionId) url.searchParams.set("auth_session_id", options.authSessionId);
    if (options.codeChallenge) {
      url.searchParams.set("code_challenge", options.codeChallenge);
      url.searchParams.set("code_challenge_method", options.codeChallengeMethod ?? "S256");
    }
    for (const [key, value] of Object.entries(options.additionalParameters ?? {})) {
      if (key && value) url.searchParams.set(key, value);
    }
    return url.toString();
  }

  async exchangeCode(options: TokenExchangeOptions): Promise<TokenPair> {
    if (!options.code) {
      throw idpError("invalid_request", "authorization code is required");
    }
    await this.resolveConfig();
    const metadata = await this.discovery();
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: options.code,
      client_id: this.cfg.clientId,
      redirect_uri: options.redirectUri ?? this.cfg.redirectUri,
    });
    if (this.cfg.clientSecret) body.set("client_secret", this.cfg.clientSecret);
    if (options.codeVerifier) body.set("code_verifier", options.codeVerifier);
    return this.postToken(metadata.token_endpoint, body);
  }

  async refresh(options: RefreshOptions): Promise<TokenPair> {
    if (!options.refreshToken) {
      throw idpError("invalid_request", "refresh token is required");
    }
    await this.resolveConfig();
    const metadata = await this.discovery();
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: options.refreshToken,
      client_id: this.cfg.clientId,
    });
    if (this.cfg.clientSecret) body.set("client_secret", this.cfg.clientSecret);
    if (options.scopes) body.set("scope", this.scopes(options.scopes).join(" "));
    return this.postToken(metadata.token_endpoint, body);
  }

  private async postToken(endpoint: string, body: URLSearchParams): Promise<TokenPair> {
    const response = await this.cfg.fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const payload = await response.json().catch(() => undefined);
    if (!response.ok) {
      throw idpError("token_exchange_failed", "idp token endpoint rejected the request", response.status, payload);
    }
    return payload as TokenPair;
  }
}

export { BaseIdPClient as BaseIdpClient };

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

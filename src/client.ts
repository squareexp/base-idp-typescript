import { idpError } from "./errors.js";
import type {
  AuthorizeUrlOptions,
  FetchLike,
  RefreshOptions,
  SquareIdPConfig,
  SquareIdentityMetadata,
  SquarePublicKeySet,
  TokenExchangeOptions,
  TokenPair,
} from "./types.js";

export class SquareIdPClient {
  protected readonly cfg: Required<Omit<SquareIdPConfig, "clientSecret" | "requiredScope">> &
    Pick<SquareIdPConfig, "clientSecret" | "requiredScope">;
  private metadataCache?: SquareIdentityMetadata;
  private keyCache?: SquarePublicKeySet;

  constructor(config: SquareIdPConfig) {
    if (!config.issuer || !config.clientId || !config.redirectUri) {
      throw idpError("invalid_config", "issuer, clientId, and redirectUri are required");
    }
    const fetcher = config.fetch ?? globalThis.fetch;
    if (!fetcher) {
      throw idpError("invalid_config", "fetch is required in this runtime");
    }
    this.cfg = {
      issuer: trimSlash(config.issuer),
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      scopes: config.scopes,
      audience: config.audience ?? "square-experience",
      fetch: fetcher as FetchLike,
      clientSecret: config.clientSecret,
      requiredScope: config.requiredScope,
    };
  }

  get issuer(): string {
    return this.cfg.issuer;
  }

  scopes(value: string | string[] = this.cfg.scopes): string[] {
    return Array.isArray(value) ? value.filter(Boolean) : value.split(/\s+/).filter(Boolean);
  }

  async discovery(force = false): Promise<SquareIdentityMetadata> {
    if (this.metadataCache && !force) {
      return this.metadataCache;
    }
    const response = await this.cfg.fetch(`${this.cfg.issuer}/.well-known/square-identity`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw idpError("discovery_failed", "Base discovery endpoint rejected the request", response.status);
    }
    this.metadataCache = (await response.json()) as SquareIdentityMetadata;
    return this.metadataCache;
  }

  async publicKeys(force = false): Promise<SquarePublicKeySet> {
    if (this.keyCache && !force) {
      return this.keyCache;
    }
    const metadata = await this.discovery();
    const response = await this.cfg.fetch(metadata.paseto_public_key_endpoint, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw idpError("key_fetch_failed", "Base public-key endpoint rejected the request", response.status);
    }
    this.keyCache = (await response.json()) as SquarePublicKeySet;
    return this.keyCache;
  }

  authorizeUrl(options: AuthorizeUrlOptions = {}): string {
    const url = new URL(`${this.cfg.issuer}/oauth2/authorize`);
    url.searchParams.set("response_type", options.responseType ?? "code");
    url.searchParams.set("client_id", this.cfg.clientId);
    url.searchParams.set("redirect_uri", options.redirectUri ?? this.cfg.redirectUri);
    url.searchParams.set("scope", this.scopes(options.scopes).join(" "));
    if (options.state) url.searchParams.set("state", options.state);
    if (options.nonce) url.searchParams.set("nonce", options.nonce);
    if (options.codeChallenge) {
      url.searchParams.set("code_challenge", options.codeChallenge);
      url.searchParams.set("code_challenge_method", options.codeChallengeMethod ?? "S256");
    }
    return url.toString();
  }

  async exchangeCode(options: TokenExchangeOptions): Promise<TokenPair> {
    if (!options.code) {
      throw idpError("invalid_request", "authorization code is required");
    }
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
      throw idpError("token_exchange_failed", "Base token endpoint rejected the request", response.status, payload);
    }
    return payload as TokenPair;
  }
}

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

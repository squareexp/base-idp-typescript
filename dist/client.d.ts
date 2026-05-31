import type { AuthorizeUrlOptions, BaseIdPConfig, BaseIdpIdentityMetadata, RefreshOptions, ResolvedConfig, BaseIdpPublicKeySet, TokenExchangeOptions, TokenPair } from "./types.js";
export declare class BaseIdPClient {
    private readonly rawConfig;
    protected readonly cfg: Required<ResolvedConfig>;
    private metadataCache?;
    private keyCache?;
    constructor(rawConfig: BaseIdPConfig);
    get issuer(): string;
    get clientId(): string;
    scopes(value?: string | string[]): string[];
    resolveConfig(): Promise<ResolvedConfig>;
    discovery(force?: boolean): Promise<BaseIdpIdentityMetadata>;
    publicKeys(force?: boolean): Promise<BaseIdpPublicKeySet>;
    authorizeUrl(options?: AuthorizeUrlOptions): string;
    exchangeCode(options: TokenExchangeOptions): Promise<TokenPair>;
    refresh(options: RefreshOptions): Promise<TokenPair>;
    private postToken;
}
export { BaseIdPClient as BaseIdpClient };
//# sourceMappingURL=client.d.ts.map
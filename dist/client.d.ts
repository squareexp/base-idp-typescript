import type { AuthorizeUrlOptions, RefreshOptions, SquareIdPConfig, SquareIdentityMetadata, SquarePublicKeySet, TokenExchangeOptions, TokenPair } from "./types.js";
export declare class SquareIdPClient {
    protected readonly cfg: Required<Omit<SquareIdPConfig, "clientSecret" | "requiredScope">> & Pick<SquareIdPConfig, "clientSecret" | "requiredScope">;
    private metadataCache?;
    private keyCache?;
    constructor(config: SquareIdPConfig);
    get issuer(): string;
    scopes(value?: string | string[]): string[];
    discovery(force?: boolean): Promise<SquareIdentityMetadata>;
    publicKeys(force?: boolean): Promise<SquarePublicKeySet>;
    authorizeUrl(options?: AuthorizeUrlOptions): string;
    exchangeCode(options: TokenExchangeOptions): Promise<TokenPair>;
    refresh(options: RefreshOptions): Promise<TokenPair>;
    private postToken;
}
//# sourceMappingURL=client.d.ts.map
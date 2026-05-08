import type { SquareIdPConfig, SquarePublicKeySet, VerifiedPrincipal, VerifyAccessTokenOptions } from "./types.js";
type Footer = {
    kid?: string;
    alg?: string;
    typ?: string;
};
export declare function unsafeFooter(token: string): Footer;
export declare function unsafeFooterKid(token: string): string | undefined;
export declare function verifyPasetoV4Public(token: string, keySet: SquarePublicKeySet, config: Pick<SquareIdPConfig, "issuer" | "audience" | "requiredScope">, options?: VerifyAccessTokenOptions): VerifiedPrincipal;
export {};
//# sourceMappingURL=paseto.d.ts.map
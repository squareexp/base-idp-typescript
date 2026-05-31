import { createPublicKey, verify as verifySignature } from "node:crypto";
import { base64UrlDecode, concatBytes, utf8Decode, utf8Encode } from "./base64url.js";
import { idpError } from "./errors.js";
import type { AccessClaims, ResolvedConfig, BaseIdpPublicKeySet, VerifiedPrincipal, VerifyAccessTokenOptions } from "./types.js";

const HEADER = utf8Encode("v4.public.");
const IMPLICIT_ASSERTION = utf8Encode("square-experience:idp:access:v1");
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

type Footer = {
  kid?: string;
  alg?: string;
  typ?: string;
};

export function unsafeFooter(token: string): Footer {
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v4" || parts[1] !== "public") {
    throw idpError("invalid_token", "token is not PASETO v4.public");
  }
  return JSON.parse(utf8Decode(base64UrlDecode(parts[3]))) as Footer;
}

export function unsafeFooterKid(token: string): string | undefined {
  return unsafeFooter(token).kid;
}

export function verifyPasetoV4Public(
  token: string,
  keySet: BaseIdpPublicKeySet,
  config: { issuer: string; audience?: string; requiredScope?: string },
  options: VerifyAccessTokenOptions = {},
): VerifiedPrincipal {
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v4" || parts[1] !== "public") {
    throw idpError("invalid_token", "token is not PASETO v4.public");
  }

  const payload = base64UrlDecode(parts[2]);
  const footerBytes = base64UrlDecode(parts[3]);
  if (payload.length <= 64) {
    throw idpError("invalid_token", "PASETO payload is too short");
  }

  const footer = JSON.parse(utf8Decode(footerBytes)) as Footer;
  if (footer.alg !== "v4.public" || footer.typ !== "paseto" || !footer.kid) {
    throw idpError("invalid_token", "PASETO footer is not a BaseIdP v4.public footer");
  }

  const publicKey = keySet.keys.find((key) => key.kid === footer.kid && key.alg === "v4.public");
  if (!publicKey) {
    throw idpError("unknown_kid", "PASETO key id is not present in the Base key set");
  }

  const message = payload.subarray(0, payload.length - 64);
  const signature = payload.subarray(payload.length - 64);
  const rawPublicKey = base64UrlDecode(publicKey.public_key_base64);
  if (rawPublicKey.length !== 32 || signature.length !== 64) {
    throw idpError("invalid_key", "Ed25519 public key or signature has an invalid size");
  }

  const spki = Buffer.concat([ED25519_SPKI_PREFIX, Buffer.from(rawPublicKey)]);
  const keyObject = createPublicKey({ key: spki, format: "der", type: "spki" });
  const pae = preAuthEncode([HEADER, message, footerBytes, IMPLICIT_ASSERTION]);
  if (!verifySignature(null, Buffer.from(pae), keyObject, Buffer.from(signature))) {
    throw idpError("invalid_signature", "PASETO signature verification failed");
  }

  const claims = JSON.parse(utf8Decode(message)) as AccessClaims;
  validateClaims(claims, {
    issuer: options.issuer ?? config.issuer,
    audience: options.audience ?? config.audience ?? "square-experience",
    requiredScope: options.requiredScope ?? config.requiredScope,
    maxClockSkewSeconds: options.maxClockSkewSeconds ?? 30,
  });

  return {
    id: claims.gid,
    subject: claims.sub,
    email: claims.email,
    name: claims.name,
    role: claims.role,
    scopes: claims.scp ?? [],
    accountContext: claims.ctx,
    claims,
  };
}

function validateClaims(claims: AccessClaims, options: Required<Pick<VerifyAccessTokenOptions, "issuer" | "audience" | "maxClockSkewSeconds">> & Pick<VerifyAccessTokenOptions, "requiredScope">): void {
  if (claims.token_use !== "access") {
    throw idpError("invalid_claims", "token_use must be access");
  }
  if (claims.iss !== options.issuer || claims.aud !== options.audience) {
    throw idpError("invalid_claims", "issuer or audience mismatch");
  }
  const now = Date.now();
  const skewMs = options.maxClockSkewSeconds * 1000;
  if (Date.parse(claims.exp) <= now - skewMs) {
    throw idpError("token_expired", "access token expired");
  }
  if (Date.parse(claims.nbf) > now + skewMs) {
    throw idpError("token_not_yet_valid", "access token is not valid yet");
  }
  if (options.requiredScope && !(claims.scp ?? []).includes(options.requiredScope)) {
    throw idpError("insufficient_scope", "required scope is missing");
  }
  if (!claims.gid || !claims.sub || !claims.sid || !claims.ctx || !claims.role) {
    throw idpError("invalid_claims", "required identity claims are missing");
  }
}

function preAuthEncode(pieces: Uint8Array[]): Uint8Array {
  const out: Uint8Array[] = [uint64le(pieces.length)];
  for (const piece of pieces) {
    out.push(uint64le(piece.length), piece);
  }
  return concatBytes(out);
}

function uint64le(value: number): Uint8Array {
  const out = new Uint8Array(8);
  let current = BigInt(value);
  for (let i = 0; i < 8; i++) {
    out[i] = Number(current & 0xffn);
    current >>= 8n;
  }
  return out;
}

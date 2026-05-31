#!/usr/bin/env node
async function main() {
    const [, , command = "help", ...argv] = process.argv;
    if (command !== "init" && command !== "test" && command !== "token" && command !== "help") {
        printUsageAndExit(`Unknown command: ${command}`);
    }
    if (command === "help")
        printUsageAndExit();
    const args = parseArgs(argv);
    if (command === "init") {
        await initCommand(args);
    }
    else if (command === "test") {
        await testCommand(args);
    }
    else if (command === "token") {
        await tokenCommand(args);
    }
}
async function initCommand(args) {
    const key = stringArg(args, "key") || process.env.BASE_IDP_KEY;
    const issuer = stringArg(args, "issuer") || process.env.BASE_IDP_ISSUER || "https://authlayer.squareexp.com";
    const secret = stringArg(args, "client-secret") ||
        stringArg(args, "secret") ||
        process.env.BASE_IDP_CLIENT_SECRET ||
        process.env.BASE_IDP_SECRET;
    if (!key) {
        printUsageAndExit("Missing --key (set BASE_IDP_KEY in your env or pass --key)");
    }
    const env = [
        `BASE_IDP_KEY=${key}`,
        `BASE_IDP_ISSUER=${issuer}`,
    ];
    if (secret)
        env.push(`BASE_IDP_CLIENT_SECRET=${secret}`);
    if (boolArg(args, "post", false)) {
        const adminUrl = stringArg(args, "admin-url") || `${trimSlash(issuer)}/admin/v1/clients`;
        const adminToken = stringArg(args, "admin-token");
        if (!adminToken)
            printUsageAndExit("--post requires --admin-token");
        const response = await fetch(adminUrl, {
            method: "POST",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${adminToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                client_id: stringArg(args, "client-id") || undefined,
                product: stringArg(args, "product") || "square",
                display_name: stringArg(args, "display-name") || "My App",
                app_domain: stringArg(args, "app-domain") || "",
                allowed_redirect_uris: splitList(stringArg(args, "allowed-redirect-uris") || "").filter(Boolean),
                allowed_scopes: splitList(stringArg(args, "allowed-scopes") || "openid profile"),
                allowed_auth_methods: splitList(stringArg(args, "allowed-auth-methods") || "password,magic_link"),
                confidential: boolArg(args, "confidential", true),
            }),
        });
        const payload = await response.json().catch(() => ({}));
        if (response.ok) {
            console.log(JSON.stringify({ ok: true, payload }, null, 2));
            console.log();
        }
        else {
            console.error(JSON.stringify({ ok: false, status: response.status, payload }, null, 2));
            process.exitCode = 1;
        }
    }
    console.log(env.join("\n"));
}
async function testCommand(args) {
    const issuer = stringArg(args, "issuer") || process.env.BASE_IDP_ISSUER || "https://authlayer.squareexp.com";
    const key = stringArg(args, "key") || process.env.BASE_IDP_KEY;
    console.log(`Testing Base IdP connection to ${issuer}...`);
    try {
        const health = await fetch(`${trimSlash(issuer)}/healthz`);
        console.log(`  healthz: ${health.status} ${health.ok ? "OK" : "FAIL"}`);
        const discovery = await fetch(`${trimSlash(issuer)}/.well-known/square-identity`);
        console.log(`  discovery: ${discovery.status} ${discovery.ok ? "OK" : "FAIL"}`);
        if (key) {
            const config = await fetch(`${trimSlash(issuer)}/v1/client-config?key=${encodeURIComponent(key)}`);
            console.log(`  client-config: ${config.status} ${config.ok ? "OK" : "FAIL"}`);
        }
        console.log("\nIdP is reachable.");
    }
    catch (err) {
        console.error(`Connection failed: ${err}`);
        process.exitCode = 1;
    }
}
async function tokenCommand(args) {
    const token = stringArg(args, "token") || args._[0];
    if (!token)
        printUsageAndExit("Missing token argument");
    const parts = token.split(".");
    if (parts.length !== 4 || parts[0] !== "v4" || parts[1] !== "public") {
        console.error("Not a PASETO v4.public token");
        process.exit(1);
        return;
    }
    const header = { version: parts[0], purpose: parts[1] };
    const payload = decodeBase64Url(parts[2]);
    const footer = decodeBase64Url(parts[3]);
    try {
        const claims = JSON.parse(new TextDecoder().decode(payload));
        const footerObj = JSON.parse(new TextDecoder().decode(footer));
        console.log("=== PASETO v4.public Token ===");
        console.log(JSON.stringify({
            header,
            footer: footerObj,
            claims: {
                ...claims,
                exp: claims.exp ? new Date(Date.parse(claims.exp)).toISOString() : undefined,
                nbf: claims.nbf ? new Date(Date.parse(claims.nbf)).toISOString() : undefined,
                iat: claims.iat ? new Date(Date.parse(claims.iat)).toISOString() : undefined,
            },
        }, null, 2));
        const now = Date.now();
        if (claims.exp && Date.parse(claims.exp) <= now) {
            console.log("\n⚠ Token is EXPIRED");
        }
    }
    catch {
        console.log(JSON.stringify({ header, payload: "[binary]",
            footer: new TextDecoder().decode(footer) }, null, 2));
    }
}
function decodeBase64Url(value) {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(padded);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++)
        out[i] = binary.charCodeAt(i);
    return out;
}
function splitList(value) {
    return value.split(/[,\s]+/).map((item) => item.trim()).filter(Boolean);
}
function stringArg(args, key) {
    const value = args[key];
    return typeof value === "string" ? value : "";
}
function boolArg(args, key, fallback) {
    const value = args[key];
    if (typeof value === "boolean")
        return value;
    if (typeof value === "string")
        return !["0", "false", "no", "off"].includes(value.toLowerCase());
    return fallback;
}
function parseArgs(argv) {
    const args = { _: [] };
    for (let i = 0; i < argv.length; i += 1) {
        const raw = argv[i];
        if (!raw.startsWith("--")) {
            args._.push(raw);
            continue;
        }
        const trimmed = raw.slice(2);
        const equals = trimmed.indexOf("=");
        if (equals >= 0) {
            args[trimmed.slice(0, equals)] = trimmed.slice(equals + 1);
            continue;
        }
        const key = trimmed;
        const next = argv[i + 1];
        if (!next || next.startsWith("--")) {
            args[key] = true;
            continue;
        }
        args[key] = next;
        i += 1;
    }
    return args;
}
function trimSlash(value) {
    return value.replace(/\/+$/, "");
}
function printUsageAndExit(reason) {
    if (reason) {
        console.error(reason);
        console.error();
    }
    console.error(`Usage:
  base-idp init  [--key <key>] [--issuer <url>]       Generate env config from a base key
  base-idp test  [--issuer <url>] [--key <key>]        Test IdP connectivity
  base-idp token <token>                               Decode and inspect a PASETO token

Init options:
  --key <key>                Base key (anon_key from Console)
  --issuer <url>             Base IdP issuer URL
  --client-secret <secret>   Client secret (confidential clients only)
  --secret <secret>          Legacy alias for --client-secret
  --post                     Register client + output env
  --admin-token <token>      Admin token for --post

Test options:
  --issuer <url>             Base IdP issuer URL
  --key <key>                Base key to test client-config endpoint
`);
    process.exit(1);
    throw new Error(reason ?? "usage requested");
}
await main();
export {};
//# sourceMappingURL=cli.js.map
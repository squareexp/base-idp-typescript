import { BaseIdPClient } from "./client.js";
import type { BaseIdPConfig } from "./types.js";

export function createClientBootstrap(config: BaseIdPConfig) {
  const client = new BaseIdPClient(config);
  return {
    client,
    async init() {
      const resolved = await client.resolveConfig();
      const env = [
        `BASE_IDP_KEY=${config.key}`,
        `BASE_IDP_ISSUER=${resolved.issuer}`,
      ];
      if (config.secret) env.push(`BASE_IDP_CLIENT_SECRET=${config.secret}`);
      return { env: env.join("\n"), config: resolved };
    },
  };
}

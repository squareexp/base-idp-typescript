import { BaseIdPClient } from "./client.js";
import type { AuthorizeUrlOptions, BaseIdPConfig } from "./types.js";

export type ReactBaseIdpAuth = {
  loginHref(options?: AuthorizeUrlOptions): string;
  login(options?: AuthorizeUrlOptions): void;
  buttonProps(options?: AuthorizeUrlOptions): {
    type: "button";
    onClick(): void;
  };
};

export function createReactBaseIdpAuth(config: BaseIdPConfig | BaseIdPClient): ReactBaseIdpAuth {
  const client = config instanceof BaseIdPClient ? config : new BaseIdPClient(config);
  return {
    loginHref(options = {}) {
      return client.authorizeUrl(options);
    },
    login(options = {}) {
      window.location.assign(client.authorizeUrl(options));
    },
    buttonProps(options = {}) {
      return {
        type: "button",
        onClick() {
          window.location.assign(client.authorizeUrl(options));
        },
      };
    },
  };
}

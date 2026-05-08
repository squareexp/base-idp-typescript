import { SquareIdPClient } from "./client.js";
import type { AuthorizeUrlOptions, SquareIdPConfig } from "./types.js";

export type ReactSquareAuth = {
  loginHref(options?: AuthorizeUrlOptions): string;
  login(options?: AuthorizeUrlOptions): void;
  buttonProps(options?: AuthorizeUrlOptions): {
    type: "button";
    onClick(): void;
  };
};

export function createReactSquareAuth(config: SquareIdPConfig | SquareIdPClient): ReactSquareAuth {
  const client = config instanceof SquareIdPClient ? config : new SquareIdPClient(config);
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

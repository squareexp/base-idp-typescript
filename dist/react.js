import { BaseIdPClient } from "./client.js";
export function createReactBaseIdpAuth(config) {
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
//# sourceMappingURL=react.js.map
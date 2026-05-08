import { SquareIdPClient } from "./client.js";
export function createReactSquareAuth(config) {
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
//# sourceMappingURL=react.js.map
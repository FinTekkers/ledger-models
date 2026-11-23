"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareLocalDates = exports.requireSecurityMetricFetcher = exports.clearSecurityMetricFetcher = exports.setSecurityMetricFetcher = exports.SecurityMetricFetcherMissingError = void 0;
/** No SecurityMetricFetcher is installed. */
class SecurityMetricFetcherMissingError extends Error {
    constructor() {
        super("No SecurityMetricFetcher installed: call setSecurityMetricFetcher(...)");
        this.name = "SecurityMetricFetcherMissingError";
        Object.setPrototypeOf(this, SecurityMetricFetcherMissingError.prototype);
    }
}
exports.SecurityMetricFetcherMissingError = SecurityMetricFetcherMissingError;
let securityMetricFetcher = null;
/** Install the fetcher the metric helpers read from. Process-wide. */
function setSecurityMetricFetcher(fetcher) {
    securityMetricFetcher = fetcher;
}
exports.setSecurityMetricFetcher = setSecurityMetricFetcher;
/** Remove the installed fetcher; the helpers reject again. */
function clearSecurityMetricFetcher() {
    securityMetricFetcher = null;
}
exports.clearSecurityMetricFetcher = clearSecurityMetricFetcher;
/** The installed fetcher. Throws SecurityMetricFetcherMissingError when there is none. */
function requireSecurityMetricFetcher() {
    if (securityMetricFetcher === null)
        throw new SecurityMetricFetcherMissingError();
    return securityMetricFetcher;
}
exports.requireSecurityMetricFetcher = requireSecurityMetricFetcher;
/** Negative, zero or positive as `a` is before, on or after `b`. */
function compareLocalDates(a, b) {
    const pa = a.toProto();
    const pb = b.toProto();
    return pa.getYear() - pb.getYear() || pa.getMonth() - pb.getMonth() || pa.getDay() - pb.getDay();
}
exports.compareLocalDates = compareLocalDates;
//# sourceMappingURL=security_metric.js.map
import * as grpc from '@grpc/grpc-js';
declare class EnvConfig {
    private static getEnvVar;
    static get apiKey(): string;
    /**
     * Returns the URL for the backend GRPC service. It will default to
     * api.fintekkers.org if the environment variable is not set. You
     * cann set the environment variable by adding API_URL to your .env file.
     */
    static get apiURL(): string;
    static get apiCredentials(): grpc.ChannelCredentials;
}
export default EnvConfig;

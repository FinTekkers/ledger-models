import * as dotenv from 'dotenv';
dotenv.config();

import * as grpc from '@grpc/grpc-js';

class EnvConfig {
    private static getEnvVar(key: string, defaultValue?: string): string {
        const value = process.env[key];
        if (value === undefined) {
          if (defaultValue === undefined) {
            throw new Error(`Environment variable ${key} is not set.`);
          }
          return defaultValue;
        }
        return value;
      }

  static get apiKey(): string {
    throw new Error("API keys not supported currently.")
    // return EnvConfig.getEnvVar('API_KEY');
  }

  /**
   * Returns the URL for the backend GRPC service. It will default to 
   * api.fintekkers.org if the environment variable is not set. You 
   * cann set the environment variable by adding API_URL to your .env file.
   */
  static get apiURL(): string {
    const url:string = EnvConfig.getEnvVar('API_URL', "api.fintekkers.org") + ":8082";
    return url;
  }

  static get apiCredentials(): grpc.ChannelCredentials {
    if(this.apiURL === "localhost:8082"){
        return grpc.credentials.createInsecure();
    }
    else { 
        return grpc.credentials.createSsl();
    }
  }
  
}

export default EnvConfig;

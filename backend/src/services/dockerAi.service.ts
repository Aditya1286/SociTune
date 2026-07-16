import { DOCKER_AI_SERVICE_URL } from "../config/index.js";

class DockerAiService {
  private getBaseUrl() {
    return DOCKER_AI_SERVICE_URL;
  }

  /**
   * Sends the playback event payload to the local Docker AI service.
   * This call is fully asynchronous and handles connection failures and timeouts.
   */
  public async sendListeningEvent(payload: any): Promise<boolean> {
    const url = `${this.getBaseUrl()}/api/listening-event`;
    const maxRetries = 2;
    const timeoutMs = 5000;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        console.log(`[DockerAiService] Sending listening event to ${url} (Attempt ${attempt}/${maxRetries + 1})`);
        
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (response.ok) {
          console.log(`[DockerAiService] Successfully sent event to local AI service.`);
          return true;
        }

        // If response is not ok, throw error to trigger retry (for 5xx / timeout)
        throw new Error(`HTTP status ${response.status}: ${response.statusText}`);
      } catch (error: any) {
        const isOffline = error.cause?.code === "ECONNREFUSED" || error.message?.includes("ECONNREFUSED");
        if (isOffline) {
          console.log(`[DockerAiService] Local AI service is offline at ${url}. Skipping event forwarding.`);
          break;
        }

        console.error(`[DockerAiService] Attempt ${attempt} failed. Error:`, error.message || error);

        // Only retry for network/timeout errors or 5xx server issues
        const isNetworkOrTimeout = error.name === "TimeoutError" || error.message?.includes("fetch");
        const isServerError = error.message?.includes("HTTP status 5");
        
        if (attempt <= maxRetries && (isNetworkOrTimeout || isServerError)) {
          // Wait slightly before retrying (e.g. 500ms)
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        } else {
          console.error(`[DockerAiService] Failed to send listening event to local AI service after ${attempt} attempts.`);
          break;
        }
      }
    }

    return false;
  }
}

export const dockerAiService = new DockerAiService();

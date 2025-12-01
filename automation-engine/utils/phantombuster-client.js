import axios from 'axios';
import chalk from 'chalk';

/**
 * PhantomBuster API Client
 * Handles authentication and API calls to PhantomBuster service
 */
class PhantomBusterClient {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('PhantomBuster API key is required');
    }

    this.apiKey = apiKey;
    this.baseURL = 'https://api.phantombuster.com/api/v2';

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'X-Phantombuster-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
  }

  /**
   * Launch a PhantomBuster agent
   * @param {string} agentId - The agent instance ID
   * @param {object} argument - Configuration for the agent
   * @returns {Promise<string>} Container ID for tracking the execution
   */
  async launchAgent(agentId, argument = {}) {
    try {
      const response = await this.client.post('/agents/launch', {
        id: agentId,
        argument
      });

      const containerId = response.data?.data?.containerId;
      if (!containerId) {
        throw new Error('No container ID returned from PhantomBuster');
      }

      return containerId;
    } catch (error) {
      throw this.handleError(error, 'launchAgent');
    }
  }

  /**
   * Get agent status and execution details
   * @param {string} agentId - The agent instance ID
   * @returns {Promise<object>} Agent status information
   */
  async getAgentStatus(agentId) {
    try {
      const response = await this.client.get('/agents/fetch', {
        params: { id: agentId }
      });

      return response.data?.data || {};
    } catch (error) {
      throw this.handleError(error, 'getAgentStatus');
    }
  }

  /**
   * Fetch results from a completed agent execution
   * @param {string} containerId - The container ID from launchAgent
   * @returns {Promise<array>} Array of scraped results
   */
  async fetchResults(containerId) {
    try {
      const response = await this.client.get('/containers/fetch-result-object', {
        params: { id: containerId }
      });

      return response.data || [];
    } catch (error) {
      throw this.handleError(error, 'fetchResults');
    }
  }

  /**
   * Fetch output as CSV
   * @param {string} containerId - The container ID from launchAgent
   * @returns {Promise<string>} CSV data
   */
  async fetchResultsCSV(containerId) {
    try {
      const response = await this.client.get('/containers/fetch-output', {
        params: { id: containerId }
      });

      return response.data || '';
    } catch (error) {
      throw this.handleError(error, 'fetchResultsCSV');
    }
  }

  /**
   * Wait for agent to complete execution
   * @param {string} agentId - The agent instance ID
   * @param {number} pollInterval - How often to check status (ms)
   * @param {number} maxWaitTime - Maximum time to wait (ms)
   * @returns {Promise<object>} Final agent status
   */
  async waitForCompletion(agentId, pollInterval = 30000, maxWaitTime = 1800000) {
    const startTime = Date.now();

    while (true) {
      // Check if we've exceeded max wait time (default 30 minutes)
      if (Date.now() - startTime > maxWaitTime) {
        throw new Error(`Agent execution exceeded max wait time (${maxWaitTime / 1000}s)`);
      }

      const status = await this.getAgentStatus(agentId);

      // Check if agent has finished
      if (status.lastEndStatus === 'success') {
        return status;
      }

      if (status.lastEndStatus === 'error') {
        throw new Error(`Agent failed: ${status.lastEndMessage || 'Unknown error'}`);
      }

      // Agent is still running, wait before polling again
      await this.sleep(pollInterval);
    }
  }

  /**
   * Get list of all agents in the account
   * @returns {Promise<array>} Array of agent configurations
   */
  async listAgents() {
    try {
      const response = await this.client.get('/agents/fetch-all');
      return response.data?.data || [];
    } catch (error) {
      throw this.handleError(error, 'listAgents');
    }
  }

  /**
   * Get agent details
   * @param {string} agentId - The agent instance ID
   * @returns {Promise<object>} Agent configuration and metadata
   */
  async getAgent(agentId) {
    try {
      const response = await this.client.get('/agents/fetch', {
        params: { id: agentId }
      });
      return response.data?.data || {};
    } catch (error) {
      throw this.handleError(error, 'getAgent');
    }
  }

  /**
   * Save agent configuration (update argument)
   * @param {string} agentId - The agent instance ID
   * @param {object} argument - New configuration
   * @returns {Promise<object>} Updated agent details
   */
  async saveAgent(agentId, argument) {
    try {
      const response = await this.client.post('/agents/save', {
        id: agentId,
        argument
      });
      return response.data?.data || {};
    } catch (error) {
      throw this.handleError(error, 'saveAgent');
    }
  }

  /**
   * Delete an agent
   * @param {string} agentId - The agent instance ID
   * @returns {Promise<object>} Deletion confirmation
   */
  async deleteAgent(agentId) {
    try {
      const response = await this.client.post('/agents/delete', {
        id: agentId
      });
      return response.data || {};
    } catch (error) {
      throw this.handleError(error, 'deleteAgent');
    }
  }

  /**
   * Get account usage statistics
   * @returns {Promise<object>} Usage stats (execution time, etc.)
   */
  async getUsageStats() {
    try {
      const response = await this.client.get('/user/fetch');
      return response.data?.data || {};
    } catch (error) {
      throw this.handleError(error, 'getUsageStats');
    }
  }

  /**
   * Helper: Sleep for specified duration
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle and format errors
   * @param {Error} error - Original error
   * @param {string} method - Method name where error occurred
   * @returns {Error} Formatted error
   */
  handleError(error, method) {
    if (error.response) {
      // API returned an error response
      const status = error.response.status;
      const message = error.response.data?.message || error.message;
      return new Error(`PhantomBuster API error (${method}): ${status} - ${message}`);
    } else if (error.request) {
      // Request was made but no response received
      return new Error(`PhantomBuster API timeout (${method}): No response received`);
    } else {
      // Something else went wrong
      return new Error(`PhantomBuster client error (${method}): ${error.message}`);
    }
  }

  /**
   * Validate agent argument schema
   * @param {object} argument - Argument to validate
   * @param {array} requiredFields - Required field names
   * @returns {boolean} True if valid
   */
  validateArgument(argument, requiredFields = []) {
    for (const field of requiredFields) {
      if (!argument[field]) {
        throw new Error(`Missing required argument field: ${field}`);
      }
    }
    return true;
  }
}

export default PhantomBusterClient;

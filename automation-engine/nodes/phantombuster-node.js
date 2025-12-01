import PhantomBusterClient from '../utils/phantombuster-client.js';
import chalk from 'chalk';

/**
 * PhantomBuster Node
 * Integrates PhantomBuster agents into the workflow for LinkedIn automation and enrichment
 */
class PhantomBusterNode {
  constructor(config = {}) {
    this.name = config.name || 'PhantomBuster';
    this.agentId = config.agentId; // PhantomBuster agent instance ID
    this.phantomType = config.phantomType || 'profile-scraper'; // Type of phantom
    this.argument = config.argument || {}; // Agent-specific configuration
    this.inputField = config.inputField || 'leads'; // Input data field from context
    this.outputField = config.outputField || 'phantomResults'; // Output field name
    this.waitForCompletion = config.waitForCompletion !== false; // Wait for agent to finish
    this.pollInterval = config.pollInterval || 30000; // 30 seconds
    this.maxWaitTime = config.maxWaitTime || 1800000; // 30 minutes
  }

  async execute(context) {
    const { logger, mode } = context;

    logger.info(chalk.blue(`[${this.name}] Starting PhantomBuster ${this.phantomType}...`));

    // Simulation mode
    if (mode === 'simulate') {
      return this.simulateExecution(context);
    }

    // Live mode
    return this.liveExecution(context);
  }

  async simulateExecution(context) {
    const { logger } = context;

    logger.info(chalk.yellow(`[${this.name}] SIMULATION MODE - PhantomBuster call skipped`));

    const inputData = context.get(this.inputField) || [];
    const sampleSize = Math.min(inputData.length, this.argument.numberOfProfilesPerLaunch || 100);

    const simulatedResults = this.generateSimulatedResults(context, sampleSize);
    context.set(this.outputField, simulatedResults);

    logger.info(chalk.green(`[${this.name}] Simulated ${simulatedResults.length} results`));
    logger.info(chalk.cyan(`[${this.name}] Phantom type: ${this.phantomType}`));

    return context;
  }

  async liveExecution(context) {
    const { logger } = context;

    // Validate environment
    const apiKey = process.env.PHANTOMBUSTER_API_KEY;
    if (!apiKey) {
      throw new Error('PHANTOMBUSTER_API_KEY environment variable is required for live mode');
    }

    if (!this.agentId) {
      throw new Error('Agent ID is required for PhantomBuster node');
    }

    const client = new PhantomBusterClient(apiKey);

    try {
      // Prepare argument (merge config with dynamic data from context if needed)
      const finalArgument = this.prepareArgument(context);

      // Launch the agent
      logger.info(chalk.cyan(`[${this.name}] Launching agent ${this.agentId}...`));
      const containerId = await client.launchAgent(this.agentId, finalArgument);
      logger.info(chalk.cyan(`[${this.name}] Agent launched (container: ${containerId})`));

      // Wait for completion if configured
      if (this.waitForCompletion) {
        logger.info(chalk.cyan(`[${this.name}] Waiting for agent to complete (max wait: ${this.maxWaitTime / 60000} minutes)...`));

        const status = await client.waitForCompletion(
          this.agentId,
          this.pollInterval,
          this.maxWaitTime
        );

        logger.info(chalk.green(`[${this.name}] Agent completed successfully`));
        logger.info(chalk.cyan(`[${this.name}] Execution time: ${status.execTimeMinutes?.toFixed(2) || 'N/A'} minutes`));

        // Fetch results
        logger.info(chalk.cyan(`[${this.name}] Fetching results...`));
        const results = await client.fetchResults(containerId);

        context.set(this.outputField, results);
        context.set(`${this.outputField}_containerId`, containerId);
        context.set(`${this.outputField}_status`, status);

        logger.info(chalk.green(`[${this.name}] Retrieved ${results.length} results`));
      } else {
        // Just launch and return container ID (non-blocking)
        context.set(`${this.outputField}_containerId`, containerId);
        logger.info(chalk.yellow(`[${this.name}] Agent launched (non-blocking mode)`));
      }

      return context;

    } catch (error) {
      logger.error(chalk.red(`[${this.name}] PhantomBuster error: ${error.message}`));
      throw error;
    }
  }

  /**
   * Prepare agent argument by merging config with context data
   */
  prepareArgument(context) {
    const finalArgument = { ...this.argument };

    // If inputField is specified, prepare spreadsheet URL or direct input
    const inputData = context.get(this.inputField);
    if (inputData && Array.isArray(inputData)) {
      // For profile scrapers, we can pass LinkedIn URLs directly
      if (this.phantomType === 'profile-scraper' || this.phantomType === 'email-extractor') {
        finalArgument.profileUrls = inputData.map(lead => lead.linkedinUrl || lead.profileUrl).filter(Boolean);
      }
    }

    return finalArgument;
  }

  /**
   * Generate simulated results based on phantom type
   */
  generateSimulatedResults(context, sampleSize = 100) {
    const segment = context.get('segment');
    const segmentName = segment?.name || 'General';

    switch (this.phantomType) {
      case 'profile-scraper':
        return this.generateProfileScraperResults(sampleSize, segmentName);

      case 'email-extractor':
        return this.generateEmailExtractorResults(sampleSize, segmentName);

      case 'network-booster':
        return this.generateNetworkBoosterResults(sampleSize);

      case 'message-sender':
        return this.generateMessageSenderResults(sampleSize);

      case 'profile-visitor':
        return this.generateProfileVisitorResults(sampleSize);

      default:
        return this.generateProfileScraperResults(sampleSize, segmentName);
    }
  }

  generateProfileScraperResults(count, segmentName) {
    const firstNames = ['Rajesh', 'Priya', 'Amit', 'Neha', 'Vikram', 'Anjali', 'Sanjay', 'Kavita', 'Arjun', 'Pooja'];
    const lastNames = ['Sharma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Mehta', 'Gupta', 'Joshi', 'Nair', 'Verma'];
    const companies = ['Infosys', 'TCS', 'Wipro', 'HDFC Bank', 'ICICI Bank', 'Reliance Industries', 'Tata Consultancy', 'Axis Bank', 'Tech Mahindra', 'HCL Technologies'];
    const locations = ['Mumbai', 'Bangalore', 'Delhi NCR', 'Pune', 'Hyderabad', 'Chennai'];
    const titles = {
      Partners: ['Founder & CEO', 'Managing Partner', 'Wealth Manager', 'Financial Advisor', 'Investment Consultant'],
      HNI: ['Chief Executive Officer', 'Chief Financial Officer', 'Vice President', 'Managing Director', 'Business Head'],
      UHNI: ['Chairman', 'Promoter', 'Founder & Chairman', 'Managing Director & CEO', 'Board Member'],
      'Mass Affluent': ['Senior Manager', 'Director', 'Vice President', 'Senior Vice President', 'General Manager']
    };

    const segmentTitles = titles[segmentName] || titles['Mass Affluent'];

    return Array.from({ length: count }, (_, i) => {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      const company = companies[i % companies.length];
      const location = locations[i % locations.length];
      const title = segmentTitles[i % segmentTitles.length];

      return {
        profileUrl: `https://www.linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${i + 1}`,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        headline: `${title} at ${company}`,
        currentPosition: title,
        currentCompany: company,
        location,
        connectionDegree: ['1st', '2nd', '3rd'][i % 3],
        summary: `Experienced ${title.toLowerCase()} with ${5 + (i % 20)} years in ${company}`,
        education: [`IIM ${['Ahmedabad', 'Bangalore', 'Calcutta'][i % 3]}`, `IIT ${['Bombay', 'Delhi', 'Madras'][i % 3]}`],
        skills: ['Financial Planning', 'Investment Management', 'Portfolio Management', 'Wealth Advisory', 'Risk Management'].slice(0, 3 + (i % 3))
      };
    });
  }

  generateEmailExtractorResults(count, segmentName) {
    const profileResults = this.generateProfileScraperResults(count, segmentName);

    return profileResults.map(profile => {
      const hasEmail = Math.random() > 0.4; // 60% success rate
      const domain = profile.currentCompany.toLowerCase().replace(/\s+/g, '') + '.com';
      const email = hasEmail
        ? `${profile.firstName.toLowerCase()}.${profile.lastName.toLowerCase()}@${domain}`
        : null;

      return {
        ...profile,
        email,
        emailSource: hasEmail ? ['LinkedIn', 'Hunter.io', 'Website'][Math.floor(Math.random() * 3)] : null,
        verified: hasEmail ? Math.random() > 0.2 : false // 80% verified if found
      };
    });
  }

  generateNetworkBoosterResults(count) {
    return Array.from({ length: count }, (_, i) => ({
      profileUrl: `https://www.linkedin.com/in/lead-${i + 1}`,
      connectionRequestSent: true,
      requestDate: new Date().toISOString(),
      personalizedMessage: true,
      status: ['sent', 'accepted', 'pending'][i % 3]
    }));
  }

  generateMessageSenderResults(count) {
    return Array.from({ length: count }, (_, i) => ({
      profileUrl: `https://www.linkedin.com/in/lead-${i + 1}`,
      messageSent: true,
      messageDate: new Date().toISOString(),
      messageType: 'follow-up',
      status: ['sent', 'read', 'replied'][i % 3]
    }));
  }

  generateProfileVisitorResults(count) {
    return Array.from({ length: count }, (_, i) => ({
      profileUrl: `https://www.linkedin.com/in/lead-${i + 1}`,
      visited: true,
      visitDate: new Date().toISOString()
    }));
  }
}

export default PhantomBusterNode;

import PhantomBusterClient from '../utils/phantombuster-client.js';
import chalk from 'chalk';

/**
 * Instagram Follower Scraper Node
 * Scrapes followers from competitor Instagram accounts for audience analysis and content strategy
 */
class InstagramFollowerScraperNode {
  constructor(config = {}) {
    this.name = config.name || 'Instagram Follower Scraper';
    this.agentId = config.agentId; // PhantomBuster Instagram Follower Scraper agent ID
    this.targetAccounts = config.targetAccounts || []; // Instagram usernames to scrape
    this.maxFollowers = config.maxFollowers || 500; // Followers to scrape per account
    this.outputField = config.outputField || 'instagramFollowers';
    this.waitForCompletion = config.waitForCompletion !== false;
    this.pollInterval = config.pollInterval || 30000;
    this.maxWaitTime = config.maxWaitTime || 1800000; // 30 minutes
  }

  async execute(context) {
    const { logger, mode } = context;

    logger.info(chalk.blue(`[${this.name}] Starting Instagram follower scraping...`));
    logger.info(chalk.cyan(`[${this.name}] Target accounts: ${this.targetAccounts.join(', ')}`));

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

    const simulatedFollowers = this.generateSimulatedFollowers();
    context.set(this.outputField, simulatedFollowers);

    logger.info(chalk.green(`[${this.name}] Simulated ${simulatedFollowers.length} Instagram followers`));
    logger.info(chalk.cyan(`[${this.name}] Competitor accounts analyzed: ${this.targetAccounts.length}`));

    // Generate engagement insights
    const insights = this.generateInsights(simulatedFollowers);
    context.set(`${this.outputField}_insights`, insights);

    logger.info(chalk.magenta(`[${this.name}] Generated audience insights`));

    return context;
  }

  async liveExecution(context) {
    const { logger } = context;

    const apiKey = process.env.PHANTOMBUSTER_API_KEY;
    if (!apiKey) {
      throw new Error('PHANTOMBUSTER_API_KEY environment variable is required for live mode');
    }

    if (!this.agentId) {
      throw new Error('Agent ID is required for Instagram Follower Scraper node');
    }

    const client = new PhantomBusterClient(apiKey);
    const allFollowers = [];

    try {
      // Scrape each target account
      for (const account of this.targetAccounts) {
        logger.info(chalk.cyan(`[${this.name}] Scraping followers from @${account}...`));

        const argument = {
          accountToScrape: account,
          numberOfFollowersToScrape: this.maxFollowers,
          csvName: `instagram_followers_${account}`
        };

        // Launch agent
        const containerId = await client.launchAgent(this.agentId, argument);
        logger.info(chalk.cyan(`[${this.name}] Agent launched for @${account} (container: ${containerId})`));

        // Wait for completion
        if (this.waitForCompletion) {
          await client.waitForCompletion(this.agentId, this.pollInterval, this.maxWaitTime);

          // Fetch results
          const followers = await client.fetchResults(containerId);
          allFollowers.push(...followers.map(f => ({ ...f, sourceAccount: account })));

          logger.info(chalk.green(`[${this.name}] Scraped ${followers.length} followers from @${account}`));
        }
      }

      context.set(this.outputField, allFollowers);
      logger.info(chalk.green(`[${this.name}] Total followers scraped: ${allFollowers.length}`));

      // Generate insights
      const insights = this.generateInsights(allFollowers);
      context.set(`${this.outputField}_insights`, insights);

      return context;

    } catch (error) {
      logger.error(chalk.red(`[${this.name}] Instagram scraping error: ${error.message}`));
      throw error;
    }
  }

  generateSimulatedFollowers() {
    const firstNames = ['Raj', 'Priya', 'Amit', 'Neha', 'Vikram', 'Anjali', 'Sanjay', 'Kavita', 'Arjun', 'Pooja'];
    const lastNames = ['Sharma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Mehta', 'Gupta', 'Joshi', 'Nair', 'Verma'];
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad'];
    const interests = ['finance', 'investing', 'wealth', 'business', 'entrepreneurship', 'stocks', 'trading', 'money'];

    const followers = [];
    const totalPerAccount = Math.floor(this.maxFollowers / Math.max(this.targetAccounts.length, 1));

    for (const account of this.targetAccounts) {
      for (let i = 0; i < totalPerAccount; i++) {
        const firstName = firstNames[i % firstNames.length];
        const lastName = lastNames[i % lastNames.length];
        const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${i}`;

        followers.push({
          sourceAccount: account,
          username,
          fullName: `${firstName} ${lastName}`,
          bio: `${interests[i % interests.length]} enthusiast | ${cities[i % cities.length]}`,
          followersCount: 500 + Math.floor(Math.random() * 10000),
          followingCount: 300 + Math.floor(Math.random() * 1000),
          postsCount: 50 + Math.floor(Math.random() * 500),
          isVerified: Math.random() > 0.95,
          isPrivate: Math.random() > 0.7,
          profilePicUrl: `https://example.com/${username}.jpg`,
          engagement: {
            avgLikesPerPost: Math.floor(Math.random() * 500),
            avgCommentsPerPost: Math.floor(Math.random() * 50),
            engagementRate: (Math.random() * 10).toFixed(2) + '%'
          },
          location: cities[i % cities.length],
          interests: interests.slice(0, 3 + (i % 3)),
          isPotentialLead: Math.random() > 0.6 // 40% potential leads
        });
      }
    }

    return followers;
  }

  generateInsights(followers) {
    if (!followers || followers.length === 0) {
      return { error: 'No followers data available' };
    }

    // Aggregate insights
    const totalFollowers = followers.length;
    const potentialLeads = followers.filter(f => f.isPotentialLead);
    const avgFollowers = followers.reduce((sum, f) => sum + (f.followersCount || 0), 0) / totalFollowers;
    const avgEngagement = followers
      .filter(f => f.engagement?.avgLikesPerPost)
      .reduce((sum, f) => sum + f.engagement.avgLikesPerPost, 0) / totalFollowers;

    // Location distribution
    const locationCounts = {};
    followers.forEach(f => {
      const loc = f.location || 'Unknown';
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    });

    // Top locations
    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location, count]) => ({ location, count, percentage: ((count / totalFollowers) * 100).toFixed(1) }));

    // Interest distribution
    const interestCounts = {};
    followers.forEach(f => {
      if (f.interests && Array.isArray(f.interests)) {
        f.interests.forEach(interest => {
          interestCounts[interest] = (interestCounts[interest] || 0) + 1;
        });
      }
    });

    const topInterests = Object.entries(interestCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([interest, count]) => ({ interest, count, percentage: ((count / totalFollowers) * 100).toFixed(1) }));

    // Account breakdown
    const accountBreakdown = {};
    followers.forEach(f => {
      const source = f.sourceAccount || 'Unknown';
      if (!accountBreakdown[source]) {
        accountBreakdown[source] = {
          totalFollowers: 0,
          potentialLeads: 0,
          avgFollowers: 0,
          avgEngagement: 0
        };
      }
      accountBreakdown[source].totalFollowers++;
      if (f.isPotentialLead) accountBreakdown[source].potentialLeads++;
      accountBreakdown[source].avgFollowers += (f.followersCount || 0);
      accountBreakdown[source].avgEngagement += (f.engagement?.avgLikesPerPost || 0);
    });

    // Calculate averages per account
    Object.keys(accountBreakdown).forEach(account => {
      const data = accountBreakdown[account];
      data.avgFollowers = Math.round(data.avgFollowers / data.totalFollowers);
      data.avgEngagement = Math.round(data.avgEngagement / data.totalFollowers);
      data.leadConversionRate = ((data.potentialLeads / data.totalFollowers) * 100).toFixed(1) + '%';
    });

    return {
      summary: {
        totalFollowers,
        potentialLeads: potentialLeads.length,
        leadConversionRate: ((potentialLeads.length / totalFollowers) * 100).toFixed(1) + '%',
        avgFollowersPerUser: Math.round(avgFollowers),
        avgEngagementPerPost: Math.round(avgEngagement),
        accountsAnalyzed: this.targetAccounts.length
      },
      demographics: {
        topLocations,
        topInterests
      },
      accountBreakdown,
      contentStrategy: {
        recommendedTopics: topInterests.slice(0, 5).map(i => i.interest),
        targetCities: topLocations.slice(0, 3).map(l => l.location),
        engagementTips: [
          'Focus on high-engagement topics: ' + topInterests.slice(0, 3).map(i => i.interest).join(', '),
          'Target audience in: ' + topLocations.slice(0, 3).map(l => l.location).join(', '),
          `Average follower has ${Math.round(avgFollowers)} followers - micro-influencer range`,
          `Potential lead pool: ${potentialLeads.length} users (${((potentialLeads.length / totalFollowers) * 100).toFixed(1)}%)`
        ]
      }
    };
  }
}

export default InstagramFollowerScraperNode;

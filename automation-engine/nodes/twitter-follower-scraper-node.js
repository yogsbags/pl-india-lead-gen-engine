import PhantomBusterClient from '../utils/phantombuster-client.js';
import chalk from 'chalk';

/**
 * Twitter Follower Scraper Node
 * Scrapes followers from competitor Twitter accounts for audience analysis and content strategy
 */
class TwitterFollowerScraperNode {
  constructor(config = {}) {
    this.name = config.name || 'Twitter Follower Scraper';
    this.agentId = config.agentId; // PhantomBuster Twitter Follower Scraper agent ID
    this.targetAccounts = config.targetAccounts || []; // Twitter handles to scrape
    this.maxFollowers = config.maxFollowers || 500; // Followers to scrape per account
    this.outputField = config.outputField || 'twitterFollowers';
    this.waitForCompletion = config.waitForCompletion !== false;
    this.pollInterval = config.pollInterval || 30000;
    this.maxWaitTime = config.maxWaitTime || 1800000; // 30 minutes
  }

  async execute(context) {
    const { logger, mode } = context;

    logger.info(chalk.blue(`[${this.name}] Starting Twitter follower scraping...`));
    logger.info(chalk.cyan(`[${this.name}] Target accounts: ${this.targetAccounts.map(a => '@' + a).join(', ')}`));

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

    logger.info(chalk.green(`[${this.name}] Simulated ${simulatedFollowers.length} Twitter followers`));
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
      throw new Error('Agent ID is required for Twitter Follower Scraper node');
    }

    const client = new PhantomBusterClient(apiKey);
    const allFollowers = [];

    try {
      // Scrape each target account
      for (const account of this.targetAccounts) {
        logger.info(chalk.cyan(`[${this.name}] Scraping followers from @${account}...`));

        const argument = {
          accountToFollow: account,
          numberOfFollowersToScrape: this.maxFollowers,
          csvName: `twitter_followers_${account}`
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
      logger.error(chalk.red(`[${this.name}] Twitter scraping error: ${error.message}`));
      throw error;
    }
  }

  generateSimulatedFollowers() {
    const firstNames = ['Rajesh', 'Priya', 'Amit', 'Neha', 'Vikram', 'Anjali', 'Sanjay', 'Kavita', 'Arjun', 'Pooja'];
    const lastNames = ['Sharma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Mehta', 'Gupta', 'Joshi', 'Nair', 'Verma'];
    const professions = ['Investor', 'Trader', 'Entrepreneur', 'CFO', 'CEO', 'Financial Analyst', 'Wealth Manager', 'Advisor'];
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai'];

    const followers = [];
    const totalPerAccount = Math.floor(this.maxFollowers / Math.max(this.targetAccounts.length, 1));

    for (const account of this.targetAccounts) {
      for (let i = 0; i < totalPerAccount; i++) {
        const firstName = firstNames[i % firstNames.length];
        const lastName = lastNames[i % lastNames.length];
        const handle = `${firstName.toLowerCase()}${lastName.toLowerCase()}${i}`;

        followers.push({
          sourceAccount: account,
          handle,
          name: `${firstName} ${lastName}`,
          bio: `${professions[i % professions.length]} | ${cities[i % cities.length]} | Investing in growth`,
          followersCount: 200 + Math.floor(Math.random() * 50000),
          followingCount: 100 + Math.floor(Math.random() * 2000),
          tweetsCount: 100 + Math.floor(Math.random() * 10000),
          isVerified: Math.random() > 0.97,
          profileImageUrl: `https://example.com/${handle}.jpg`,
          location: cities[i % cities.length],
          engagement: {
            avgRetweets: Math.floor(Math.random() * 100),
            avgLikes: Math.floor(Math.random() * 500),
            avgReplies: Math.floor(Math.random() * 50),
            engagementRate: (Math.random() * 5).toFixed(2) + '%'
          },
          interests: ['finance', 'investing', 'markets', 'wealth', 'business'].slice(0, 2 + (i % 4)),
          isPotentialLead: Math.random() > 0.65, // 35% potential leads
          tweetTopics: ['stocks', 'mutual funds', 'PMS', 'portfolio', 'returns'].filter(() => Math.random() > 0.5)
        });
      }
    }

    return followers;
  }

  generateInsights(followers) {
    if (!followers || followers.length === 0) {
      return { error: 'No followers data available' };
    }

    const totalFollowers = followers.length;
    const potentialLeads = followers.filter(f => f.isPotentialLead);
    const avgFollowers = followers.reduce((sum, f) => sum + (f.followersCount || 0), 0) / totalFollowers;
    const avgTweets = followers.reduce((sum, f) => sum + (f.tweetsCount || 0), 0) / totalFollowers;
    const avgEngagement = followers
      .filter(f => f.engagement?.avgLikes)
      .reduce((sum, f) => sum + f.engagement.avgLikes, 0) / totalFollowers;

    // Location distribution
    const locationCounts = {};
    followers.forEach(f => {
      const loc = f.location || 'Unknown';
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    });

    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location, count]) => ({ location, count, percentage: ((count / totalFollowers) * 100).toFixed(1) }));

    // Interest/topic distribution
    const topicCounts = {};
    followers.forEach(f => {
      if (f.tweetTopics && Array.isArray(f.tweetTopics)) {
        f.tweetTopics.forEach(topic => {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });
      }
    });

    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count, percentage: ((count / totalFollowers) * 100).toFixed(1) }));

    // Account breakdown
    const accountBreakdown = {};
    followers.forEach(f => {
      const source = f.sourceAccount || 'Unknown';
      if (!accountBreakdown[source]) {
        accountBreakdown[source] = {
          totalFollowers: 0,
          potentialLeads: 0,
          avgFollowers: 0,
          avgTweets: 0,
          avgEngagement: 0
        };
      }
      accountBreakdown[source].totalFollowers++;
      if (f.isPotentialLead) accountBreakdown[source].potentialLeads++;
      accountBreakdown[source].avgFollowers += (f.followersCount || 0);
      accountBreakdown[source].avgTweets += (f.tweetsCount || 0);
      accountBreakdown[source].avgEngagement += (f.engagement?.avgLikes || 0);
    });

    // Calculate averages per account
    Object.keys(accountBreakdown).forEach(account => {
      const data = accountBreakdown[account];
      data.avgFollowers = Math.round(data.avgFollowers / data.totalFollowers);
      data.avgTweets = Math.round(data.avgTweets / data.totalFollowers);
      data.avgEngagement = Math.round(data.avgEngagement / data.totalFollowers);
      data.leadConversionRate = ((data.potentialLeads / data.totalFollowers) * 100).toFixed(1) + '%';
    });

    return {
      summary: {
        totalFollowers,
        potentialLeads: potentialLeads.length,
        leadConversionRate: ((potentialLeads.length / totalFollowers) * 100).toFixed(1) + '%',
        avgFollowersPerUser: Math.round(avgFollowers),
        avgTweetsPerUser: Math.round(avgTweets),
        avgEngagementPerTweet: Math.round(avgEngagement),
        accountsAnalyzed: this.targetAccounts.length
      },
      demographics: {
        topLocations,
        topTopics
      },
      accountBreakdown,
      contentStrategy: {
        recommendedTopics: topTopics.slice(0, 5).map(t => t.topic),
        targetCities: topLocations.slice(0, 3).map(l => l.location),
        tweetingTips: [
          'Tweet about: ' + topTopics.slice(0, 3).map(t => t.topic).join(', '),
          'Target cities: ' + topLocations.slice(0, 3).map(l => l.location).join(', '),
          `Audience is active (avg ${Math.round(avgTweets)} tweets per user)`,
          `Potential lead pool: ${potentialLeads.length} users (${((potentialLeads.length / totalFollowers) * 100).toFixed(1)}%)`
        ],
        hashtagRecommendations: topTopics.slice(0, 5).map(t => '#' + t.topic),
        optimalPostingFrequency: 'Daily (based on audience activity)'
      }
    };
  }
}

export default TwitterFollowerScraperNode;

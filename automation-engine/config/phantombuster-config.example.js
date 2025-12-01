/**
 * PhantomBuster Configuration Example
 * Copy this file to phantombuster-config.js and fill in your actual agent IDs
 */

export const phantombusterConfig = {
  // API credentials (set in .env)
  apiKey: process.env.PHANTOMBUSTER_API_KEY,

  // Agent configurations for each segment
  segments: {
    partners: {
      enabled: true,
      agents: {
        // LinkedIn Profile Scraper
        profileScraper: {
          agentId: 'YOUR_PROFILE_SCRAPER_AGENT_ID', // Get from PhantomBuster dashboard
          phantomType: 'profile-scraper',
          argument: {
            numberOfProfilesPerLaunch: 50,
            csvName: 'partners_profiles',
            takeScreenshot: false
          }
        },

        // Email Extractor
        emailExtractor: {
          agentId: 'YOUR_EMAIL_EXTRACTOR_AGENT_ID',
          phantomType: 'email-extractor',
          argument: {
            numberOfProfilesPerLaunch: 100,
            csvName: 'partners_emails'
          }
        },

        // Network Booster (Connection Requests)
        networkBooster: {
          agentId: 'YOUR_NETWORK_BOOSTER_AGENT_ID',
          phantomType: 'network-booster',
          argument: {
            numberOfConnectionsPerLaunch: 20, // LinkedIn safe limit
            message: 'Hi {firstName}, noticed you run {companyName} in the financial advisory space. We\'re PL Capital, an 80-year-old PMS firm with industry-leading quant strategies. Would love to explore partnership opportunities that could add value to your client offerings.',
            csvName: 'partners_connections',
            onlySecondCircle: true
          }
        },

        // Message Sender (Follow-ups)
        messageSender: {
          agentId: 'YOUR_MESSAGE_SENDER_AGENT_ID',
          phantomType: 'message-sender',
          argument: {
            numberOfMessagesPerLaunch: 30,
            messageColumn: 'Custom Message',
            csvName: 'partners_messages'
          }
        }
      }
    },

    hni: {
      enabled: true,
      agents: {
        profileScraper: {
          agentId: 'YOUR_HNI_PROFILE_SCRAPER_AGENT_ID',
          phantomType: 'profile-scraper',
          argument: {
            numberOfProfilesPerLaunch: 100,
            csvName: 'hni_profiles'
          }
        },

        emailExtractor: {
          agentId: 'YOUR_HNI_EMAIL_EXTRACTOR_AGENT_ID',
          phantomType: 'email-extractor',
          argument: {
            numberOfProfilesPerLaunch: 200,
            csvName: 'hni_emails'
          }
        },

        profileVisitor: {
          agentId: 'YOUR_HNI_PROFILE_VISITOR_AGENT_ID',
          phantomType: 'profile-visitor',
          argument: {
            numberOfVisitsPerLaunch: 100,
            csvName: 'hni_profile_visits'
          }
        },

        networkBooster: {
          agentId: 'YOUR_HNI_NETWORK_BOOSTER_AGENT_ID',
          phantomType: 'network-booster',
          argument: {
            numberOfConnectionsPerLaunch: 30,
            message: 'Hi {firstName}, impressed by your background at {currentCompany}. As a fellow {industry} professional, I thought you might find PL Capital\'s systematic investment approach interesting. Our AQUA fund has delivered 76% returns over 18 months through a disciplined quant strategy. Would love to connect!',
            csvName: 'hni_connections'
          }
        },

        messageSender: {
          agentId: 'YOUR_HNI_MESSAGE_SENDER_AGENT_ID',
          phantomType: 'message-sender',
          argument: {
            numberOfMessagesPerLaunch: 40,
            messageColumn: 'Custom Message',
            csvName: 'hni_messages'
          }
        }
      }
    },

    uhni: {
      enabled: true,
      agents: {
        profileScraper: {
          agentId: 'YOUR_UHNI_PROFILE_SCRAPER_AGENT_ID',
          phantomType: 'profile-scraper',
          argument: {
            numberOfProfilesPerLaunch: 20, // Smaller batches for UHNIs
            csvName: 'uhni_profiles',
            takeScreenshot: true // Capture profile screenshots for research
          }
        },

        profileVisitor: {
          agentId: 'YOUR_UHNI_PROFILE_VISITOR_AGENT_ID',
          phantomType: 'profile-visitor',
          argument: {
            numberOfVisitsPerLaunch: 50, // Soft engagement
            csvName: 'uhni_profile_visits'
          }
        },

        autoCommenter: {
          agentId: 'YOUR_UHNI_AUTO_COMMENTER_AGENT_ID',
          phantomType: 'auto-commenter',
          argument: {
            numberOfCommentsPerLaunch: 10, // Very limited, high-quality comments
            csvName: 'uhni_comments'
          }
        }

        // Note: For UHNIs, avoid automated connection requests
        // Use manual/warm introductions instead
      }
    },

    mass_affluent: {
      enabled: true,
      agents: {
        emailExtractor: {
          agentId: 'YOUR_MASS_EMAIL_EXTRACTOR_AGENT_ID',
          phantomType: 'email-extractor',
          argument: {
            numberOfProfilesPerLaunch: 500, // Bulk processing
            csvName: 'mass_affluent_emails'
          }
        },

        profileVisitor: {
          agentId: 'YOUR_MASS_PROFILE_VISITOR_AGENT_ID',
          phantomType: 'profile-visitor',
          argument: {
            numberOfVisitsPerLaunch: 150,
            csvName: 'mass_affluent_visits'
          }
        },

        networkBooster: {
          agentId: 'YOUR_MASS_NETWORK_BOOSTER_AGENT_ID',
          phantomType: 'network-booster',
          argument: {
            numberOfConnectionsPerLaunch: 25,
            message: 'Hi {firstName}, noticed your background in {industry}. I share content about systematic investing and wealth creation strategies. Would love to connect!',
            csvName: 'mass_affluent_connections'
          }
        }
      }
    }
  },

  // Global safety limits
  safetyLimits: {
    maxConnectionRequestsPerDay: 30,
    maxMessagesPerDay: 50,
    maxProfileVisitsPerDay: 150,
    maxCommentsPerDay: 15,
    minDelayBetweenActions: 10000, // 10 seconds
    warmupPeriodDays: 14 // Account warmup period
  },

  // Polling configuration
  polling: {
    interval: 30000, // 30 seconds
    maxWaitTime: 1800000 // 30 minutes
  },

  // LinkedIn account configuration
  linkedinAccount: {
    type: 'DEDICATED', // DEDICATED or SALES_NAVIGATOR
    email: 'your-linkedin-email@domain.com', // For reference only
    warmedUp: false, // Set to true after 2-week warmup
    createdDate: '2025-10-23' // Track account age
  },

  // Cost tracking
  executionTimeTracking: {
    monthlyLimit: 80, // hours (Pro plan)
    alertThresholds: [0.5, 0.75, 0.9] // 50%, 75%, 90%
  }
};

export default phantombusterConfig;

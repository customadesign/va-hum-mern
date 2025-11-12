const User = require('../models/User');
const Conversation = require('../models/Conversation');
const VA = require('../models/VA');
const Business = require('../models/Business');

class OnboardingService {
  /**
   * Get or create the system admin user for E Systems
   */
  static async getSystemAdminUser() {
    // Check if system admin already exists
    let systemAdmin = await User.findOne({
      isSystem: true,
      systemName: 'E Systems Admin'
    });

    if (!systemAdmin) {
      // Create the system admin user
      systemAdmin = new User({
        email: 'admin@esystems.linkage.com',
        name: 'E Systems Admin',
        firstName: 'E Systems',
        lastName: 'Admin',
        displayName: 'E Systems Admin',
        role: 'business',
        brand: 'esystems',
        isSystem: true,
        systemName: 'E Systems Admin',
        admin: true,
        isVerified: true,
        confirmedAt: new Date(),
        password: require('crypto').randomBytes(32).toString('hex'), // Random unguessable password
        provider: 'local',
        inboxEnabled: false, // System accounts don't receive regular messages
        preferences: {
          notifications: {
            email: { enabled: false },
            push: { enabled: false },
            sms: { enabled: false }
          }
        }
      });

      await systemAdmin.save();
      console.log('Created E Systems Admin system user');
    }

    return systemAdmin;
  }

  /**
   * Check if a user has already received onboarding
   */
  static async hasReceivedOnboarding(userId) {
    const existingOnboarding = await Conversation.findOne({
      participants: userId,
      isSystemConversation: true,
      systemConversationType: 'onboarding'
    });

    return !!existingOnboarding;
  }

  /**
   * Create onboarding conversation for a user
   */
  static async createOnboardingConversation(user) {
    try {
      // Check if user already has onboarding (idempotency)
      if (await this.hasReceivedOnboarding(user._id)) {
        console.log(`User ${user.email} already has onboarding conversation`);
        return null;
      }

      // Get or create system admin
      const systemAdmin = await this.getSystemAdminUser();

      // Determine user type
      let isVA = false;
      let isBusiness = false;

      // Check if user has VA profile
      if (user.va) {
        isVA = true;
      } else if (user.business) {
        isBusiness = true;
      } else if (user.role === 'va') {
        isVA = true;
      } else if (user.role === 'business') {
        isBusiness = true;
      } else {
        // For users without a role, check if they have VA or Business model
        const vaProfile = await VA.findOne({ user: user._id });
        const businessProfile = await Business.findOne({ user: user._id });

        if (vaProfile) {
          isVA = true;
        } else if (businessProfile) {
          isBusiness = true;
        } else {
          // Default to business if no profile exists yet
          isBusiness = true;
        }
      }

      // Create messages array
      const messages = [];

      // First message (same for all)
      const welcomeMessage = {
        sender: systemAdmin._id,
        content: "Welcome to Messages. This is your private inbox for conversations on E Systems. To start a chat, open any profile and select Message. Keep all hiring discussions on-platform so everything stays secure and organized. You'll see new replies here and get notified when someone responds.",
        systemCategory: 'onboarding',
        skipNotification: true,
        read: false,
        createdAt: new Date()
      };
      messages.push(welcomeMessage);

      // Second message (role-specific)
      let roleSpecificMessage;
      if (isVA) {
        // Message for VAs with Dashboard link
        roleSpecificMessage = {
          sender: systemAdmin._id,
          content: 'Complete your profile to get matched and hired faster. Profiles with a photo, skills, experience, availability, and a clear bio appear higher in search and receive more messages from businesses. Finish your profile now in your <a href="/dashboard">Dashboard</a>.',
          systemCategory: 'onboarding',
          skipNotification: true,
          read: false,
          createdAt: new Date(Date.now() + 1000) // 1 second later
        };
      } else {
        // Message for Businesses with Dashboard link
        roleSpecificMessage = {
          sender: systemAdmin._id,
          content: 'Complete your company profile to attract the right VAs and improve response rates. Adding your company details, role requirements, and preferences builds trust and leads to better matches. Finish your profile now in your <a href="/dashboard">Dashboard</a>.',
          systemCategory: 'onboarding',
          skipNotification: true,
          read: false,
          createdAt: new Date(Date.now() + 1000) // 1 second later
        };
      }
      messages.push(roleSpecificMessage);

      // Create the conversation
      // For system conversations, we set both va and business fields
      // The actual user type is determined by isVA/isBusiness flags
      const conversation = new Conversation({
        participants: [user._id, systemAdmin._id],
        va: isVA ? user._id : systemAdmin._id,
        business: isBusiness ? user._id : systemAdmin._id,
        messages: messages,
        lastMessage: roleSpecificMessage.content,
        lastMessageAt: roleSpecificMessage.createdAt,
        isSystemConversation: true,
        systemConversationType: 'onboarding',
        isOnboardingConversation: true,
        unreadCount: {
          va: isVA ? 2 : 0,
          business: isBusiness ? 2 : 0,
          admin: 0
        },
        status: 'active'
      });

      await conversation.save();

      console.log(`Created onboarding conversation for user ${user.email} (${isVA ? 'VA' : 'Business'})`);
      return conversation;

    } catch (error) {
      console.error('Error creating onboarding conversation:', error);
      throw error;
    }
  }

  /**
   * Check and create onboarding if needed when user accesses conversations
   */
  static async checkAndCreateOnboarding(user) {
    try {
      // Skip for system accounts
      if (user.isSystem) {
        return null;
      }

      // Check if user already has onboarding
      if (await this.hasReceivedOnboarding(user._id)) {
        return null;
      }

      // Check if user has any conversations at all
      const conversationCount = await Conversation.countDocuments({
        participants: user._id
      });

      // Only create onboarding if user has no conversations
      if (conversationCount === 0) {
        return await this.createOnboardingConversation(user);
      }

      return null;
    } catch (error) {
      console.error('Error checking/creating onboarding:', error);
      // Don't throw - we don't want to break conversation access if onboarding fails
      return null;
    }
  }

  /**
   * Backfill onboarding for existing users who have no conversations
   */
  static async backfillOnboarding() {
    try {
      console.log('Starting onboarding backfill...');

      // Get all non-system users
      const users = await User.find({
        isSystem: { $ne: true }
      });

      let created = 0;
      let skipped = 0;

      for (const user of users) {
        // Check if user has any conversations
        const hasConversations = await Conversation.exists({
          participants: user._id
        });

        if (!hasConversations) {
          // User has no conversations, create onboarding
          const result = await this.createOnboardingConversation(user);
          if (result) {
            created++;
            console.log(`Created onboarding for ${user.email}`);
          } else {
            skipped++;
          }
        } else {
          skipped++;
        }
      }

      console.log(`Backfill complete. Created: ${created}, Skipped: ${skipped}`);
      return { created, skipped };

    } catch (error) {
      console.error('Error during onboarding backfill:', error);
      throw error;
    }
  }
}

module.exports = OnboardingService;
/* Migration: Remove unsupported third-party integrations
   Removes: Slack, Discord, Trello, Asana, Salesforce, HubSpot, Jira
   Usage:
     NODE_ENV=production MONGODB_URI="mongodb+srv://..." node backend/scripts/migrations/remove-slack-discord.js
*/

const mongoose = require('mongoose');

async function main() {
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    'mongodb://localhost:27017/linkagevahub';

  try {
    console.log(
      '[migration] Connecting to MongoDB:',
      (uri || '').replace(/\/\/.*@/, '//****:****@')
    );

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000
    });

    const SiteConfig = mongoose.connection.collection('siteconfigs');
    const BusinessSettings = mongoose.connection.collection('businesssettings');
    const Integrations = mongoose.connection.collection('integrations');

    // 1) SiteConfig: remove all unsupported integration keys
    //    Removes keys like: notifications.slack.*, integrations.discord.*, etc.
    //    For all 7 removed integrations: slack, discord, trello, asana, salesforce, hubspot, jira
    console.log('[migration] Removing unsupported integration SiteConfig keys...');
    let siteConfigDeleted = 0;
    try {
      const removedToolsRegex = /^(notifications|integrations)\.(slack|discord|trello|asana|salesforce|hubspot|jira)(\.|$)/i;
      const res = await SiteConfig.deleteMany({
        key: { $regex: removedToolsRegex }
      });
      siteConfigDeleted = res?.deletedCount || 0;
    } catch (e) {
      console.error('[migration] SiteConfig deleteMany error:', e.message);
    }
    console.log('[migration] SiteConfig keys removed count:', siteConfigDeleted);

    // 2) BusinessSettings: normalize preferredChannel for removed integrations => 'platform'
    console.log(
      "[migration] Normalizing BusinessSettings preferences.communicationPreferences.preferredChannel (removed integrations -> 'platform')..."
    );
    let bsModified = 0;
    try {
      const removedChannels = ['slack', 'discord', 'trello', 'asana'];
      const res = await BusinessSettings.updateMany(
        { 'preferences.communicationPreferences.preferredChannel': { $in: removedChannels } },
        { $set: { 'preferences.communicationPreferences.preferredChannel': 'platform' } }
      );
      bsModified = res?.modifiedCount || 0;
    } catch (e) {
      console.error('[migration] BusinessSettings updateMany error:', e.message);
    }
    console.log('[migration] BusinessSettings docs modified:', bsModified);

    // 3) Integrations: delete all removed integration types
    //    Remove: slack, discord, trello, asana, salesforce, hubspot, jira
    console.log('[migration] Deleting Integration documents with removed types...');
    let intDeleted = 0;
    try {
      const removedTypes = ['slack', 'discord', 'trello', 'asana', 'salesforce', 'hubspot', 'jira'];
      const res = await Integrations.deleteMany({
        type: { $in: removedTypes }
      });
      intDeleted = res?.deletedCount || 0;
    } catch (e) {
      console.error('[migration] Integrations deleteMany error:', e.message);
    }
    console.log('[migration] Integration documents deleted:', intDeleted);

    // 4) Optional: remove any dangling SiteConfig values referencing removed integrations in generic keys
    console.log('[migration] Scrubbing generic SiteConfig values that include removed integration strings...');
    let scrubbed = 0;
    try {
      // Find candidate keys that may carry free-form strings
      const removedToolsStringRegex = /(slack|discord|trello|asana|salesforce|hubspot|jira)/i;
      const cursor = SiteConfig.find({
        value: { $type: 'string', $regex: removedToolsStringRegex }
      }).project({ _id: 1, key: 1, value: 1 });

      // For safety: we will just unset the value entirely
      // (If you want to preserve, implement a mapper instead.)
      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        await SiteConfig.updateOne({ _id: doc._id }, { $unset: { value: '' } });
        scrubbed++;
      }
    } catch (e) {
      console.warn('[migration] SiteConfig scrub warning:', e.message);
    }
    console.log('[migration] SiteConfig values scrubbed:', scrubbed);

    console.log('[migration] Completed successfully.');
  } catch (err) {
    console.error('[migration] Fatal error:', err.message);
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit();
  }
}

main();
/* Check what would be removed by the integration cleanup migration
   Reports counts without making changes
   Usage:
     MONGODB_URI="mongodb+srv://..." node backend/scripts/migrations/check-removal-impact.js
*/

const mongoose = require('mongoose');

async function main() {
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    'mongodb://localhost:27017/linkagevahub';

  try {
    console.log(
      '[check] Connecting to MongoDB:',
      (uri || '').replace(/\/\/.*@/, '//****:****@')
    );

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000
    });

    const SiteConfig = mongoose.connection.collection('siteconfigs');
    const BusinessSettings = mongoose.connection.collection('businesssettings');
    const Integrations = mongoose.connection.collection('integrations');

    console.log('\n=== IMPACT ANALYSIS ===\n');

    // 1) SiteConfig keys that would be deleted
    const removedToolsRegex = /^(notifications|integrations)\.(slack|discord|trello|asana|salesforce|hubspot|jira)(\.|$)/i;
    const siteConfigCount = await SiteConfig.countDocuments({
      key: { $regex: removedToolsRegex }
    });
    console.log(`[SiteConfig] Keys matching removed integrations: ${siteConfigCount}`);

    if (siteConfigCount > 0) {
      const samples = await SiteConfig.find({ key: { $regex: removedToolsRegex } })
        .limit(5)
        .project({ key: 1, value: 1 })
        .toArray();
      console.log('[SiteConfig] Sample keys:');
      samples.forEach(doc => console.log(`  - ${doc.key}: ${JSON.stringify(doc.value).substring(0, 50)}...`));
    }

    // 2) BusinessSettings with removed preferredChannel
    const removedChannels = ['slack', 'discord', 'trello', 'asana'];
    const businessSettingsCount = await BusinessSettings.countDocuments({
      'preferences.communicationPreferences.preferredChannel': { $in: removedChannels }
    });
    console.log(`\n[BusinessSettings] Documents with removed preferredChannel: ${businessSettingsCount}`);

    if (businessSettingsCount > 0) {
      const samples = await BusinessSettings.find({
        'preferences.communicationPreferences.preferredChannel': { $in: removedChannels }
      })
        .limit(5)
        .project({ businessId: 1, 'preferences.communicationPreferences.preferredChannel': 1 })
        .toArray();
      console.log('[BusinessSettings] Sample channels:');
      samples.forEach(doc => console.log(`  - Business ${doc.businessId}: ${doc.preferences?.communicationPreferences?.preferredChannel}`));
    }

    // 3) Integration documents that would be deleted
    const removedTypes = ['slack', 'discord', 'trello', 'asana', 'salesforce', 'hubspot', 'jira'];
    const integrationsCount = await Integrations.countDocuments({
      type: { $in: removedTypes }
    });
    console.log(`\n[Integrations] Documents to be deleted: ${integrationsCount}`);

    if (integrationsCount > 0) {
      const typeCounts = await Integrations.aggregate([
        { $match: { type: { $in: removedTypes } } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]).toArray();
      console.log('[Integrations] Breakdown by type:');
      typeCounts.forEach(item => console.log(`  - ${item._id}: ${item.count}`));
    }

    // 4) SiteConfig string values containing removed tool names
    const removedToolsStringRegex = /(slack|discord|trello|asana|salesforce|hubspot|jira)/i;
    const stringValueCount = await SiteConfig.countDocuments({
      value: { $type: 'string', $regex: removedToolsStringRegex }
    });
    console.log(`\n[SiteConfig] String values containing removed tool names: ${stringValueCount}`);

    if (stringValueCount > 0) {
      const samples = await SiteConfig.find({
        value: { $type: 'string', $regex: removedToolsStringRegex }
      })
        .limit(5)
        .project({ key: 1, value: 1 })
        .toArray();
      console.log('[SiteConfig] Sample string values:');
      samples.forEach(doc => console.log(`  - ${doc.key}: ${doc.value?.substring(0, 80)}...`));
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Total SiteConfig keys to delete: ${siteConfigCount}`);
    console.log(`Total BusinessSettings to update: ${businessSettingsCount}`);
    console.log(`Total Integration documents to delete: ${integrationsCount}`);
    console.log(`Total SiteConfig string values to scrub: ${stringValueCount}`);
    console.log(`\nTotal operations: ${siteConfigCount + businessSettingsCount + integrationsCount + stringValueCount}`);

  } catch (err) {
    console.error('[check] Fatal error:', err.message);
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit();
  }
}

main();
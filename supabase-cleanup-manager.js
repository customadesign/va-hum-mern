const { createClient } = require('@supabase/supabase-js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
// Note: node-cron package would need to be installed for scheduled cleanup
// const cron = require('node-cron');

// Load environment variables
require('dotenv').config();

// Import models
const User = require('./backend/models/User');
const VA = require('./backend/models/VA');
const Business = require('./backend/models/Business');

// Supabase Storage Cleanup Manager
class SupabaseCleanupManager {
  constructor() {
    this.supabaseClient = null;
    this.cleanupResults = {
      connection: null,
      orphanedFileCleanup: [],
      duplicateFileCleanup: [],
      oldFileCleanup: [],
      brokenLinkCleanup: [],
      storageOptimization: [],
      scheduledCleanup: [],
      performanceMetrics: [],
      errors: []
    };
    
    this.cleanupConfig = {
      orphanedFileRetentionDays: 30,
      duplicateFileThreshold: 0.95, // 95% similarity
      oldFileRetentionDays: 365,
      brokenLinkGracePeriod: 7, // days
      maxFileAge: 730, // 2 years
      cleanupBatchSize: 100,
      enableScheduledCleanup: false
    };
    
    this.cleanupMetrics = {
      filesAnalyzed: 0,
      filesDeleted: 0,
      bytesFreed: 0,
      orphansFound: 0,
      duplicatesFound: 0,
      brokenLinksFixed: 0,
      errors: 0
    };
    
    this.scheduledJobs = [];
  }

  async initialize() {
    try {
      console.log('🔧 Initializing Supabase Cleanup Manager...');
      
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials not configured');
      }
      
      this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      // Initialize MongoDB
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
      
      console.log('✅ Cleanup Manager initialized successfully');
      this.cleanupResults.connection = 'SUCCESS';
      
      return true;
    } catch (error) {
      console.error('❌ Cleanup Manager initialization failed:', error.message);
      this.cleanupResults.connection = 'FAILED: ' + error.message;
      this.cleanupResults.errors.push(`Initialization: ${error.message}`);
      return false;
    }
  }

  async findOrphanedFiles() {
    console.log('\n🔍 Finding Orphaned Files...');
    
    try {
      const orphanedFiles = [];
      const buckets = ['profile-images', 'va-videos', 'business-assets', 'admin-uploads'];
      
      for (const bucketName of buckets) {
        console.log(`📦 Scanning bucket: ${bucketName}`);
        
        try {
          const { data: files, error } = await this.supabaseClient.storage
            .from(bucketName)
            .list('', { 
              limit: 1000,
              sortBy: { column: 'created_at', order: 'asc' }
            });
          
          if (error) {
            console.log(`⚠️ Cannot scan bucket '${bucketName}': ${error.message}`);
            continue;
          }
          
          console.log(`📁 Found ${files.length} files in ${bucketName}`);
          this.cleanupMetrics.filesAnalyzed += files.length;
          
          // Check each file for orphan status
          for (const file of files) {
            const isOrphaned = await this.checkIfFileIsOrphaned(bucketName, file);
            
            if (isOrphaned) {
              const fileAge = Date.now() - new Date(file.created_at).getTime();
              const ageInDays = fileAge / (1000 * 60 * 60 * 24);
              
              if (ageInDays > this.cleanupConfig.orphanedFileRetentionDays) {
                orphanedFiles.push({
                  bucket: bucketName,
                  name: file.name,
                  size: parseInt(file.metadata?.size || 0),
                  createdAt: file.created_at,
                  ageInDays: Math.floor(ageInDays),
                  reason: 'No database reference found'
                });
                
                this.cleanupMetrics.orphansFound++;
              }
            }
          }
          
        } catch (error) {
          console.log(`❌ Error scanning bucket '${bucketName}': ${error.message}`);
          this.cleanupResults.errors.push(`Bucket scan ${bucketName}: ${error.message}`);
        }
      }
      
      console.log(`📊 Orphaned Files Found: ${orphanedFiles.length}`);
      console.log(`📏 Total Size: ${this.formatBytes(orphanedFiles.reduce((sum, file) => sum + file.size, 0))}`);
      
      this.cleanupResults.orphanedFileCleanup.push(`ORPHANED_FILES_FOUND: ${orphanedFiles.length}`);
      
      return orphanedFiles;
      
    } catch (error) {
      console.error('❌ Orphaned file discovery failed:', error.message);
      this.cleanupResults.orphanedFileCleanup.push('DISCOVERY_FAILED: ' + error.message);
      this.cleanupResults.errors.push(`Orphaned File Discovery: ${error.message}`);
      return [];
    }
  }

  async checkIfFileIsOrphaned(bucket, file) {
    try {
      // Extract potential identifiers from filename
      const fileName = file.name;
      const fileUrl = this.constructSupabaseUrl(bucket, fileName);
      
      // Check if any database record references this file
      const [vaMatch, businessMatch, userMatch] = await Promise.all([
        VA.findOne({
          $or: [
            { avatar: fileUrl },
            { coverImage: fileUrl },
            { videoIntroduction: fileUrl }
          ]
        }),
        Business.findOne({ avatar: fileUrl }),
        User.findOne({
          $or: [
            { avatar: fileUrl },
            { coverImage: fileUrl }
          ]
        })
      ]);
      
      // If no matches found, it's orphaned
      return !vaMatch && !businessMatch && !userMatch;
      
    } catch (error) {
      console.log(`⚠️ Error checking orphan status for ${file.name}: ${error.message}`);
      return false; // Conservative approach - don't mark as orphan if check fails
    }
  }

  constructSupabaseUrl(bucket, fileName) {
    const supabaseUrl = process.env.SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${fileName}`;
  }

  async findDuplicateFiles() {
    console.log('\n🔍 Finding Duplicate Files...');
    
    try {
      const duplicates = [];
      const buckets = ['profile-images', 'va-videos', 'business-assets'];
      
      for (const bucketName of buckets) {
        console.log(`🔍 Scanning for duplicates in: ${bucketName}`);
        
        const { data: files, error } = await this.supabaseClient.storage
          .from(bucketName)
          .list('', { limit: 1000 });
        
        if (error) {
          console.log(`⚠️ Cannot scan bucket '${bucketName}': ${error.message}`);
          continue;
        }
        
        // Group files by size and name similarity
        const fileGroups = this.groupSimilarFiles(files);
        
        for (const group of fileGroups) {
          if (group.length > 1) {
            // Sort by creation date, keep the newest
            group.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            const toKeep = group[0];
            const toDelete = group.slice(1);
            
            duplicates.push({
              bucket: bucketName,
              keep: toKeep.name,
              delete: toDelete.map(f => f.name),
              reason: 'Duplicate files detected',
              sizeToFree: toDelete.reduce((sum, f) => sum + parseInt(f.metadata?.size || 0), 0)
            });
            
            this.cleanupMetrics.duplicatesFound += toDelete.length;
          }
        }
      }
      
      console.log(`📊 Duplicate Groups Found: ${duplicates.length}`);
      const totalDuplicates = duplicates.reduce((sum, group) => sum + group.delete.length, 0);
      console.log(`📏 Total Duplicates: ${totalDuplicates}`);
      
      this.cleanupResults.duplicateFileCleanup.push(`DUPLICATE_GROUPS: ${duplicates.length}`);
      this.cleanupResults.duplicateFileCleanup.push(`TOTAL_DUPLICATES: ${totalDuplicates}`);
      
      return duplicates;
      
    } catch (error) {
      console.error('❌ Duplicate file discovery failed:', error.message);
      this.cleanupResults.duplicateFileCleanup.push('DISCOVERY_FAILED: ' + error.message);
      this.cleanupResults.errors.push(`Duplicate File Discovery: ${error.message}`);
      return [];
    }
  }

  groupSimilarFiles(files) {
    const groups = [];
    const processed = new Set();
    
    for (let i = 0; i < files.length; i++) {
      if (processed.has(i)) continue;
      
      const currentFile = files[i];
      const group = [currentFile];
      processed.add(i);
      
      // Find similar files
      for (let j = i + 1; j < files.length; j++) {
        if (processed.has(j)) continue;
        
        const compareFile = files[j];
        
        // Check similarity based on size and name pattern
        const sizeSimilar = Math.abs(
          (parseInt(currentFile.metadata?.size || 0) - parseInt(compareFile.metadata?.size || 0)) /
          Math.max(parseInt(currentFile.metadata?.size || 1), parseInt(compareFile.metadata?.size || 1))
        ) < 0.05; // 5% size difference tolerance
        
        const nameSimilar = this.calculateNameSimilarity(currentFile.name, compareFile.name) > 0.8;
        
        if (sizeSimilar && nameSimilar) {
          group.push(compareFile);
          processed.add(j);
        }
      }
      
      if (group.length > 1) {
        groups.push(group);
      }
    }
    
    return groups;
  }

  calculateNameSimilarity(name1, name2) {
    // Simple similarity calculation based on common characters
    const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const norm1 = normalize(name1);
    const norm2 = normalize(name2);
    
    if (norm1 === norm2) return 1.0;
    
    const longer = norm1.length > norm2.length ? norm1 : norm2;
    const shorter = norm1.length > norm2.length ? norm2 : norm1;
    
    if (longer.length === 0) return 1.0;
    
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) matches++;
    }
    
    return matches / longer.length;
  }

  async findBrokenLinks() {
    console.log('\n🔍 Finding Broken Links...');
    
    try {
      const brokenLinks = [];
      
      // Check VA media links
      const vas = await VA.find({
        $or: [
          { avatar: { $regex: /supabase/ } },
          { coverImage: { $regex: /supabase/ } },
          { videoIntroduction: { $regex: /supabase/ } }
        ]
      }).select('_id name avatar coverImage videoIntroduction');
      
      for (const va of vas) {
        if (va.avatar && va.avatar.includes('supabase')) {
          const accessible = await this.checkFileAccessibility(va.avatar);
          if (!accessible) {
            brokenLinks.push({
              entityType: 'VA',
              entityId: va._id,
              entityName: va.name,
              fieldName: 'avatar',
              url: va.avatar,
              reason: 'File not accessible in Supabase'
            });
          }
        }
        
        if (va.coverImage && va.coverImage.includes('supabase')) {
          const accessible = await this.checkFileAccessibility(va.coverImage);
          if (!accessible) {
            brokenLinks.push({
              entityType: 'VA',
              entityId: va._id,
              entityName: va.name,
              fieldName: 'coverImage',
              url: va.coverImage,
              reason: 'File not accessible in Supabase'
            });
          }
        }
        
        if (va.videoIntroduction && va.videoIntroduction.includes('supabase')) {
          const accessible = await this.checkFileAccessibility(va.videoIntroduction);
          if (!accessible) {
            brokenLinks.push({
              entityType: 'VA',
              entityId: va._id,
              entityName: va.name,
              fieldName: 'videoIntroduction',
              url: va.videoIntroduction,
              reason: 'File not accessible in Supabase'
            });
          }
        }
      }
      
      // Check Business media links
      const businesses = await Business.find({
        avatar: { $regex: /supabase/ }
      }).select('_id company avatar');
      
      for (const business of businesses) {
        if (business.avatar && business.avatar.includes('supabase')) {
          const accessible = await this.checkFileAccessibility(business.avatar);
          if (!accessible) {
            brokenLinks.push({
              entityType: 'Business',
              entityId: business._id,
              entityName: business.company,
              fieldName: 'avatar',
              url: business.avatar,
              reason: 'File not accessible in Supabase'
            });
          }
        }
      }
      
      // Check User media links
      const users = await User.find({
        $or: [
          { avatar: { $regex: /supabase/ } },
          { coverImage: { $regex: /supabase/ } }
        ]
      }).select('_id email avatar coverImage');
      
      for (const user of users) {
        if (user.avatar && user.avatar.includes('supabase')) {
          const accessible = await this.checkFileAccessibility(user.avatar);
          if (!accessible) {
            brokenLinks.push({
              entityType: 'User',
              entityId: user._id,
              entityName: user.email,
              fieldName: 'avatar',
              url: user.avatar,
              reason: 'File not accessible in Supabase'
            });
          }
        }
        
        if (user.coverImage && user.coverImage.includes('supabase')) {
          const accessible = await this.checkFileAccessibility(user.coverImage);
          if (!accessible) {
            brokenLinks.push({
              entityType: 'User',
              entityId: user._id,
              entityName: user.email,
              fieldName: 'coverImage',
              url: user.coverImage,
              reason: 'File not accessible in Supabase'
            });
          }
        }
      }
      
      console.log(`📊 Broken Links Found: ${brokenLinks.length}`);
      this.cleanupMetrics.brokenLinksFixed = brokenLinks.length;
      this.cleanupResults.brokenLinkCleanup.push(`BROKEN_LINKS_FOUND: ${brokenLinks.length}`);
      
      return brokenLinks;
      
    } catch (error) {
      console.error('❌ Broken link discovery failed:', error.message);
      this.cleanupResults.brokenLinkCleanup.push('DISCOVERY_FAILED: ' + error.message);
      this.cleanupResults.errors.push(`Broken Link Discovery: ${error.message}`);
      return [];
    }
  }

  async checkFileAccessibility(url) {
    try {
      // Extract bucket and file path from URL
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const publicIndex = pathParts.indexOf('public');
      
      if (publicIndex === -1) return false;
      
      const bucket = pathParts[publicIndex + 1];
      const filePath = pathParts.slice(publicIndex + 2).join('/');
      
      // Try to get file metadata
      const { data, error } = await this.supabaseClient.storage
        .from(bucket)
        .list(path.dirname(filePath), {
          search: path.basename(filePath)
        });
      
      return !error && data && data.length > 0;
      
    } catch (error) {
      return false;
    }
  }

  async cleanupOrphanedFiles(orphanedFiles, dryRun = false) {
    console.log(`\n🧹 ${dryRun ? 'DRY RUN: Simulating' : 'Starting'} Orphaned File Cleanup...`);
    
    try {
      if (orphanedFiles.length === 0) {
        console.log('✅ No orphaned files to clean up');
        return { cleaned: 0, errors: 0 };
      }
      
      let cleanedCount = 0;
      let errorCount = 0;
      let bytesFreed = 0;
      
      for (const file of orphanedFiles) {
        try {
          console.log(`  🗑️ ${dryRun ? 'Would delete' : 'Deleting'}: ${file.bucket}/${file.name} (${this.formatBytes(file.size)})`);
          
          if (!dryRun) {
            const { error } = await this.supabaseClient.storage
              .from(file.bucket)
              .remove([file.name]);
            
            if (error) {
              console.log(`    ❌ Delete failed: ${error.message}`);
              errorCount++;
            } else {
              console.log(`    ✅ Deleted successfully`);
              cleanedCount++;
              bytesFreed += file.size;
              this.cleanupMetrics.filesDeleted++;
              this.cleanupMetrics.bytesFreed += file.size;
            }
          } else {
            cleanedCount++;
            bytesFreed += file.size;
          }
          
        } catch (error) {
          console.log(`    ❌ Cleanup error: ${error.message}`);
          errorCount++;
          this.cleanupMetrics.errors++;
        }
      }
      
      console.log(`📊 Orphaned File Cleanup Summary:`);
      console.log(`  Files ${dryRun ? 'Would Be' : ''} Cleaned: ${cleanedCount}`);
      console.log(`  Errors: ${errorCount}`);
      console.log(`  Storage ${dryRun ? 'Would Be' : ''} Freed: ${this.formatBytes(bytesFreed)}`);
      
      this.cleanupResults.orphanedFileCleanup.push(`CLEANUP_COMPLETED: ${cleanedCount} files, ${this.formatBytes(bytesFreed)} freed`);
      
      return { cleaned: cleanedCount, errors: errorCount, bytesFreed };
      
    } catch (error) {
      console.error('❌ Orphaned file cleanup failed:', error.message);
      this.cleanupResults.orphanedFileCleanup.push('CLEANUP_FAILED: ' + error.message);
      this.cleanupResults.errors.push(`Orphaned File Cleanup: ${error.message}`);
      return { cleaned: 0, errors: 1 };
    }
  }

  async cleanupDuplicateFiles(duplicates, dryRun = false) {
    console.log(`\n🧹 ${dryRun ? 'DRY RUN: Simulating' : 'Starting'} Duplicate File Cleanup...`);
    
    try {
      if (duplicates.length === 0) {
        console.log('✅ No duplicate files to clean up');
        return { cleaned: 0, errors: 0 };
      }
      
      let cleanedCount = 0;
      let errorCount = 0;
      let bytesFreed = 0;
      
      for (const duplicateGroup of duplicates) {
        console.log(`  🔍 Processing duplicate group in ${duplicateGroup.bucket}:`);
        console.log(`    Keeping: ${duplicateGroup.keep}`);
        console.log(`    ${dryRun ? 'Would delete' : 'Deleting'}: ${duplicateGroup.delete.length} files`);
        
        for (const fileName of duplicateGroup.delete) {
          try {
            if (!dryRun) {
              const { error } = await this.supabaseClient.storage
                .from(duplicateGroup.bucket)
                .remove([fileName]);
              
              if (error) {
                console.log(`      ❌ Failed to delete ${fileName}: ${error.message}`);
                errorCount++;
              } else {
                console.log(`      ✅ Deleted ${fileName}`);
                cleanedCount++;
              }
            } else {
              cleanedCount++;
            }
            
          } catch (error) {
            console.log(`      ❌ Error deleting ${fileName}: ${error.message}`);
            errorCount++;
          }
        }
        
        bytesFreed += duplicateGroup.sizeToFree;
      }
      
      console.log(`📊 Duplicate File Cleanup Summary:`);
      console.log(`  Files ${dryRun ? 'Would Be' : ''} Cleaned: ${cleanedCount}`);
      console.log(`  Errors: ${errorCount}`);
      console.log(`  Storage ${dryRun ? 'Would Be' : ''} Freed: ${this.formatBytes(bytesFreed)}`);
      
      this.cleanupResults.duplicateFileCleanup.push(`CLEANUP_COMPLETED: ${cleanedCount} files, ${this.formatBytes(bytesFreed)} freed`);
      
      return { cleaned: cleanedCount, errors: errorCount, bytesFreed };
      
    } catch (error) {
      console.error('❌ Duplicate file cleanup failed:', error.message);
      this.cleanupResults.duplicateFileCleanup.push('CLEANUP_FAILED: ' + error.message);
      this.cleanupResults.errors.push(`Duplicate File Cleanup: ${error.message}`);
      return { cleaned: 0, errors: 1 };
    }
  }

  async cleanupBrokenLinks(brokenLinks, dryRun = false) {
    console.log(`\n🧹 ${dryRun ? 'DRY RUN: Simulating' : 'Starting'} Broken Link Cleanup...`);
    
    try {
      if (brokenLinks.length === 0) {
        console.log('✅ No broken links to clean up');
        return { cleaned: 0, errors: 0 };
      }
      
      let cleanedCount = 0;
      let errorCount = 0;
      
      for (const brokenLink of brokenLinks) {
        try {
          console.log(`  🔧 ${dryRun ? 'Would fix' : 'Fixing'} broken link: ${brokenLink.entityType} ${brokenLink.fieldName}`);
          
          if (!dryRun) {
            // Set field to null to remove broken reference
            if (brokenLink.entityType === 'VA') {
              await VA.findByIdAndUpdate(brokenLink.entityId, { [brokenLink.fieldName]: null });
            } else if (brokenLink.entityType === 'Business') {
              await Business.findByIdAndUpdate(brokenLink.entityId, { [brokenLink.fieldName]: null });
            } else if (brokenLink.entityType === 'User') {
              await User.findByIdAndUpdate(brokenLink.entityId, { [brokenLink.fieldName]: null });
            }
            
            console.log(`    ✅ Database reference cleared`);
            cleanedCount++;
          } else {
            cleanedCount++;
          }
          
        } catch (error) {
          console.log(`    ❌ Error fixing broken link: ${error.message}`);
          errorCount++;
        }
      }
      
      console.log(`📊 Broken Link Cleanup Summary:`);
      console.log(`  Links ${dryRun ? 'Would Be' : ''} Fixed: ${cleanedCount}`);
      console.log(`  Errors: ${errorCount}`);
      
      this.cleanupResults.brokenLinkCleanup.push(`CLEANUP_COMPLETED: ${cleanedCount} links fixed`);
      
      return { cleaned: cleanedCount, errors: errorCount };
      
    } catch (error) {
      console.error('❌ Broken link cleanup failed:', error.message);
      this.cleanupResults.brokenLinkCleanup.push('CLEANUP_FAILED: ' + error.message);
      this.cleanupResults.errors.push(`Broken Link Cleanup: ${error.message}`);
      return { cleaned: 0, errors: 1 };
    }
  }

  async optimizeStorage() {
    console.log('\n⚡ Optimizing Storage...');
    
    try {
      // Analyze storage usage by bucket
      const buckets = ['profile-images', 'va-videos', 'business-assets', 'admin-uploads'];
      const storageAnalysis = {};
      
      for (const bucket of buckets) {
        const analysis = await this.analyzeStorageUsage(bucket);
        storageAnalysis[bucket] = analysis;
      }
      
      // Generate optimization recommendations
      const recommendations = this.generateOptimizationRecommendations(storageAnalysis);
      
      console.log('📊 Storage Optimization Analysis:');
      Object.entries(storageAnalysis).forEach(([bucket, analysis]) => {
        console.log(`  ${bucket}:`);
        console.log(`    Files: ${analysis.fileCount}`);
        console.log(`    Size: ${this.formatBytes(analysis.totalSize)}`);
        console.log(`    Avg File Size: ${this.formatBytes(analysis.averageFileSize)}`);
        console.log(`    Largest File: ${this.formatBytes(analysis.largestFile)}`);
      });
      
      console.log('\n💡 Optimization Recommendations:');
      recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
      
      this.cleanupResults.storageOptimization.push(`STORAGE_ANALYZED: ${buckets.length} buckets`);
      this.cleanupResults.storageOptimization.push(`RECOMMENDATIONS_GENERATED: ${recommendations.length}`);
      
      return { analysis: storageAnalysis, recommendations };
      
    } catch (error) {
      console.error('❌ Storage optimization failed:', error.message);
      this.cleanupResults.storageOptimization.push('FAILED: ' + error.message);
      this.cleanupResults.errors.push(`Storage Optimization: ${error.message}`);
      return null;
    }
  }

  async analyzeStorageUsage(bucket) {
    try {
      const { data: files, error } = await this.supabaseClient.storage
        .from(bucket)
        .list('', { limit: 1000 });
      
      if (error) {
        throw new Error(`Cannot analyze bucket '${bucket}': ${error.message}`);
      }
      
      const fileSizes = files.map(file => parseInt(file.metadata?.size || 0));
      const totalSize = fileSizes.reduce((sum, size) => sum + size, 0);
      
      return {
        fileCount: files.length,
        totalSize,
        averageFileSize: files.length > 0 ? totalSize / files.length : 0,
        largestFile: Math.max(...fileSizes, 0),
        smallestFile: Math.min(...fileSizes.filter(size => size > 0), 0) || 0,
        oldestFile: files.length > 0 ? Math.min(...files.map(f => new Date(f.created_at).getTime())) : null,
        newestFile: files.length > 0 ? Math.max(...files.map(f => new Date(f.created_at).getTime())) : null
      };
      
    } catch (error) {
      console.log(`❌ Storage analysis failed for '${bucket}': ${error.message}`);
      return {
        fileCount: 0,
        totalSize: 0,
        averageFileSize: 0,
        largestFile: 0,
        smallestFile: 0,
        oldestFile: null,
        newestFile: null,
        error: error.message
      };
    }
  }

  generateOptimizationRecommendations(storageAnalysis) {
    const recommendations = [];
    
    Object.entries(storageAnalysis).forEach(([bucket, analysis]) => {
      if (analysis.error) {
        recommendations.push(`Fix access issues for bucket '${bucket}'`);
        return;
      }
      
      // Check for large files that could be optimized
      if (analysis.largestFile > 50 * 1024 * 1024) { // 50MB
        recommendations.push(`Consider compressing large files in '${bucket}' (largest: ${this.formatBytes(analysis.largestFile)})`);
      }
      
      // Check for old files
      if (analysis.oldestFile) {
        const ageInDays = (Date.now() - analysis.oldestFile) / (1000 * 60 * 60 * 24);
        if (ageInDays > this.cleanupConfig.maxFileAge) {
          recommendations.push(`Archive files older than ${this.cleanupConfig.maxFileAge} days in '${bucket}'`);
        }
      }
      
      // Check for bucket size
      if (analysis.totalSize > 1024 * 1024 * 1024) { // 1GB
        recommendations.push(`Bucket '${bucket}' is large (${this.formatBytes(analysis.totalSize)}) - consider implementing CDN`);
      }
      
      // Check file count
      if (analysis.fileCount > 10000) {
        recommendations.push(`Bucket '${bucket}' has many files (${analysis.fileCount}) - consider folder organization`);
      }
    });
    
    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('Storage is well optimized - continue monitoring');
    }
    
    recommendations.push('Set up automated monitoring for storage usage');
    recommendations.push('Implement CDN for improved global delivery');
    recommendations.push('Consider image optimization pipeline for new uploads');
    recommendations.push('Regular backup of critical storage buckets');
    
    return recommendations;
  }

  setupScheduledCleanup() {
    console.log('\n⏰ Setting Up Scheduled Cleanup...');
    
    try {
      // Define cleanup schedules (would use node-cron in production)
      const schedules = [
        {
          name: 'Weekly Orphan Cleanup',
          schedule: '0 2 * * 0', // Sunday 2 AM
          description: 'Clean up orphaned files weekly',
          action: async () => {
            console.log('🕑 Running scheduled orphaned file cleanup...');
            const orphanedFiles = await this.findOrphanedFiles();
            await this.cleanupOrphanedFiles(orphanedFiles);
          }
        },
        {
          name: 'Monthly Duplicate Cleanup',
          schedule: '0 3 1 * *', // First day of month, 3 AM
          description: 'Clean up duplicate files monthly',
          action: async () => {
            console.log('🕑 Running scheduled duplicate file cleanup...');
            const duplicates = await this.findDuplicateFiles();
            await this.cleanupDuplicateFiles(duplicates);
          }
        },
        {
          name: 'Daily Broken Link Check',
          schedule: '0 1 * * *', // Daily 1 AM
          description: 'Check for broken links daily',
          action: async () => {
            console.log('🕑 Running scheduled broken link check...');
            const brokenLinks = await this.findBrokenLinks();
            if (brokenLinks.length > 0) {
              console.log(`⚠️ Found ${brokenLinks.length} broken links - admin notification required`);
            }
          }
        }
      ];
      
      this.scheduledJobs = schedules;
      
      console.log('✅ Scheduled cleanup jobs configured');
      this.cleanupResults.scheduledCleanup.push('SCHEDULED_JOBS_CONFIGURED: 3 jobs');
      
            if (this.cleanupConfig.enableScheduledCleanup) {
        console.log('⏸️ Scheduled cleanup configured but not started (requires node-cron package)');
        console.log('💡 To enable scheduled cleanup:');
        console.log('  1. npm install node-cron');
        console.log('  2. Uncomment the cron require statement');
        console.log('  3. Update the schedule setup code');
        
        this.cleanupResults.scheduledCleanup.push('SCHEDULED_JOBS_READY_FOR_ACTIVATION: 3 jobs');
      } else {
        console.log('⏸️ Scheduled cleanup disabled - jobs configured but not started');
        this.cleanupResults.scheduledCleanup.push('SCHEDULED_JOBS_CONFIGURED_ONLY: not started');
      }</search>
</search_and_replace>
      
      return this.scheduledJobs;
      
    } catch (error) {
      console.error('❌ Scheduled cleanup setup failed:', error.message);
      this.cleanupResults.scheduledCleanup.push('SETUP_FAILED: ' + error.message);
      this.cleanupResults.errors.push(`Scheduled Cleanup Setup: ${error.message}`);
      return [];
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  async runFullCleanup(options = {}) {
    console.log('🚀 Starting Comprehensive Supabase Storage Cleanup...\n');
    
    const { dryRun = false, includeScheduled = true } = options;
    
    const initialized = await this.initialize();
    if (!initialized) {
      console.log('❌ Cannot proceed without proper initialization');
      return this.generateReport();
    }

    // Step 1: Find orphaned files
    const orphanedFiles = await this.findOrphanedFiles();
    
    // Step 2: Find duplicate files
    const duplicates = await this.findDuplicateFiles();
    
    // Step 3: Find broken links
    const brokenLinks = await this.findBrokenLinks();
    
    // Step 4: Cleanup orphaned files
    if (orphanedFiles.length > 0) {
      await this.cleanupOrphanedFiles(orphanedFiles, dryRun);
    }
    
    // Step 5: Cleanup duplicate files
    if (duplicates.length > 0) {
      await this.cleanupDuplicateFiles(duplicates, dryRun);
    }
    
    // Step 6: Cleanup broken links
    if (brokenLinks.length > 0) {
      await this.cleanupBrokenLinks(brokenLinks, dryRun);
    }
    
    // Step 7: Optimize storage
    await this.optimizeStorage();
    
    // Step 8: Setup scheduled cleanup
    if (includeScheduled) {
      await this.setupScheduledCleanup();
    }

    return this.generateReport();
  }

  generateReport() {
    console.log('\n📊 SUPABASE STORAGE CLEANUP REPORT');
    console.log('=====================================');
    
    const report = {
      timestamp: new Date().toISOString(),
      connection: this.cleanupResults.connection,
      summary: {
        totalChecks: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        errors: this.cleanupResults.errors.length
      },
      categories: {
        orphanedFileCleanup: this.cleanupResults.orphanedFileCleanup,
        duplicateFileCleanup: this.cleanupResults.duplicateFileCleanup,
        brokenLinkCleanup: this.cleanupResults.brokenLinkCleanup,
        storageOptimization: this.cleanupResults.storageOptimization,
        scheduledCleanup: this.cleanupResults.scheduledCleanup
      },
      metrics: this.cleanupMetrics,
      config: this.cleanupConfig,
      details: this.cleanupResults
    };

    // Calculate summary statistics
    const allResults = Object.values(this.cleanupResults).flat().filter(Array.isArray);
    allResults.flat().forEach(result => {
      if (typeof result === 'string') {
        report.summary.totalChecks++;
        if (result.includes('SUCCESS') || result.includes('COMPLETED') || result.includes('CONFIGURED')) {
          report.summary.passed++;
        } else if (result.includes('FAILED') || result.includes('ERROR')) {
          report.summary.failed++;
        } else if (result.includes('WARNING') || result.includes('SKIPPED')) {
          report.summary.warnings++;
        }
      }
    });

    console.log(`📈 Total Operations: ${report.summary.totalChecks}`);
    console.log(`✅ Successful: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`🔥 Errors: ${report.summary.errors}`);

    console.log('\n📊 CLEANUP METRICS:');
    console.log(`  Files Analyzed: ${this.cleanupMetrics.filesAnalyzed}`);
    console.log(`  Files Deleted: ${this.cleanupMetrics.filesDeleted}`);
    console.log(`  Storage Freed: ${this.formatBytes(this.cleanupMetrics.bytesFreed)}`);
    console.log(`  Orphans Found: ${this.cleanupMetrics.orphansFound}`);
    console.log(`  Duplicates Found: ${this.cleanupMetrics.duplicatesFound}`);
    console.log(`  Broken Links Fixed: ${this.cleanupMetrics.brokenLinksFixed}`);

    console.log('\n📋 DETAILED RESULTS:');
    console.log(`🗑️ Orphaned File Cleanup: ${this.cleanupResults.orphanedFileCleanup.join(', ')}`);
    console.log(`📋 Duplicate File Cleanup: ${this.cleanupResults.duplicateFileCleanup.join(', ')}`);
    console.log(`🔧 Broken Link Cleanup: ${this.cleanupResults.brokenLinkCleanup.join(', ')}`);
    console.log(`⚡ Storage Optimization: ${this.cleanupResults.storageOptimization.join(', ')}`);
    console.log(`⏰ Scheduled Cleanup: ${this.cleanupResults.scheduledCleanup.join(', ')}`);

    if (report.summary.errors > 0) {
      console.log('\n🔍 ERROR DETAILS:');
      this.cleanupResults.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    console.log('\n💡 CLEANUP RECOMMENDATIONS:');
    console.log('  • Run cleanup operations monthly to prevent storage bloat');
    console.log('  • Monitor storage usage and set up alerts for quota limits');
    console.log('  • Implement automated image optimization for new uploads');
    console.log('  • Set up CDN for improved global media delivery');
    console.log('  • Regular backup of critical storage buckets');
    console.log('  • Consider implementing file versioning for important assets');

    console.log('\n=====================================');
    
    return report;
  }

  async disconnect() {
    try {
      // Note: In production with node-cron, you would stop scheduled jobs here
      console.log('🛑 Cleanup manager shutting down...');
      
      if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
      }
    } catch (error) {
      console.error('❌ Error disconnecting:', error.message);
    }
  }
}

// Run cleanup if this file is executed directly
if (require.main === module) {
  (async () => {
    const cleanupManager = new SupabaseCleanupManager();
    
    try {
      // Parse command line arguments
      const args = process.argv.slice(2);
      const dryRun = args.includes('--dry-run');
      const skipScheduled = args.includes('--skip-scheduled');
      
      const report = await cleanupManager.runFullCleanup({
        dryRun,
        includeScheduled: !skipScheduled
      });
      
      // Save report to file
      const reportPath = path.join(__dirname, 'supabase-cleanup-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n💾 Cleanup report saved to: ${reportPath}`);
      
    } catch (error) {
      console.error('❌ Supabase cleanup failed:', error.message);
    } finally {
      await cleanupManager.disconnect();
      process.exit(0);
    }
  })();
}

module.exports = SupabaseCleanupManager;
const { chromium } = require('playwright');

async function tourAdminPanel() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('🚀 Starting Admin Panel Tour...');

    // Navigate to admin panel
    console.log('📍 Navigating to admin panel...');
    await page.goto('http://localhost:4000/login');
    await page.waitForLoadState('networkidle');

    // Take screenshot of login page
    await page.screenshot({ path: 'screenshots/01-login-page.png', fullPage: true });
    console.log('📸 Screenshot saved: 01-login-page.png');

    // Login
    console.log('🔐 Attempting login...');
    await page.fill('input[name="email"]', 'admin@linkage.ph');
    await page.fill('input[name="password"]', 'Admin123!@#');
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    console.log('✅ Login successful! Now touring pages...');

    // List of pages to visit
    const pages = [
      { name: 'Dashboard', url: '/dashboard', description: 'Main dashboard with widgets and statistics' },
      { name: 'Notifications', url: '/notifications', description: 'Notifications and announcements' },
      { name: 'User Management', url: '/users', description: 'Manage users and accounts' },
      { name: 'VA Management', url: '/vas', description: 'Manage virtual assistants' },
      { name: 'Business Management', url: '/businesses', description: 'Manage business accounts' },
      { name: 'Analytics', url: '/analytics', description: 'Analytics and reporting' },
      { name: 'Settings', url: '/settings', description: 'System settings and configuration' },
      { name: 'Profile', url: '/profile', description: 'User profile settings' }
    ];

    // Visit each page and take screenshots
    for (let i = 0; i < pages.length; i++) {
      const pageInfo = pages[i];
      console.log(`\n📄 Visiting: ${pageInfo.name} (${pageInfo.url})`);
      console.log(`📝 Description: ${pageInfo.description}`);

      try {
        await page.goto(`http://localhost:4000${pageInfo.url}`);
        await page.waitForLoadState('networkidle', { timeout: 5000 });
        
        // Wait a bit for any dynamic content to load
        await page.waitForTimeout(2000);

        // Take screenshot of light theme
        const screenshotName = `${String(i + 2).padStart(2, '0')}-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}-light.png`;
        await page.screenshot({ path: `screenshots/${screenshotName}`, fullPage: true });
        console.log(`📸 Light theme screenshot: ${screenshotName}`);

        // Try to enable dark theme if toggle exists
        try {
          // Look for dark theme toggle button
          const themeToggle = await page.locator('[data-testid="theme-toggle"], .theme-toggle, [aria-label*="theme"], [title*="theme"], button:has-text("🌙"), button:has-text("🌞")').first();
          if (await themeToggle.isVisible({ timeout: 1000 })) {
            await themeToggle.click();
            await page.waitForTimeout(1000); // Wait for theme transition
            
            // Take screenshot of dark theme
            const darkScreenshotName = `${String(i + 2).padStart(2, '0')}-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}-dark.png`;
            await page.screenshot({ path: `screenshots/${darkScreenshotName}`, fullPage: true });
            console.log(`📸 Dark theme screenshot: ${darkScreenshotName}`);
            
            // Switch back to light theme for consistency
            await themeToggle.click();
            await page.waitForTimeout(1000);
          } else {
            console.log('🔍 No theme toggle found on this page');
          }
        } catch (e) {
          console.log('⚠️  Could not toggle theme:', e.message);
        }

        // Check for sidebar visibility and styling
        try {
          const sidebar = await page.locator('[data-testid="sidebar"], .sidebar, nav[role="navigation"]').first();
          if (await sidebar.isVisible({ timeout: 1000 })) {
            const sidebarBg = await sidebar.evaluate(el => window.getComputedStyle(el).backgroundColor);
            console.log(`🎨 Sidebar background color: ${sidebarBg}`);
          }
        } catch (e) {
          console.log('🔍 Sidebar not found or not visible');
        }

        console.log(`✅ ${pageInfo.name} page captured successfully`);

      } catch (error) {
        console.log(`❌ Error visiting ${pageInfo.name}: ${error.message}`);
        // Take screenshot anyway to see what's on the page
        try {
          const errorScreenshotName = `${String(i + 2).padStart(2, '0')}-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}-error.png`;
          await page.screenshot({ path: `screenshots/${errorScreenshotName}`, fullPage: true });
          console.log(`📸 Error screenshot: ${errorScreenshotName}`);
        } catch (screenshotError) {
          console.log('❌ Could not take error screenshot');
        }
      }
    }

    console.log('\n🎉 Admin Panel Tour Complete!');
    console.log('📁 Screenshots saved in ./screenshots/ directory');
    console.log('\n📊 Summary:');
    console.log(`• Visited ${pages.length} pages`);
    console.log('• Captured light and dark theme screenshots where possible');
    console.log('• Analyzed sidebar styling');
    
  } catch (error) {
    console.error('❌ Tour failed:', error);
  } finally {
    await browser.close();
  }
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
  console.log('📁 Created screenshots directory');
}

// Run the tour
tourAdminPanel().catch(console.error);
const { chromium } = require('playwright');

async function tourAdminPanel() {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
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

    // Login using the correct selectors
    console.log('🔐 Attempting login...');
    
    // Fill email field (using placeholder text to find the input)
    await page.fill('input[placeholder*="testadmin"]', 'admin@linkage.ph');
    
    // Fill password field
    await page.fill('input[placeholder*="password"], input[type="password"]', 'Admin123!@#');
    
    // Click sign in button
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation after login
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    console.log('✅ Login successful! Now touring pages...');

    // List of pages to visit with their actual routes
    const pages = [
      { name: 'Dashboard', url: '/dashboard', description: 'Main dashboard with widgets and statistics' },
      { name: 'Notifications', url: '/notifications', description: 'Notifications and announcements' },
      { name: 'User Management', url: '/user-management', description: 'Manage users and accounts' },
      { name: 'VA Management', url: '/va-management', description: 'Manage virtual assistants' },
      { name: 'Business Management', url: '/business-management', description: 'Manage business accounts' },
      { name: 'Analytics', url: '/analytics', description: 'Analytics and reporting' },
      { name: 'Settings', url: '/settings', description: 'System settings and configuration' }
    ];

    // Visit each page and take screenshots
    for (let i = 0; i < pages.length; i++) {
      const pageInfo = pages[i];
      console.log(`\n📄 Visiting: ${pageInfo.name} (${pageInfo.url})`);
      console.log(`📝 Description: ${pageInfo.description}`);

      try {
        await page.goto(`http://localhost:4000${pageInfo.url}`);
        await page.waitForLoadState('networkidle', { timeout: 8000 });
        
        // Wait a bit for any dynamic content to load
        await page.waitForTimeout(3000);

        // Take screenshot of current theme (light or dark)
        const screenshotName = `${String(i + 2).padStart(2, '0')}-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}-current.png`;
        await page.screenshot({ path: `screenshots/${screenshotName}`, fullPage: true });
        console.log(`📸 Screenshot saved: ${screenshotName}`);

        // Check sidebar styling
        try {
          const sidebar = await page.locator('nav, .ant-layout-sider, [class*="sidebar"]').first();
          if (await sidebar.isVisible({ timeout: 2000 })) {
            const sidebarStyles = await sidebar.evaluate(el => {
              const styles = window.getComputedStyle(el);
              return {
                backgroundColor: styles.backgroundColor,
                color: styles.color,
                width: styles.width
              };
            });
            console.log(`🎨 Sidebar styles:`, sidebarStyles);
          }
        } catch (e) {
          console.log('🔍 Sidebar analysis failed:', e.message);
        }

        // Check for dark theme elements
        try {
          const darkElements = await page.locator('[class*="dark"], [data-theme="dark"]').count();
          console.log(`🌙 Found ${darkElements} elements with dark theme classes`);
        } catch (e) {
          console.log('🔍 Dark theme analysis failed');
        }

        // Look for theme toggle and try to toggle it
        try {
          const themeToggle = await page.locator('button[aria-label*="theme"], button[title*="theme"], [class*="theme-toggle"]').first();
          if (await themeToggle.isVisible({ timeout: 2000 })) {
            console.log('🎨 Found theme toggle, testing...');
            await themeToggle.click();
            await page.waitForTimeout(2000); // Wait for theme transition
            
            // Take screenshot after theme toggle
            const toggledScreenshotName = `${String(i + 2).padStart(2, '0')}-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}-toggled.png`;
            await page.screenshot({ path: `screenshots/${toggledScreenshotName}`, fullPage: true });
            console.log(`📸 Toggled theme screenshot: ${toggledScreenshotName}`);
            
            // Toggle back
            await themeToggle.click();
            await page.waitForTimeout(1000);
          } else {
            console.log('🔍 No theme toggle found on this page');
          }
        } catch (e) {
          console.log('⚠️  Theme toggle failed:', e.message);
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

    // Check what navigation items are actually available
    console.log('\n🔍 Analyzing available navigation items...');
    try {
      await page.goto('http://localhost:4000/dashboard');
      await page.waitForLoadState('networkidle');
      
      const navItems = await page.locator('nav a, .ant-menu-item, [role="menuitem"]').allTextContents();
      console.log('📋 Available navigation items:', navItems);
      
    } catch (e) {
      console.log('❌ Could not analyze navigation');
    }

    console.log('\n🎉 Admin Panel Tour Complete!');
    console.log('📁 Screenshots saved in ./screenshots/ directory');
    
    // List all screenshots created
    const fs = require('fs');
    const screenshots = fs.readdirSync('screenshots');
    console.log('\n📸 Screenshots captured:');
    screenshots.forEach(screenshot => {
      console.log(`  • ${screenshot}`);
    });
    
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
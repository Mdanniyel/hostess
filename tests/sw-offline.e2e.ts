import { test, expect } from '@playwright/test';

test('Service Worker Offline and Page Refresh Support', async ({ page, context }) => {
  // 1. Navigate to the login page
  console.log('Navigating to login page...');
  await page.goto('/he-IL/corp/hostess-app/login');

  // Verify login page loaded successfully
  await expect(page.locator('#model_email')).toBeVisible();

  // 2. Wait for the Service Worker to register and activate
  console.log('Waiting for Service Worker registration...');
  const isSWActive = await page.evaluate(async () => {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      return !!navigator.serviceWorker.controller;
    }
    return false;
  });
  console.log('Service Worker controller active:', isSWActive);

  // 3. Log in with demo credentials
  console.log('Entering login credentials...');
  await page.fill('#model_email', 'h1@demo.com');
  await page.fill('#model_password', '123456');
  
  // Click submit and wait for navigation
  console.log('Submitting login form...');
  await Promise.all([
    page.waitForURL('**/events*'),
    page.click('button[type="submit"]')
  ]);
  console.log('Successfully logged in and redirected to events page.');

  // 4. Turn network offline to simulate bad reception
  console.log('Simulating offline mode (going offline)...');
  await context.setOffline(true);

  // 5. Refresh the page while offline
  console.log('Refreshing the page while offline...');
  await page.reload();

  // 6. Verify that the page loads the shell successfully and does not crash
  console.log('Verifying shell loads offline...');
  await expect(page.locator('body')).toBeVisible();
  
  // Make sure we are not seeing the browser's default offline/crash error page
  const title = await page.title();
  expect(title).not.toContain('Error');
  expect(title).not.toContain('localhost');

  // 7. Navigate to a deep route containing dynamic IDs while offline
  console.log('Navigating to dynamic deep route while offline...');
  await page.goto('/he-IL/corp/hostess-app/events/251580/invitations/63052586');

  // 8. Verify the deep route loads the SPA shell successfully offline without crashing
  console.log('Verifying dynamic deep route loads offline...');
  await expect(page.locator('body')).toBeVisible();
  const deepTitle = await page.title();
  expect(deepTitle).not.toContain('Error');
  expect(deepTitle).not.toContain('localhost');
  
  console.log('Test completed successfully: Offline navigation and dynamic route refreshes work!');
});

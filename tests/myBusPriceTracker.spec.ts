import { test, expect } from '@playwright/test';
import { TestConfig } from '../test.config';
import { sendPriceAlert, sendTextMessage, getISTTime } from '../Utility/telegram'; // Assume you added sendTextMessage
import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';

chromium.use(stealth());
let config: TestConfig;
const istTimestamp = getISTTime();

test.beforeEach(async ({ page }) => {
    config = new TestConfig();
    // INJECT STEALTH SCRIPT BEFORE NAVIGATION
    await page.addInitScript(() => {
        // Hides the webdriver property
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        // Mocks the languages property
        Object.defineProperty(navigator, 'languages', { get: () => ['en-IN', 'en'] });
    });

    // Use a more patient wait strategy
    await page.goto(config.appUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: 60000 
    });
    await page.goto(config.appUrl);
});

test('Price tracker for my bus', async ({ page }) => {
    const executionDate = istTimestamp;

    // 1. Send Start Notification
    await sendTextMessage(`🕒 Tracker Started\nDate: ${executionDate}\nRoute: ${config.source} to ${config.destination}`);

    try {
        // --- Locators ---
        const logo = page.getByRole('link', { name: "redBus logo" });
        const srcInput = page.locator('#srcinput');
        const destInput = page.locator('#destinput');
        const busCardView = page.locator('[data-autoid="exact"] li').first(); // .first() prevents strict mode error
        const loginBottomsheet = page.locator('[data-autoid="bottom-sheet"]');
        const seatSelectionHeader = page.locator('#leaner-funnel-popup');
        const busImages = page.getByRole('button', { name: /FR bus image/i });

        // --- Execution ---
        await expect.soft(logo).toBeVisible();
        await srcInput.fill(config.source);
        await page.locator('//div[@aria-label="Bengaluru"]').nth(0).click();

        await destInput.fill(config.destination);
        await page.locator('//div[@aria-label="Nanded"]').nth(0).click();

        await page.getByRole('combobox', { name: /Select Date of Journey/i }).click();
        await page.getByRole('button', { name: /Wednesday, March 18, 2026/i }).click();
        await page.getByRole('button', { name: 'Search buses' }).click();

        // Wait for results
        await expect(busCardView).toBeVisible({ timeout: 15000 });

        // Take Search Result Screenshot
        const busListViewSSPath = `Screenshots/buslistview-${Date.now()}.png`;
        await busCardView.screenshot({ path: busListViewSSPath });

        // Get Price (Scoped to the specific bus card)
        const busStartingPrice = await busCardView.locator('p[class*="finalFare"]').innerText();

        // Open Seats
        await busCardView.getByRole('button', { name: /view seats/i }).click();
        await loginBottomsheet.waitFor({ state: 'visible', timeout: 3000 }).catch(() => { });
        await expect(loginBottomsheet).toBeVisible();

        if (await loginBottomsheet.isVisible()) {
            await loginBottomsheet.locator('button[aria-label="Close"]').click();
        }
        await expect.soft(busImages).toBeVisible();

        // Seat Selection Screenshot
        await expect(seatSelectionHeader).toBeVisible();
        const seatSelectionSSPath = `Screenshots/seatselection-${Date.now()}.png`;
        await seatSelectionHeader.screenshot({ path: seatSelectionSSPath });

        // 2. Send Success Notification
        await sendPriceAlert(`Sharma Travels`, busStartingPrice, busListViewSSPath, seatSelectionSSPath);

    } catch (error) {
        // 3. Send Failure Notification
        const errorMessage = (error as Error).message;
        await sendTextMessage(`❌ *Tracker Failed*\nError: ${errorMessage}`);
        throw error;
    }
});
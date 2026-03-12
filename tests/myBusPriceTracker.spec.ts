import { test, expect } from '@playwright/test';
import { TestConfig } from '../test.config';
import { sendPriceAlert, sendTextMessage, getISTTime, sendScreenshot } from '../Utility/telegram'; // Assume you added sendTextMessage
import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';

chromium.use(stealth());
let config: TestConfig;
config = new TestConfig();
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
test.afterEach(async({page})=>{
    await page.close();

});

test(`Price Tracker for ${config.source} <=> ${config.destination}`, async ({ page }) => {
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
        await page.getByRole('heading', { name: `${config.source}`, exact: true }).click();
       // await page.locator('//div[@aria-label="Bengaluru"]').nth(0).click();

        await destInput.fill(config.destination);
        await page.getByRole('heading', { name: `${config.destination}`, exact: true }).click();
        //await page.locator('//div[@aria-label="Nanded"]').nth(0).click();

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

test(`Price tracker for Bus from ${config.source} <=> ${config.destination2}`, async ({ page }) => {
    const executionDate = istTimestamp;

    // 1. Send Start Notification
    // await sendTextMessage(`🕒 Tracker Started\nDate: ${executionDate}\nRoute: ${config.source} to ${config.destination2}`);

    try {
        // --- Locators ---
        const logo = page.getByRole('link', { name: "redBus logo" });
        const srcInput = page.locator('#srcinput');
        const destInput = page.locator('#destinput');

        const busCardView = page.locator('[data-autoid="exact"] li').first(); // .first() prevents strict mode error
        const loginBottomsheet = page.locator('[data-autoid="bottom-sheet"]');
        const seatSelectionHeader = page.locator('#leaner-funnel-popup');


        // --- Execution ---
        await expect.soft(logo).toBeVisible();
        await srcInput.fill(config.source);
        await page.getByRole('heading', { name: `${config.source}`, exact: true }).click();
        // await page.locator('//div[@aria-label="Bengaluru"]').nth(0).click();

        await destInput.fill(config.destination2);
        // await page.locator('//div[@aria-label="Nagpur"]').nth(0).click();
        await page.getByRole('heading', { name: `${config.destination2}`, exact: true }).click();
        await page.getByRole('combobox', { name: /Select Date of Journey/i }).click();
        await page.getByRole('button', { name: /Wednesday, March 18, 2026/i }).click();
        await page.getByRole('button', { name: 'Search buses' }).click();

        // Wait for results


        await page.locator('#travelsList').click();

        await expect(page.getByPlaceholder('Search bus operator')).toBeVisible();
        await page.getByRole('checkbox', { name: /B R Travels/i }).click();
        await page.getByRole('checkbox', { name: /B R Travels/i }).isChecked({ timeout: 2000 });
        await page.getByRole('checkbox', { name: /DNR Express/i }).click();
        await page.getByRole('checkbox', { name: /DNR Express/i }).isChecked({ timeout: 2000 });
        await page.getByText(/2 buses found/i).first().isVisible();
        await expect(busCardView).toBeVisible({ timeout: 15000 });

        await page.waitForTimeout(3000);
        const busCards = page.locator('[data-autoid="exact"] li');
        const count = await busCards.count();
        console.log("length of array", count);

        // Take Search Result Screenshot
        const busListViewSSPath = `Screenshots/buslistview-${Date.now()}.png`;
        await page.locator('//ul[@data-autoid="exact"]').screenshot({ path: busListViewSSPath });

        await sendScreenshot(busListViewSSPath);


        for (let i = 0; i < count; i++) {

            const buscard = busCards.nth(i);
            const busName = await buscard.locator('[class^="travelsName"]').innerText();
            const busPrice = await buscard.locator('[class^="finalFare"]').innerText();

            const busCardViewSS = `Screenshots/busCardViewSS-${Date.now()}.png`;
            await buscard.screenshot({ path: busCardViewSS });
            await buscard.getByRole('button', { name: /View seats/i }).click();
            let seatSelectionView = page.locator('#dialogTitle');
            await seatSelectionView.isVisible();


            if (await loginBottomsheet.isVisible({ timeout: 4000 })) {
                await loginBottomsheet.locator('button[aria-label="Close"]').click();
            }
            const busImages = page.getByAltText(/FR bus image 1/i);
            await waitForImageLoad(busImages);

            const seatSelectionSSPath = `Screenshots/seatselection-${Date.now()}.png`;
            await seatSelectionHeader.screenshot({ path: seatSelectionSSPath });

            // 2. Send Success Notification
            await sendPriceAlert(busName, busPrice, busCardViewSS, seatSelectionSSPath);
            await page.getByLabel('Close', { exact: true }).click();
            // await page.locator('//button[@aria-label="Close"]/i').click();

            // await seatSelectionHeader.waitFor({state:'hidden', timeout:3000});

            //await page.locator('button:has(.icon-close)').click();
        }


    } catch (error) {
        // 3. Send Failure Notification
        const errorMessage = (error as Error).message;
        await sendTextMessage(`❌ *Tracker Failed*\nError: ${errorMessage}`);
        throw error;
    }

});


async function waitForImageLoad(locator: any) {
    await locator.waitFor({ state: 'visible' });
    const handle = await locator.elementHandle();
    await locator.page().waitForFunction(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        handle
    );
}

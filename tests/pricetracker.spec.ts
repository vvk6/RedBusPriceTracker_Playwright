import {test, expect} from '@playwright/test';
import { TestConfig } from '../test.config';
import { sendPriceAlert } from '../Utility/telegram';

let config: TestConfig;

test.beforeEach(async({page})=>{

    config= new TestConfig();

    await page.goto(config.appUrl);

});

test.afterEach(async({page})=>{
    await page.close();

});


test('Price tracker for my bus ', async({page})=>{
    let logo= page.getByRole('link',{name:"redBus logo"});
    let srcInput = page.locator('#srcinput');
    let destInput = page.locator('#destinput');
    let srcSuggestion = page.locator('//div[@aria-label="Bengaluru"]').nth(0);
    let destSuggestion = page.locator('//div[@aria-label="Nanded"]').nth(0);
    let busCardView =  page.locator('[data-autoid="exact"] li');
    let loginBottomsheet  = page.locator('[data-autoid="bottom-sheet"]');
// page.getByRole('dialog',{name:/Login to get exciting offers/i});
let seatSelectionBottomsheet = page.locator('#dialogTitle');
let busImages =  page.getByRole('button', {name:/FR bus image/i});
 let seatSelection = page.locator('#dialogTitle');
 //page.getByRole('button', {name:/dialogTitle/i});
   await  expect.soft(logo).toBeVisible();

   await srcInput.fill(config.source);
   await srcSuggestion.click();
   await destInput.fill(config.destination);
   await destSuggestion.click();
 //  await page.getByText('Date of Journey').click();
   // Targets the actual interactive wrapper instead of the text span
await page.getByRole('combobox', { name: /Select Date of Journey/i }).click();

 await page.getByRole('button', {name:/Wednesday, March 18, 2026/i}).click();
 await page.getByRole('button', {name:'Search buses'}).click();
 await expect.soft(page.locator('[data-autoid="sort-desktop"]')).toBeVisible();

 
 // page.getByRole('listitem').filter({hasText:/Sharma/i});

  
 await expect.soft(busCardView).toBeVisible();
  let busListViewSSPath = `Screenshots/buslistview-${Date.now()}.png`;
  await busCardView.screenshot({path: busListViewSSPath});

 let busStartingPrice = await page.locator('//p[contains(@class, "finalFare")]').innerText();
 
await page.getByRole('button',{name:/view seats/i}).click();
   await page.waitForTimeout(1500);


await expect(loginBottomsheet).toBeVisible();
let loginvisible = await loginBottomsheet.isVisible();
console.log(`login is visible: ${loginvisible}`);
if(loginvisible){
    await loginBottomsheet.locator('button[aria-label="Close"]').click();
    //await loginBottomsheet.locator('button').nth(0).click();
   // await loginBottomsheet.getByRole('button',{name:/close/i}).click();
}
await expect.soft(seatSelectionBottomsheet).toBeVisible();

 await expect.soft(busImages).toBeVisible();

 let seatSelectionSSPath = `Screenshots/seatselection-${Date.now()}.png`;

 await seatSelection.screenshot({path:seatSelectionSSPath});
});
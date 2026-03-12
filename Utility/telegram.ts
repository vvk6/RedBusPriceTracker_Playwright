import { Telegraf } from 'telegraf';
import fs from 'fs';



//const CHAT_ID = '898999018';
//const BOT_TOKEN = '8369414618:AAFJVI-DCrp5KI8UywJ47u-_9RbMtqTbmx4';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const bot = new Telegraf(BOT_TOKEN);

export async function sendPriceAlert(busName: string, price: string, screenshotPath: string, screenshotPath2: string) {
    const message = `🚀 **Price Tracker Alert** 🚀\n\nBus: ${busName}\nPrice: ${price}\nDate: ${getISTTime()}`;
    
    // Send the text message
    await bot.telegram.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' });

    // Send the screenshot
    await bot.telegram.sendPhoto(CHAT_ID, { source: screenshotPath });
    // Send the screenshot2
    await bot.telegram.sendPhoto(CHAT_ID, { source: screenshotPath2 });
}

export async function sendTextMessage(message: string) {
    try {
        await bot.telegram.sendMessage(CHAT_ID, '<==========================>', { parse_mode: 'Markdown' });
        await bot.telegram.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' });
        console.log('Telegram text message sent successfully.');
    } catch (error) {
        console.error('Failed to send Telegram text message:', error);
    }
}

export async function sendScreenshot(screenshotPath: string) {
    // Send the screenshot
    await bot.telegram.sendPhoto(CHAT_ID, { source: screenshotPath });
}
export const getISTTime = () => {
    return new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: true,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        day: '2-digit',
        month: 'short'
    });
};
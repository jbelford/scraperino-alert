//@ts-check
'use strict'

import { puppeteer, sendEmail } from "../util.js";

const NEW_EGG_LINK = 'https://www.newegg.com/p/pl?N=100007709%208000%20601357247&cm_sp=Cat_video-Cards_1-_-Visnav-_-Gaming-Video-Cards_1';

/**
 * @param {puppeteer.Page} page
 */
async function checkNewEgg(page) {
    await page.reload({ waitUntil: 'networkidle2' });
    const result = await page.$$('.item-cell');
    await Promise.all(result.map(elem => checkNewEggListing(elem)));
}

async function checkNewEggListing(elem) {
    const action = await elem.$('.item-action .item-operate .item-button-area');
    const text = await (await action.getProperty('textContent')).jsonValue();
    if (typeof text === 'string' && text.match(/add\s+to\s+cart/i)) {
        const title = await elem.$('.item-info .item-title');
        const href = await (await title.getProperty('href')).jsonValue();
        sendEmail('New RTX 3080 available', href);
    }
}

export default {
    name: 'NewEgg',
    link: NEW_EGG_LINK,
    checkFn: checkNewEgg,
    sleepTimers: [2, 3],
    cache: false
};
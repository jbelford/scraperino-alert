//@ts-check
'use strict'

import { puppeteer, sendEmail } from "../util.js";

const BEST_BUY_LINK = 'https://www.bestbuy.com/site/searchpage.jsp?st=rtx+3080&_dyncharset=UTF-8&_dynSessConf=&id=pcat17071&type=page&sc=Global&cp=1&nrp=&sp=&qp=&list=n&af=true&iht=y&usc=All+Categories&ks=960&keys=keys';

/**
 * @param {puppeteer.Page} page
 */
async function checkBestBuy(page) {
    await page.reload({ waitUntil: 'networkidle2', timeout: 0 });
    const items = await page.$$('.sku-item');
    await Promise.all(items.map(item => checkBestBuyListing(item)));
}

async function checkBestBuyListing(elem) {
    const action = await elem.$('.price-block .sku-list-item-button');
    const text = await (await action.getProperty('textContent')).jsonValue();
    if (typeof text === 'string' && text.match(/add\s+to\s+cart/i)) {
        const title = await elem.$('.sku-title .sku-header a');
        const href = await (await title.getProperty('href')).jsonValue();
        sendEmail('New RTX 3080 available', href);
    }
}

export default {
    name: 'BestBuy',
    link: BEST_BUY_LINK,
    checkFn: checkBestBuy,
    sleepTimers: [8, 10],
    cache: true
};
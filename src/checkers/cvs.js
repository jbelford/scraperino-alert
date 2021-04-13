//@ts-check
'use strict'

import { getText, puppeteer, sendEmail } from '../util.js';

const CVS_LINK = 'https://www.cvs.com/immunizations/covid-19-vaccine?WT.ac=cvs-storelocator-covid-vaccine-searchpilot';

/**
 * @param {puppeteer.Page} page
 */
 async function checkCvs(page) {
    await page.reload({ waitUntil: 'networkidle2' });

    // Click washington button
    const elem = await page.$('a[data-analytics-name=Washington]');
    await elem.click();

    // Wait for modal to refresh then get info
    await page.waitForSelector('div.modal__box#vaccineinfo-WA tbody tr');
    const rows = await page.$$('div.modal__box#vaccineinfo-WA tbody tr');
    const results = await Promise.all(rows.map(async row => {
        return {
            city: await getText(await row.$('.city')),
            status: await getText(await row.$('.status'))
        };
    }));

    // Send email for Seattle if not fully booked
    const value = results.filter(r => r.city.toLowerCase() === 'seattle, wa')[0];
    if (value.status != 'Fully Booked') {
        sendEmail('CVS Vaccine Available', CVS_LINK);
    }
}

export default {
    name: 'CVS Pharmacy',
    link: CVS_LINK,
    checkFn: checkCvs,
    sleepTimers: [30, 45, 60],
    cache: true
};
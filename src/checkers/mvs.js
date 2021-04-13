//@ts-check

'use strict'

import { getText, puppeteer, sendEmail } from '../util.js';

const MVS_LINK = 'https://seattle.signetic.com/home';

/**
 *
 * @param {puppeteer.Page} page
 */
 async function checkSeattleMvs(page) {
    await page.reload({ waitUntil: 'networkidle2' });

    const noApptAvail = await page.$('.empty-clinic .empty-title');
    if (noApptAvail) {
        const text = await getText(noApptAvail);
        if (text.toLowerCase() === 'no appointments available') {
            return;
        }
    }

    sendEmail('Seattle Vaccine Signup Available', MVS_LINK);
}

export default {
    name: 'Seattle City',
    link: MVS_LINK,
    checkFn: checkSeattleMvs,
    sleepTimers: [30, 45, 60],
    cache: false
};

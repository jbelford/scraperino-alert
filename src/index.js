// @ts-check
'use strict'

import * as fs from 'fs';
import puppeteer from 'puppeteer';
import config from './config.js';

// Just try to load default export of any JS file that is in there.
//
const checkers = fs.readdirSync('./src/checkers', { withFileTypes: true })
    .filter(item => item.isFile() && item.name.endsWith('.js'))
    .map(item => import(`./checkers/${item.name}`).then(mod => mod.default));

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    for (const checkerPromise of checkers) {
        const checker = await checkerPromise;
        if (!config.disabled.includes(checker.name)) {
            startPage(browser, checker);
        }
    }
})();

async function startPage(browser, checker) {
    const page = await browser.newPage();
    if (!checker.cache) {
        await page.setCacheEnabled(false);
    }
    await page.goto(checker.link, { timeout: 0 });
    startLoop(checker.name, checker.sleepTimers, () => checker.checkFn(page));
}

async function startLoop(name, sleepTimers, checkFn) {
    for (;;) {
        const start = Date.now();
        try {
            await checkFn();
            console.log(`${name} Refreshed (${Date.now() - start}ms)`);
        } catch (e) {
            console.log(`${name} Failed (${Date.now() - start})`);
        }
        const sleepLength = Math.floor(sleepTimers.length * Math.random());
        console.log(`${name} Sleeping for ${sleepTimers[sleepLength]}s`);
        await sleep(1000 * sleepTimers[sleepLength]);
    }
}

function sleep(millis) {
    return new Promise(resolve => setTimeout(() => resolve(), millis));
}
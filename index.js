
const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');

class Throttle {

    constructor(ttl) {
        this._seen = {};
        this._ttl = ttl;
    }

    has(key) {
        return (key in this._seen) && Date.now() - this._seen[key] <= this._ttl;
    }

    set(key) {
        this._seen[key] = Date.now();
    }
}

if (!process.env['3080User'] || !process.env['3080Pass']) {
    console.log('Missing user and password!');
    process.exit();
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env['3080User'],
        pass: process.env['3080Pass']
    }
});

let bestBuyLink = 'https://www.bestbuy.com/site/searchpage.jsp?st=rtx+3080&_dyncharset=UTF-8&_dynSessConf=&id=pcat17071&type=page&sc=Global&cp=1&nrp=&sp=&qp=&list=n&af=true&iht=y&usc=All+Categories&ks=960&keys=keys';
// bestBuyLink = 'https://www.bestbuy.com/site/searchpage.jsp?_dyncharset=UTF-8&id=pcat17071&iht=y&keys=keys&ks=960&list=n&qp=gpusv_facet%3DGraphics%20Processing%20Unit%20(GPU)~NVIDIA%20GeForce%20RTX%202070%20SUPER&sc=Global&st=graphics%20card&type=page&usc=All%20Categories';
let newEggLink = 'https://www.newegg.com/p/pl?N=100007709%208000%20601357247&cm_sp=Cat_video-Cards_1-_-Visnav-_-Gaming-Video-Cards_1';
// newEggLink = 'https://www.newegg.com/p/pl?d=rtx+2080&N=100007709&isdeptsrh=1';
let cvsLink = 'https://www.cvs.com/immunizations/covid-19-vaccine?WT.ac=cvs-storelocator-covid-vaccine-searchpilot';

let throttle = new Throttle(1000 * 60 * 5);

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    // startPage(browser, bestBuyLink, 'BestBuy', [8, 10], checkBestBuy);
    // startPage(browser, newEggLink, 'NewEgg', [2, 3], checkNewEgg, false);
    startPage(browser, cvsLink, 'CVS', [30, 45, 60], checkCvs);
})();

async function startPage(browser, url, name, sleepTimers, checkFn, cache = true) {
    const page = await browser.newPage();
    if (!cache) {
        await page.setCacheEnabled(false);
    }
    await page.goto(url, { timeout: 0 });
    startLoop(name, sleepTimers, () => checkFn(page));
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
        sendRtxEmail(href);
    }
}

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
        sendRtxEmail(href);
    }
}

/**
 *
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
        sendEmail('CVS Vaccine Available', cvsLink);
    }
}

function sendRtxEmail(href) {
    sendEmail('New RTX 3080 available', href);
}

function sendEmail(subj, text) {
    if (throttle.has(text) || text === 'https://www.newegg.com/asus-geforce-rtx-3080-tuf-rtx3080-10g-gaming/p/N82E16814126453?Item=N82E16814126453&quicklink=true')
        return;
    throttle.set(text);

    const mailOptions = {
        from: process.env['3080User'],
        to: 'jackbelford12@live.ca',
        subject: subj,
        text: text
    };
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(`Fuck I failed to send email: ${text}`);
        } else {
            console.log(`EMAIL HAS BEEN SENT FOR ${text}`);
        }
    });
}

function sleep(millis) {
    return new Promise(resolve => setTimeout(() => resolve(), millis));
}

function getText(elem) {
    return elem.getProperty('textContent').then(text => text.jsonValue()).then(text => text.trim());
}
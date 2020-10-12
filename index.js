
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

let bestBuyLink = 'https://www.bestbuy.com/site/computer-cards-components/video-graphics-cards/abcat0507002.c?id=abcat0507002&qp=gpusv_facet%3DGraphics%20Processing%20Unit%20(GPU)~NVIDIA%20GeForce%20RTX%203080';
// bestBuyLink = 'https://www.bestbuy.com/site/searchpage.jsp?_dyncharset=UTF-8&id=pcat17071&iht=y&keys=keys&ks=960&list=n&qp=gpusv_facet%3DGraphics%20Processing%20Unit%20(GPU)~NVIDIA%20GeForce%20RTX%202070%20SUPER&sc=Global&st=graphics%20card&type=page&usc=All%20Categories';
let newEggLink = 'https://www.newegg.com/p/pl?N=100007709%208000%20601357247&cm_sp=Cat_video-Cards_1-_-Visnav-_-Gaming-Video-Cards_1';
// newEggLink = 'https://www.newegg.com/p/pl?d=rtx+2080&N=100007709&isdeptsrh=1';

let throttle = new Throttle(1000 * 60 * 5);

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    startPage(browser, bestBuyLink, 'BestBuy', [8, 10], checkBestBuy);
    startPage(browser, newEggLink, 'NewEgg', [2, 3], checkNewEgg, false);
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
        sendEmail(href);
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
        sendEmail(href);
    }
}

function sendEmail(href) {
    if (throttle.has(href) || href === 'https://www.newegg.com/asus-geforce-rtx-3080-tuf-rtx3080-10g-gaming/p/N82E16814126453?Item=N82E16814126453&quicklink=true')
        return;
    throttle.set(href);

    const mailOptions = {
        from: 'joe425228@gmail.com',
        to: 'jackbelford12@live.ca',
        subject: 'New RTX 3080 available',
        text: href
    };
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(`Fuck I failed to send email: ${href}`);
        } else {
            console.log(`EMAIL HAS BEEN SENT FOR ${href}`);
        }
    });
}

function sleep(millis) {
    return new Promise(resolve => setTimeout(() => resolve(), millis));
}
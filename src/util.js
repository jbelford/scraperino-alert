//@ts-check
'use strict'

import nodemailer from 'nodemailer';
import puppeteer from 'puppeteer';
import config from './config.js';

/**
 * Remember a piece of text for a certain amount of time
 */
 class TextMemo {

    /**
     * @param {number} ttl
     */
    constructor(ttl) {
        this._seen = {};
        this._ttl = ttl;
    }

    /**
     * @param {string} key
     * @returns {boolean}
     */
    has(key) {
        return (key in this._seen) && Date.now() - this._seen[key] <= this._ttl;
    }

    /**
     * @param {string} key
     */
    set(key) {
        this._seen[key] = Date.now();
    }
}

const throttle = new TextMemo(1000 * 60 * 5);
const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.email.user,
        pass: config.email.password
    }
});

/**
 * @param {puppeteer.ElementHandle<Element>} elem
 * @returns {Promise<string>}
 */
export function getText(elem) {
    return elem.getProperty('textContent')
        .then(text => text.jsonValue())
        //@ts-ignore Because we know this is string
        .then(text => text.trim());
}

/**
 * Send an email to configured address
 *
 * @param {string} subj
 * @param {string} text
 */
export function sendEmail(subj, text) {
    if (throttle.has(text))
        return;
    throttle.set(text);

    const mailOptions = {
        from: config.email.user,
        to: config.email.receiver,
        subject: subj,
        text: text
    };
    transport.sendMail(mailOptions, err => {
        if (err) {
            console.log(`I failed to send email: ${text}`);
        } else {
            console.log(`EMAIL HAS BEEN SENT FOR ${text}`);
        }
    });
}

// Re-export puppeteer
export { default as puppeteer } from 'puppeteer';



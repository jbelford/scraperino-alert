//@ts-check
'use strict'

function getEnv(name) {
    if (!process.env[name]) {
        console.log(`Missing env: ${name}`);
        process.exit();
    }
    return process.env[name];
}

/**
 * Convert a comma separated list environment variable into an array
 *
 * @param {string} name
 * @returns {string[]}
 */
function getEnvList(name) {
    return (process.env[name] || '').split(',').map(x => x.trim());
}

export default {
    email: {
        user: getEnv('EmailUser'),
        password: getEnv('EmailPass'),
        receiver: getEnv('EmailReceiver')
    },
    disabled: getEnvList('Disabled')
};
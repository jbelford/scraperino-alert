//@ts-check
'use strict'

function getEnv(name) {
    if (!process.env[name]) {
        console.log(`Missing env: ${name}`);
        process.exit();
    }
    return process.env[name];
}

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
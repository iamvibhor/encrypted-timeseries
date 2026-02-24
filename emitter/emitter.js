const WebSocket = require('ws');
const crypto = require('crypto');
const fs = require('fs');

const rawData = fs.readFileSync('./data.json');
const { names, cities } = JSON.parse(rawData);

const WS_URL = process.env.WS_URL || 'ws://localhost:8080';
const ws = new WebSocket(WS_URL);

const SECRET_KEY = crypto
    .createHash('sha256')
    .update('my_super_secret_key')
    .digest();

function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateSecret() {
    return crypto.randomBytes(8).toString('hex');
}

function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', SECRET_KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    return iv.toString('base64') + ':' + encrypted;
}

function generateEncryptedRecord() {
    const record = {
        name: randomPick(names),
        origin: randomPick(cities),
        destination: randomPick(cities),
        secret: generateSecret()
    };

    return encrypt(JSON.stringify(record));
}

ws.on('open', () => {
    console.log('Connected to server');

    setInterval(() => {

        const records = [];

        for (let i = 0; i < 50; i++) {
            records.push(generateEncryptedRecord());
        }

        const combinedMessage = records.join('|');

        console.log(combinedMessage)
        ws.send(combinedMessage);
        console.log(`Sent batch of 50 records`);

    }, 2000);

});

ws.on('error', (err) => {
    console.error('WebSocket error:', err);
});
const WebSocket = require('ws');
const crypto = require('crypto');
const express = require('express');
const mongoose = require('mongoose');


const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/streamdb';
const PORT = process.env.PORT || 8080;
const API_PORT = process.env.API_PORT || 3000;

const SECRET_KEY = crypto
    .createHash('sha256')
    .update('my_super_secret_key')
    .digest();


mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('Mongo error:', err));

const recordSchema = new mongoose.Schema({
    name: String,
    origin: String,
    destination: String,
    secret: String,
    receivedAt: {
        type: Date,
        default: Date.now
    }
});

const Record = mongoose.model('Record', recordSchema);


function decrypt(encryptedData) {
    try {
        const [ivBase64, encryptedText] = encryptedData.split(':');

        const iv = Buffer.from(ivBase64, 'base64');
        const decipher = crypto.createDecipheriv('aes-256-cbc', SECRET_KEY, iv);

        let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return JSON.parse(decrypted);
    } catch (err) {
        console.error('Decryption failed:', err.message);
        return null;
    }
}


const wss = new WebSocket.Server({ port: PORT });

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', async (data) => {
        const payload = data.toString();
        const records = payload.split('|');

        for (const record of records) {
            if (!record) continue;

            const decrypted = decrypt(record);
            if (!decrypted) continue;

            const doc = new Record({
                ...decrypted,
                receivedAt: new Date()
            });

            await doc.save();

            console.log('Saved:', doc);
        }
    });
});

console.log(`WebSocket running on ws://0.0.0.0:${PORT}`);
const app = express();
app.get('/records', async (req, res) => {
    const records = await Record
        .find()
        .sort({ receivedAt: -1 })
        .limit(100);

    res.json(records);
});

app.get('/records/:name', async (req, res) => {
    const records = await Record
        .find({ name: req.params.name })
        .sort({ receivedAt: -1 });

    res.json(records);
});

app.listen(API_PORT, () => {
    console.log(`API running on http://localhost:${API_PORT}`);
});
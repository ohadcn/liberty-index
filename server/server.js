const fs = require('fs');
const express = require('express');
const bodyParser = require("body-parser");
const {
    google
} = require('googleapis');
const morgan = require('morgan');

const webapi = express();
webapi.use(bodyParser.json());
webapi.use(morgan('combined'));

const authClient = new google.auth.JWT({
    keyFile: 'credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

authClient.authorize(function (err, tokens) {
    if (err) {
        console.log(err);
        return;
    } else {
        console.log("Successfully connected!");
    }
});

const allowed_users = JSON.parse(fs.readFileSync('allowed_mails.json'));

webapi.use(express.static('public'));

webapi.options('/api/{*path}', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.sendStatus(200);
});

webapi.use('/api/{*path}', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

const spreadsheetId = '1q-2b_lvGYc-6M8b9KYYWWkp9l6ifDggPnDQhpDB5J1o';

webapi.get('/api/read/:table/:line', async (req, res) => {
    try {

        const sheets = google.sheets({ version: 'v4', auth: authClient });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: `${req.params.table}!D${req.params.line}:G${req.params.line}`,
        });

        const rows = response.data.values;
        if (rows.length) {
            res.json(rows[0]);
        } else {
            res.status(404).send('No data found.');
        }
    } catch (error) {
        console.error('Error fetching data from Google Sheets:', error);
        res.status(500).send('Internal Server Error');
    }
});

webapi.post('/api/send/:table/:line', async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth: authClient });
        const response = await sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: `${req.params.table}!A${Number(req.params.line)}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: req.body.values
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error appending data to Google Sheets:', error);
        res.status(500).send('Internal Server Error');
    }
});

webapi.post('/api/login', (req, res) => {
    if (req.body && req.body.email && req.body.email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/) && allowed_users[req.body.email]) {
        // In a real application, you would verify the email and password here.
        res.json({ success: true, email: req.body.email });
    } else {
        res.status(400).json({ success: false, message: 'Email is required' });
    }
});

if ((port = process.env.WEB_PORT)) {
    webapi.listen(port, () => console.log(`Web app listening on port ${port}!`))
}

if (socket = process.env.SOCKET_PATH) {
    let sockPath = `/tmp/${socket}.socket`;
    if (fs.existsSync(sockPath)) fs.unlinkSync(sockPath);
    webapi.listen(sockPath, () => {
        fs.chmodSync(sockPath, '777');
        console.log(`Web app listening on socket ${sockPath}!`)
    })
}
const {SessionsClient} = require('@google-cloud/dialogflow-cx');
const fs = require('fs')



/**
 * Debes de tener tu archivo con el nombre "chatbot-account.json" en la raíz del proyecto
 */

const KEEP_DIALOG_FLOW = (process.env.KEEP_DIALOG_FLOW === 'true')
let PROJECID;
let CONFIGURATION;
let sessionClient;
let location = process.env.LOCATION
let agentId = process.env.AGENTID
let apiEndpoint_text = `${process.env.LOCATION}-dialogflow.googleapis.com`

const checkFileCredentials = () => {
    if(!fs.existsSync(`${__dirname}/../chatbot-account.json`)){
        return false
    }

    const parseCredentials = JSON.parse(fs.readFileSync(`${__dirname}/../chatbot-account.json`));
    PROJECID = parseCredentials.project_id;
    CONFIGURATION = {
        credentials: {
            private_key: parseCredentials['private_key'],
            client_email: parseCredentials['client_email']
        }
    }
    // sessionClient = new dialogflow.SessionsClient(CONFIGURATION);
    sessionClient = new SessionsClient({apiEndpoint: apiEndpoint_text})
}

// Create a new session





// Detect intent method
const detectIntent = async (queryText, waPhoneNumber) => {
    let media = null;
    const sessionId = KEEP_DIALOG_FLOW ? 1 : waPhoneNumber;
    const sessionPath = sessionClient.projectLocationAgentSessionPath(PROJECID, location, agentId, sessionId);
    const languageCode = process.env.LANGUAGE
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: queryText,
            },
            languageCode
        },
    };

    const responses = await sessionClient.detectIntent(request);
    const [singleResponse] = responses;
    
    const { queryResult } = singleResponse
    const { intent } = queryResult || { intent: {} }
    const parseIntent = intent && intent['displayName'] || null
    const parsePayload = queryResult['responseMessages'].find((a) => a.message === 'payload');
    if (parsePayload && parsePayload.payload) {
        const { fields } = parsePayload.payload
        media = fields.media.stringValue || null
    }

    const customPayload = parsePayload ? parsePayload['payload'] : null

    const parseData = {
        replyMessage: queryResult.responseMessages,
        media,
        trigger: null
    }
    return parseData
}

const getDataIa = (message = '', sessionId = '', cb = () => { }) => {
    detectIntent(message, sessionId).then((res) => {
        cb(res)
    })
}

checkFileCredentials();

module.exports = { getDataIa }
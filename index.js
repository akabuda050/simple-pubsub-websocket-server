const WebSocket = require('ws');
const { v4 } = require("uuid");
const uuidv4 = v4;

function filterObject(obj, callback) {
    return Object.fromEntries(Object.entries(obj).
        filter(([key, val]) => callback(val, key)));
};

function startServer(options = { port: 9000 }) {
    const wsServer = new WebSocket.Server(options)
    wsServer.on('connection', onConnect);

    let channels = {};
    function onConnect(wsClient) {
        console.log('New user connected');
        wsClient.uuidv4 = uuidv4();

        wsClient.on('message', function (message) {
            const data = JSON.parse(message);
            switch (data.event) {
                case 'subscribe':
                    data.channels.forEach(channel => {
                        if (channels[channel] === undefined) {
                            channels[channel] = {}
                            channels[channel].clients = {}
                        }
                        channels[channel].clients[wsClient.uuidv4] = wsClient
                    })
                    break;
                case 'publish':
                    if (channels[data.channel] !== undefined) {
                        Object.keys(channels[data.channel].clients).forEach(clientKey => {
                            const client = channels[data.channel].clients[clientKey];
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(message);
                            }
                        })
                    }
                    break;
            }
        })

        wsClient.on('close', function () {
            Object.keys(channels).forEach(ch => {
                channels[ch].clients = filterObject(channels[ch].clients, (cl) => cl.uuidv4 !== wsClient.uuidv4)
            })
            console.log('User disconencet');
        })
    }
};

module.exports = startServer;

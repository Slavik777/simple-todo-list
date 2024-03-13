const { log } = require('console');
const { readFileSync, writeFileSync } = require('fs');
const { createServer } = require('http');
const { Server } = require('ws');

const port = 8000
const server = createServer()

const wss = new Server({ server });

const tasks = [
    { text: 'Water the flowers', done: false },
    { text: 'Take out the trash', done: false },
    { text: 'Take over the world', done: false }
];

const allWS = [];

loadTasks();

server.on('request', handleRequest);

server.listen(port, () => console.log('server started at http://localhost:' + port));

wss.on('connection', (ws) => {
    allWS.push(ws);

    ws.send(JSON.stringify(tasks));

    ws.on('message', (message) => {
        console.log(message.toString());

        const data = JSON.parse(message);

        if (data.text) {
            tasks.push(data);
        } else if (data.index !== undefined) {
            tasks[data.index].done = data.checked;
        } else {
            tasks.splice(data, 1);
        }

        const json = JSON.stringify(tasks);

        allWS.forEach((ws) => ws.send(json));
        saveTasks();

        if (message == 'ping') {
            setTimeout(() => {
                console.log('pong');
                ws.send('pong');
            }, 1000);
        }
    });

    ws.on('close', () => {
        console.log('connection closed');
        allWS.splice(allWS.indexOf(ws), 1);
    });
});

function handleRequest(request, response) {
    request.on('upgrade', (ws) => {
        wss.handleUpgrade(ws, request, response, () => {
            wss.emit('connection', ws, request);
        });
    });

    log(request.method, request.url);

    if (request.url.startsWith('/api/')) {
        handleApi(request, response);
    } else {
        serveFile(request, response);
    }
}

async function handleApi(request, response) {
    const route = request.url.slice(5);
    response.setHeader('Content-Type', 'text/json; charset=utf8');

    if (route === 'tasks') {
        response.end(JSON.stringify(tasks));

    } else if (route === 'add') {
        const text = JSON.parse(await getBody(request));
        tasks.push({ text, done: false });
        response.end(JSON.stringify(tasks));
        saveTasks();

    } else if (route === 'remove') {
        const index = JSON.parse(await getBody(request));
        tasks.splice(index, 1);
        response.end(JSON.stringify(tasks));
        saveTasks();

    } else if (route === 'check') {
        const payload = JSON.parse(await getBody(request));
        tasks[payload.index].done = payload.checked;
        response.end(JSON.stringify(tasks));
        saveTasks();
    }
}

async function getBody(stream) {
    let body = ''
    for await (const chunk of stream) {
        body += chunk
    }
    return body
}

function serveFile(request, response) {
    try {
        const filePath = request.url.slice(1) || 'index.html';
        const content = readFileSync(filePath);
        response.end(content);
    } catch (error) {
        response.statusCode = 404;
        response.end("File not found " + request.url);
    }
}

function loadTasks() {
    try {
        const json = readFileSync('tasks.json')
        tasks.splice(0, tasks.length, ...JSON.parse(json))
    } catch {

    }
}

function saveTasks() {
    writeFileSync('tasks.json', JSON.stringify(tasks, null, 2))
}

const next = require('next');
const express = require('express')
const bodyParser = require("body-parser");
const serviceBus = require('servicebus');
const http = require('http');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = express();
    server.use(bodyParser.json());

    server.get("/api/todos", function (req, res) {
        requestData(req, process.env.DATABASE_API_SERVICE_HOST, process.env.DATABASE_API_SERVICE_PORT, '/todos', 'GET', null, (data, error) => {
            if (error != null) {
                res.status(500).send(error);
                return;
            }
            
            res.setHeader('Content-Type', 'application/json');
            res.send(data);
        });
    });

    var bus = serviceBus.bus({ url: process.env.STATS_QUEUE_URI });
    bus.use(bus.logger());
    bus.on("error", err => {
        console.error(err.message)
        process.exit(1);
    })

    function updateStats(updateEvent) {
        console.log("Pushing stats update: " + updateEvent);
        bus.send(updateEvent, { todo: updateEvent });
    }

    server.post('/api/todos', function (req, res) {
        if (!req.body) {
            res.status(400).send("missing item");
            return;
        }
        requestData(req, process.env.DATABASE_API_SERVICE_HOST, process.env.DATABASE_API_SERVICE_PORT, '/todos', 'POST', req.body, (data, error) => {
            if (error != null) {
                res.status(500).send(error);
                return;
            }
            
            res.status(201).send(data);
            updateStats('todo.created');
        });
    });

    server.put("/api/todos/:id", function (req, res) {
        const id = req.params.id;
        requestData(req, process.env.DATABASE_API_SERVICE_HOST, process.env.DATABASE_API_SERVICE_PORT, '/todos?id=' + id, 'PUT', req.body, (data, error) => {
            if (error != null) {
                res.status(500).send(error);
                return;
            }
            
            res.send(data);
            updateStats('todo.completed');
        });
    });

    server.delete("/api/todos/:id", function (req, res) {
        const id = req.params.id;
        requestData(req, process.env.DATABASE_API_SERVICE_HOST, process.env.DATABASE_API_SERVICE_PORT, '/todos?id=' + id, 'DELETE', null, (data, error) => {
            if (error != null) {
                res.status(500).send(error);
                return;
            }

            res.send(data);
            updateStats('todo.deleted');
        });
    });

    server.get("/api/stats", function (req, res) {
        var options = {
            host: process.env.STATS_API_SERVICE_HOST,
            path: '/stats',
            method: 'GET'
        };
        const val = req.get('kubernetes-route-as');
        if (val) {
            console.log('Forwarding kubernetes-route-as header value - %s', val);
            options.headers = {
                'kubernetes-route-as': val
            }
        }
        var req = http.request(options, function(statResponse) {
            res.setHeader('Content-Type', 'application/json');
            var responseString = '';
            //another chunk of data has been received, so append it to `responseString`
            statResponse.on('data', function (chunk) {
                responseString += chunk;
            });
            statResponse.on('end', function () {
                res.send(responseString);
            });
        });

        req.on('error', function (e) {
            console.log('problem with request: ' + e.message);
          });
          
          req.end();
    });

    server.get('/', (req, res) => {
        console.log("Serving index");
        return app.render(req, res, '/index', {});
    });

    server.get('*', (req, res) => {
        return handle(req, res);
    });

    const port = process.env.PORT || 3000;
    server.listen(port, err => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${port}`);
    });

    process.on("SIGINT", () => {
        process.exit(130 /* 128 + SIGINT */);
    });

    process.on("SIGTERM", () => {
        bus.close();
        server.close(() => {
            process.exit(143 /* 128 + SIGTERM */);
        });
    });
});

function requestData(initialRequest, host, port, path, method, bodyObject, responseHandler) {
    console.log("%s - %s:%s%s", method, host, port, path);
    var options = {
        host: host,
        port: port,
        path: path,
        method: method,
        headers: {'content-type': 'application/json'}
    };
    const routeAsValue = initialRequest.get('kubernetes-route-as');
    if (routeAsValue) {
        console.log('Forwarding kubernetes-route-as header value: %s', routeAsValue);
        options.headers['kubernetes-route-as'] = routeAsValue;
    } else {
        console.log('No kubernetes-route-as header value to forward');
    }
    var newRequest = http.request(options, function(statResponse) {
        var responseString = '';
        //another chunk of data has been received, so append it to `responseString`
        statResponse.on('data', function (chunk) {
            responseString += chunk;
        });
        statResponse.on('end', function () {
            console.log('Response: %s', responseString);
            var responseObject;
            try {
                responseObject = JSON.parse(responseString);
            }
            catch (error) {
                responseObject = null;
            }
            responseHandler(responseObject, null);
        });
    });

    newRequest.on('error', function (error) {
        console.log('Request error: ' + error);
        responseHandler(null, error.message);
    });

    if (bodyObject != null) {
        newRequest.ContentType = 'application/json';
        newRequest.write(JSON.stringify(bodyObject));
    }

    newRequest.end();
}
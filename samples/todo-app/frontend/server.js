const next = require('next');
const express = require('express')
const bodyParser = require("body-parser");
const request = require('request');
const mongodb = require("mongodb");
const serviceBus = require('servicebus');
const http = require('http');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = express();
    server.use(bodyParser.json());

    const mongo = mongodb.MongoClient.connect(process.env.MONGO_CONNECTION_STRING, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    mongo.then(() => console.log("Connected to Mongo server"));
    mongo.catch(reason => {
        console.error(reason);
        process.exit(1);
    });

    server.get("/api/todos", function (req, res) {
        mongo.then(client => {
            const todos = client.db("todos").collection("todos");
            todos.find({}).toArray((err, docs) => {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.send(docs);
                }
            });
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
        console.log("POST /api/todos");
        if (!req.body) {
            res.status(400).send("missing item");
            return;
        }
        mongo.then(client => {
            const todos = client.db("todos").collection("todos");
            todos.insertOne(req.body, (err, result) => {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.status(201).send(req.body);
                    updateStats('todo.created');
                }
            });
        });
    });

    server.put("/api/todos/:id", function (req, res) {
        const id = req.params.id;
        console.log("PUT /api/todos/" + id);
        if (!mongodb.ObjectID.isValid(id)) {
            res.status(400).send("invalid id");
            return;
        }
        if (req.body && req.body._id) {
            res.status(500).send({ message: "Request body should not contain '_id' field." });
            return;
        }
        mongo.then(client => {
            const todos = client.db("todos").collection("todos");
            todos.updateOne({ _id: new mongodb.ObjectId(id) }, { $set: req.body }, (err, result) => {
                if (err) {
                    res.status(500).send(err);
                } else if (result.matchedCount == 0) {
                    res.sendStatus(404);
                } else {
                    res.sendStatus(204);
                    if (req.body.completed === true) {
                        updateStats('todo.completed');
                    }
                }
            });
        });
    });

    server.delete("/api/todos/:id", function (req, res) {
        const id = req.params.id;
        console.log("DELETE /api/todos/" + id);
        if (!mongodb.ObjectID.isValid(id)) {
            res.status(400).send("invalid id");
            return;
        }
        mongo.then(client => {
            const todos = client.db("todos").collection("todos");
            todos.deleteOne({ _id: new mongodb.ObjectId(id) }, (err, result) => {
                if (err) {
                    res.status(500).send(err);
                } else if (result.deletedCount == 0) {
                    res.sendStatus(404);
                } else {
                    res.sendStatus(204);
                    updateStats('todo.deleted');
                }
            });
        });
    });

    server.get("/api/stats", function (req, res) {
        var options = {
            host: process.env.STATS_API_HOST,
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

        req.on('error', function(e) {
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

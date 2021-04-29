var express = require('express');
var redis = require('redis');

var app = express();

var cache = redis.createClient({
    host: process.env.STATS_CACHE_SERVICE_HOST,
    port: process.env.STATS_CACHE_SERVICE_PORT,
    tls: process.env.REDIS_SSL == "true" ? {
        host: process.env.STATS_CACHE_SERVICE_HOST,
        port: process.env.STATS_CACHE_SERVICE_PORT,
    } : undefined,
    password: process.env.REDIS_PASSWORD || undefined
});

app.get('/hello', function (req, res) {
    console.log('hello!');
    res.send('hello!');
})

app.get('/stats', function (req, res) {
    console.log('request for stats received with kubernetes-route-as header: %s', req.get('kubernetes-route-as'));
    cache.get('todosCreated', function (err, created) {
        cache.get('todosCompleted', function (err, completed) {
            cache.get('todosDeleted', function (err, deleted) {
                res.send({
                    todosCreated: created || 0,
                    todosCompleted: completed || 0,
                    todosDeleted: deleted || 0
                });
            });
        });
    });
});

var port = process.env.PORT || 3001;
var server = app.listen(port, function () {
    console.log('Listening on port ' + port);
});

process.on("SIGINT", () => {
    process.exit(130 /* 128 + SIGINT */);
});

process.on("SIGTERM", () => {
    bus.close();
    cache.quit();
    server.close(() => {
        process.exit(143 /* 128 + SIGTERM */);
    });
});

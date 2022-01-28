var express = require('express');
var redis = require('redis');
var app = express();

var cache = redis.createClient({    
    socket:{
        host:process.env.STATS_CACHE_SERVICE_HOST,
        port:process.env.STATS_CACHE_SERVICE_PORT,
        tls: process.env.REDIS_SSL == "true" ? {
            host: process.env.STATS_CACHE_SERVICE_HOST,
            port: process.env.STATS_CACHE_SERVICE_PORT,
        } : undefined
    },
    password: process.env.REDIS_PASSWORD || undefined
});
cache.on('error', (err) => console.log('Redis Client Error', err));
cache.connect();

app.get('/hello', function (req, res) {
    console.log('hello!');
    res.send('hello!');
})

app.get('/stats', async function (req, res) {
    console.log('request for stats received with kubernetes-route-as header: %s', req.get('kubernetes-route-as'));  
    var created = 0;  
    var completed = 0;
    var deleted =0;
    try{
        var created = await cache.get('todosCreated');
        var completed = await cache.get('todosCompleted');
        var deleted = await cache.get('todosDeleted');
    } catch(err) {
        console.log(err);
    }
    res.send({
                todosCreated: created || 0,
                todosCompleted: completed || 0,
                todosDeleted: deleted || 0
            });
});

var port = process.env.PORT || 3001;
var server = app.listen(port, function () {
    console.log('Listening on port ' + port);
});

process.on("SIGINT", () => {
    process.exit(130 /* 128 + SIGINT */);
});

process.on("SIGTERM", async () => {
    bus.close();
    await cache.disconnect();
    server.close(() => {
        process.exit(143 /* 128 + SIGTERM */);
    });
});
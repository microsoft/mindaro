var serviceBus = require('servicebus');
var redis = require('redis');

var bus = serviceBus.bus({ url: process.env.STATS_QUEUE_URI });
bus.use(bus.logger());
bus.on("error", err => {
    console.error(err.message)
    process.exit(1);
})

var cache = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
});

function updateStat(stat) {
    console.log("Updating stat: " + stat);
    cache.incr(stat);
}

bus.listen('todo.created', function (event) {
    updateStat('todosCreated');
});

bus.listen('todo.completed', function (event) {
    updateStat('todosCompleted');
});

bus.listen('todo.deleted', function (event) {
    updateStat('todosDeleted');
});

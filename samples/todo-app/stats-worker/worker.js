var serviceBus = require('servicebus');
var redis = require('redis');

var bus = serviceBus.bus({ url: process.env.STATS_QUEUE_URI });
bus.use(bus.logger());
bus.on("error", err => {
    console.error(err.message)
    process.exit(1);
})

var cache = redis.createClient({
    socket:{
        host:process.env.REDIS_HOST,
        port:process.env.REDIS_PORT
    }
});
cache.on('error', (err) => console.log('Redis Client Error', err));
cache.connect();

async function updateStat(stat) {
    console.log("Updating stat: " + stat);
    await cache.incr(stat);
}

bus.listen('todo.created', async function (event) {
    await updateStat('todosCreated');
});

bus.listen('todo.completed', async function (event) {
    await updateStat('todosCompleted');
});

bus.listen('todo.deleted', async function (event) {
    await updateStat('todosDeleted');
});

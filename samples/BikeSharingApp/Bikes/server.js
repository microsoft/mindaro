// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

var morgan = require('morgan');
var bodyParser = require('body-parser');
var validate = require('validate.js');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var express = require('express');
var async = require('async');

var mongoDBDatabase = process.env.mongo_database || "admin";
var mongoDBCollection = process.env.mongo_collection || "bikes";
var mongoDBConnStr = process.env.mongo_connectionstring || "mongodb://databases-mongo";
console.log("Database: " + mongoDBDatabase);
console.log("Collection: " + mongoDBCollection);
console.log("MongoDB connection string: " + mongoDBConnStr);

// Will be initialized on server startup at the bottom
// Init to prototype to enable Intellisense
var mongoDB = require('mongodb').Db.prototype;

validate.validators.illegal = function(value, options, key, attributes) {
    if (value !== undefined && options) {
        return "cannot be provided";
    }
}

var incomingBikeSchema = {
    id: {
        illegal: true
    },
    available: {
        illegal: true
    },
    model: {
        presence: true,
        length: { minimum: 1 }
    },
    hourlyCost: {
        presence: true,
        numericality: { greaterThan: 0, noStrings: true }
    },
    imageUrl: {
        presence: true,
        length: { minimum: 1 }
    },
    address: {
        presence: true,
        length: { minimum: 1 }
    },
    type: {
        presence: true,
        inclusion: [ "mountain", "road", "tandem" ]
    },
    ownerUserId: {
        presence: true
    },
    suitableHeightInMeters: {
        presence: true,
        numericality: { greaterThan: 0, noStrings: true }
    },
    maximumWeightInKg: {
        presence: true,
        numericality: { greaterThan: 0, noStrings: true }
    }
};

var app = express();
app.use(requestIDParser);
app.use(morgan("dev"));
app.use(bodyParser.json());

var requestIDHeaderName = 'x-contoso-request-id';
var requestIDRegex = new RegExp(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)

function requestIDParser(req, res, next) {
    var reqID = req.header(requestIDHeaderName);
    var test = false;
    if (reqID) {
        test = requestIDRegex.test(reqID);
    }
    if (!test && req.path != "/hello") {
        res.status(400).send("Couldn't parse request id guid");
        return;
    }

    console.log("RequestID start: " + reqID);
    next();
    console.log("RequestID done: " + reqID);
}

// api ------------------------------------------------------------

// find bike ------------------------------------------------------------
app.get('/api/availableBikes', function (req, res) {
    var requestID = req.header(requestIDHeaderName);
    var query = { available: true };

    // Add user filter conditions
    for (var queryParam in req.query) {
        if (isNaN(req.query[queryParam])) {
            query[queryParam] = req.query[queryParam];
        }
        else {
            query[queryParam] = parseFloat(req.query[queryParam]);
        }
    }

    var cursor = mongoDB.collection(mongoDBCollection).find(query).sort({ hourlyCost: 1 }).limit(30);
    cursor.toArray(function(err, data) {
        if (err) {
            dbError(res, err, requestID);
            return;
        }

        data.forEach(function(bike) {
            bike.id = bike._id;
            delete bike._id;
        });

        res.send(data);
    });
});

app.get('/api/allbikes', function(req, res) {
    var requestID = req.header(requestIDHeaderName);

    var cursor = mongoDB.collection(mongoDBCollection).find({}).sort({ hourlyCost: 1 });
    cursor.toArray(function(err, data) {
        if (err) {
            dbError(res, err, requestID);
            return;
        }

        data.forEach(function(bike) {
            bike.id = bike._id;
            delete bike._id;
        });

        res.send(data);
    });
});

// new bike ------------------------------------------------------------
app.post('/api/bikes', function (req, res) {
    var requestID = req.header(requestIDHeaderName);
    var validationErrors = validate(req.body, incomingBikeSchema);
    if (validationErrors) {
        res.status(400).send(validationErrors);
        return;
    }

    var newBike = req.body;
    newBike.available = true;

    mongoDB.collection(mongoDBCollection).insertOne(newBike, function(err, result) {
        if (err) {
            dbError(res, err, requestID);
            return;
        }
        
        newBike.id = newBike._id;
        delete newBike._id;
        console.log(requestID + ' - inserted new bikeId: ' + newBike.id);
        res.send(newBike);
    });
});

// update bike ------------------------------------------------------------
app.put('/api/bikes/:bikeId', function(req, res) {
    var requestID = req.header(requestIDHeaderName);
    var validationErrors = validate(req.body, incomingBikeSchema);
    if (validationErrors) {
        res.status(400).send(validationErrors);
        return;
    }
    if (!ObjectId.isValid(req.params.bikeId))
    {
        res.status(400).send(req.params.bikeId + ' is not a valid bikeId!');
        return;
    }

    var updatedBike = req.body;

    mongoDB.collection(mongoDBCollection).updateOne({ _id: new ObjectId(req.params.bikeId) }, { $set: updatedBike }, function(err, result) {
        if (err) {
            dbError(res, err, requestID);
            return;
        }
        if (!result) {
            res.status(500).send('DB response was null!');
            return;
        }
        if (result.matchedCount === 0) {
            bikeDoesNotExist(res, req.params.bikeId);
            return;
        }
        if (result.matchedCount !== 1 && result.modifiedCount !== 1) {
            var msg = 'Unexpected number of bikes modified! Matched: "' + result.matchedCount + '" Modified: "' + result.modifiedCount + '"';
            console.log(requestID + " - " + msg);
            res.status(500).send(msg);
            return;
        }

        res.sendStatus(200);
    });
});

// get bike ------------------------------------------------------------
app.get('/api/bikes/:bikeId', function(req, res) {
    var requestID = req.header(requestIDHeaderName);
    if (!req.params.bikeId) {
        res.status(400).send('Must specify bikeId');
        return;
    }
    if (!ObjectId.isValid(req.params.bikeId))
    {
        res.status(400).send(req.params.bikeId + ' is not a valid bikeId!');
        return;
    }

    mongoDB.collection(mongoDBCollection).findOne({ _id: new ObjectId(req.params.bikeId) }, function(err, result) {
        if (err) {
            dbError(res, err, requestID);
            return;
        }
        if (!result) {
            bikeDoesNotExist(res, req.params.bikeId);
            return;
        }

        var theBike = result;
        // Hard code image url *FIX ME*
        theBike.imageUrl = "/static/logo.svg";
        theBike.id = theBike._id;
        delete theBike._id;

        res.send(theBike);
    });
});

// delete bike ------------------------------------------------------------
app.delete('/api/bikes/:bikeId', function(req, res) {
    var requestID = req.header(requestIDHeaderName);
    if (!req.params.bikeId) {
        res.status(400).send('Must specify bikeId');
        return;
    }
    if (!ObjectId.isValid(req.params.bikeId))
    {
        res.status(400).send(req.params.bikeId + ' is not a valid bikeId!');
        return;
    }
    
    mongoDB.collection(mongoDBCollection).deleteOne({ _id: new ObjectId(req.params.bikeId) }, function(err, result) {
        if (err) {
            dbError(res, err, requestID);
            return;
        }
        if (result.deletedCount === 0) {
            bikeDoesNotExist(res, req.params.bikeId);
            return;
        }
        if (result.deletedCount !== 1) {
            var msg = 'Unexpected number of bikes deleted! Deleted: "' + result.deletedCount + '"';
            console.log(requestID + " - " + msg);
            res.status(500).send(msg);
            return;
        }
        
        res.sendStatus(200);
    });
});

// reserve bike ------------------------------------------------------------
app.patch('/api/bikes/:bikeId/reserve', function(req, res) {
    var requestID = req.header(requestIDHeaderName);
    if (!req.params.bikeId) {
        res.status(400).send('Must specify bikeId');
        return;
    }

    processReservation(res, req.params.bikeId, false, requestID);
});

// clear bike ------------------------------------------------------------
app.patch('/api/bikes/:bikeId/clear', function(req, res) {
    var requestID = req.header(requestIDHeaderName);
    if (!req.params.bikeId) {
        res.status(400).send('Must specify bikeId');
        return;
    }

    processReservation(res, req.params.bikeId, true, requestID);
});

function processReservation(res, bikeId, changeTo, requestID) {
    if (!ObjectId.isValid(bikeId))
    {
        res.status(400).send(bikeId + ' is not a valid bikeId!');
        return;
    }

    mongoDB.collection(mongoDBCollection).updateOne({ _id: new ObjectId(bikeId), available: !changeTo }, { $set: { available: changeTo } }, function(err, result) {
        if (err) {
            dbError(res, err, requestID);
            return;
        }
        if (result.matchedCount === 0) {
            // Figure out if bike does not exist or if it was invalid reservation request
            mongoDB.collection(mongoDBCollection).findOne({ _id: new ObjectId(bikeId) }, function(err, result) {
                if (err) {
                    dbError(res, err, requestID);
                    return;
                }

                if (!result) {
                    bikeDoesNotExist(res, bikeId);
                }
                else {
                    // Invalid reservation request
                    res.status(400).send('Invalid reservation request was made for BikeId ' + bikeId);
                }
            });
            
            return;
        }
        if (result.matchedCount !== 1 && result.modifiedCount !== 1) {
            var msg = 'Unexpected number of bikes changed availability! Matched: "' + result.matchedCount + '" Modified: "' + result.modifiedCount + '"';
            console.log(requestID + " - " + msg);
            res.status(500).send(msg);
            return;
        }

        res.sendStatus(200);
    });
}

function bikeDoesNotExist(res, bikeId) {
    res.status(404).send('BikeId "' + bikeId + '" does not exist!');
}

function dbError(res, err, requestID) {
    console.log(requestID + " - " + err);
    res.status(500).send(err);
}

app.get('/hello', function(req, res) {
    res.status(200).send('hello!\n');
});

// start server ------------------------------------------------------------
var port = process.env.PORT || 3000;
var server = null;

process.on("SIGINT", () => {
    console.log("Interrupted. Terminating...");
    if (server) {
        server.close();
    }
    var tmp = mongoDB;
    mongoDB = null;
    tmp.close();
});

process.on("SIGTERM", () => {
    console.log("Terminating...");
    if (server) {
        server.close();
    }
    var tmp = mongoDB;
    mongoDB = null;
    tmp.close();
});

function tryMongoConnect(callback, results) {
    MongoClient.connect(mongoDBConnStr, { useUnifiedTopology: true }, function(err, db) {
        if (err) {
            console.error("Mongo connection error!");
            console.error(err);
        }
        
        if (db) {
            callback(err, db.db(mongoDBDatabase));
        } else {
            callback(err, null);
        }
    });
}

async.retry({times: 10, interval: 1000}, tryMongoConnect, function(err, result) {
    if (err) {
        console.error("Couldn't connect to Mongo! Giving up.");
        console.error(err);
        process.exit(1);
    }

    console.log("Connected to MongoDB");
    mongoDB = result;
    mongoDB.on('close', function() {
        if (mongoDB) { // SIGINT and SIGTERM
            console.log('Mongo connection closed! Shutting down.');
            process.exit(1);
        }
    });

    // Start server
    server = app.listen(port, function () {
        console.log('Listening on port ' + port);
    });
});

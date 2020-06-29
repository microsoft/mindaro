// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var Connection = require('tedious').Connection;
var fs = require('fs');
var validate = require('validate.js');
var util = require('util');
var async = require('async');

var port = 80;
var serviceName = "User Management Service";
var app = express();
app.use(morgan("dev"));
app.use(bodyParser.json());

var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;
var config = JSON.parse(fs.readFileSync('ConnectionConfig.json', 'utf8')).config;
config.authentication.options.userName = process.env.sql_username || 'SA';
config.authentication.options.password = process.env.sql_password || '!DummyPassword123!';
config.server = process.env.sql_server || 'databases-sql';
config.options.database = process.env.sql_database || 'master';
var dbConnection = Connection.prototype; // Will be initialized below

var tableName = process.env.sql_table || 'myTable'
var jsonColumnName = "JSON_F52E2B61-18A1-11d1-B105-00805F49916B"

var userSchema = {
    id: {
        presence: true
    },
    name: {
        presence: true,
        length: { minimum: 1 }
    },
    address: {
        presence: true,
        length: { minimum: 1 }
    },
    email: {
        presence: true
    },
    type: {
        presence: true,
        inclusion: [ "vendor", "customer" ]
    },
    phone: {
        format: {
            pattern: "[0-9]+",
            length: { minimum: 8, maximum: 15 }
        }
    }
};

function execInsert(params, callbackAffectedRows) {
    var sqlStatement = util.format(
        "INSERT INTO %s (Id, Name, Address, Phone, Email, Type) VALUES (@Id, @Name, @Address, @Phone, @Email, @Type)",
        tableName)
    var request = new Request(sqlStatement, function (err, rowCount) {
        if (err) {
            console.log('Statement failed: ' + err);
            callbackAffectedRows(rowCount, err);
            return;
        }
        callbackAffectedRows(rowCount);
    });
    request.addParameter('Id', TYPES.NVarChar, params.id);
    request.addParameter('Name', TYPES.NVarChar, params.name);
    request.addParameter('Address', TYPES.NVarChar, params.address);
    request.addParameter('Phone', TYPES.NVarChar, params.phone);
    request.addParameter('Email', TYPES.NVarChar, params.email);
    request.addParameter('Type', TYPES.NVarChar, params.type);
    dbConnection.execSql(request);
}

function execUpdate(sqlStatement, callbackAffectedRows) {
    var request = new Request(sqlStatement, function (err, rowCount) {
        if (err) {
            console.log('Statement failed: ' + err);
            callbackAffectedRows(rowCount, err);
        }
        callbackAffectedRows(rowCount);
    });
    dbConnection.execSql(request);
}

function execSelect(statement, callbackReturnResult) {
    var sqlStatement = statement.toString() + ' FOR JSON PATH';
    var request = new Request(sqlStatement, function (err, rowCount) {
        if (err) {
            console.log('Statement failed: ' + err);
            callbackAffectedRows(rowCount, err);
        }
        if (rowCount == 0) {
            callbackReturnResult(null);
        }
    });
    dbConnection.execSql(request);
    var result = null;
    request.on('row', function (columns) {
        result = JSON.parse(columns[jsonColumnName].value);
        callbackReturnResult(result);
    });
}

function execStatement(sqlStatement, callbackAffectedRows) {
    var request = new Request(sqlStatement, function (err, rowCount) {
        if (err) {
            console.log('Statement failed: ' + err);
            callbackAffectedRows(rowCount, err);
        }
            callbackAffectedRows(rowCount);
    });
    dbConnection.execSql(request);
}

function createTableIfNotExists(callbackFunc) {
    sqlStatement = util.format(
        "IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].%s') AND type in (N'U')) BEGIN CREATE TABLE %s(Id NVARCHAR(100) NOT NULL PRIMARY KEY, Name NVARCHAR(100) NOT NULL, Address NVARCHAR(500) NOT NULL, Phone NVARCHAR(22) NULL, Email NVARCHAR(100) NOT NULL, Type NVARCHAR(20) NOT NULL)END",
        tableName, tableName)
    var request = new Request(sqlStatement, function (err, rowCount) {
        if (err) {
            console.log('Statement failed: ' + err);
        }

        callbackFunc(err);
    });

    dbConnection.execSql(request);
}

// api -------------------------------------------------------------

app.get('/hello', function (req, res) {
    console.log("saying hello...");
    res.send("Hello from Users")
});

app.get('/api/users/:userId', function (req, res) {
    // get user details
    var selectStatement = util.format("SELECT Id,Name,Address,Phone,Email,Type FROM %s WHERE Id='%s'", tableName, req.params.userId);
    execSelect(selectStatement, function (result, err) {
        if (err) {
            res.status(500).send(err);
            return;
        }
        if (result == null) {
            console.log("No records found.")
            res.status(404).send("User not found");
        } else {
            console.log(JSON.stringify(result, null, 2));
            res.status(200).send(result[0]);
        }
    });
});

app.get('/api/allUsers', function (req, res) {
    var selectStatement = util.format("SELECT Id,Name,Address,Phone,Email,Type FROM %s", tableName);
    execSelect(selectStatement, function (result, err) {
        if (err) {
            res.status(500).send(err);
            return;
        }
        if (result == null) {
            console.log("No records found.");
            res.status(200).send([]);
        } else {
            res.status(200).send(result);
        }
    });
});

app.post('/api/users', function (req, res) {
    // add user details
    var validationErrors = validate(req.body, userSchema);
    if (validationErrors) {
        res.status(400).send(validationErrors);
        return;
    }

    execInsert(req.body, function (rowCount, err) {
        if (err) {
            res.status(500).send(err);
            return;
        }
        console.log("Affected Row(s): " + rowCount);
        if (rowCount == 0) {
            res.status(400).send("Bad Request.");
        } else {
            res.status(200).send();
        };
    });
});

app.put('/api/users/:userId', function (req, res) {
    // update user
    var sqlStatement = util.format("UPDATE %s SET Name='%s',Address='%s',Phone='%s',Email='%s' WHERE Id='%s'", tableName, req.body.name, req.body.address, req.body.phone, req.body.email, req.params.userId);
    execUpdate(sqlStatement, function (rowCount, err) {
        if (err) {
            res.status(500).send(err);
            return;
        }
        console.log("Affected Row(s): " + rowCount);
        if (rowCount == 0) {
            res.status(400).send("Bad Request.");
        } else {
            res.status(200).send();
        };
    });
});

app.delete('/api/users/:userId', function (req, res) {
    var deleteStatement = util.format("DELETE FROM %s WHERE Id='%s'", tableName, req.params.userId);
    execStatement(deleteStatement, function (rowCount, err) {
        if (err) {
            res.status(500).send(err);
            return;
        }
        if (rowCount == 0) {
            res.status(400).send("Bad Request.");
        } else {
            res.status(202).send("Accepted.");
        };
    });
});

// application -------------------------------------------------------------

function trySqlConnect(callback) {
    dbConnection = new Connection(config);
    dbConnection.on('connect', function (err) {
        if (err) {
            console.error('Can\'t connect to the database: ' + err);
            callback(err);
        } else {
            console.log('Connected to the database');
            createTableIfNotExists(function(err) {
                if (err) {
                    console.error('Can\'t create table: ' + err);
                }
                callback(err);
            });
        }
    });
    dbConnection.on('end', function () {
        console.error('Lost SQL connection! Shutting down.');
        process.exit(1);
    });
}

async.retry({times: 20, interval: 1000}, trySqlConnect, function(err) {
    if (err) {
        console.error("Couldn't connect to SQL! Giving up.");
        console.error(err);
        process.exit(1);
    }

    app.listen(port, function () {
        console.log(serviceName + ' listening on port ' + port);
    });
});
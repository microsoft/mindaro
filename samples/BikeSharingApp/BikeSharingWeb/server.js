// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const express = require('express');
const next = require('next');
const url = require('url');

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare()
    .then(() => {
        const server = express()

        server.get('/api/host', (req, res) => {
            var apiHost = url.format({
                protocol: req.protocol,
                hostname: getApiUrl(req.get('host'))
            });

            console.log("API_HOST = " + apiHost);

            res.status(200).send({
                apiHost: apiHost
            });
        });

        server.get('/preview/:id', (req, res) => {
            return app.render(req, res, '/preview', { id: req.params.id })
        });

        server.get('/', (req, res) => {
            console.log("Serving index");
            return app.render(req, res, '/index', {})
        });

        server.get('*', (req, res) => {
            return handle(req, res)
        });

        server.listen(port, (err) => {
            if (err) throw err
            console.log(`> Ready on http://localhost:${port}`)
        });
    });

function getApiUrl(host) {
    // break up hostname parts into array
    var hostArr = host.split(".");

    // find prefix
    var prefix = "";
    if (hostArr.indexOf("s") >= 0) {
        prefix = hostArr[0] + ".s."
    }

    // find base hostname
    var root = 0;
    var start = 2;
    if (prefix !== "" && prefix !== null) {
        root += 2;
        start += 2;
    }
    var baseHost = hostArr.slice(start, hostArr.length).join('.');
    var apiName = process.env.API_NAME || "gateway";

    // return full URL of API service (spacePrefix + rootSpace + apiName + host)
    if (prefix !== "" && prefix !== null)
    {
        return prefix + hostArr[root] + "." + apiName + "." + baseHost;
    }
    // The below will construct the URL for Connect with routing scenarios where there is no .s. convention
    return host.replace("bikesharingweb", apiName);
}
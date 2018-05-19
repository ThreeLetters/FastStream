const http = require('http');
const SnappyJS = require('snappyjs')

const URL = require('url');
const SimpleSockets = require("simplesockets");
http.globalAgent.maxSockets = 20;
var size = 2e6;

var requests = 0;
var total = 0;

var speeds = [];

function request(url, callback, r, r2) {
    try {
        url = URL.parse(url);
        var options = {
            host: url.host,
            path: url.path,
            port: url.port || 80,
            method: 'GET'
        }
        //console.log(options)
        var content = [];
        requests++;
        var req = http.request(options, function (res) {
            //res.setEncoding('binary');
            //console.log("Connected");
            res.on('data', function (data) {
                content.push(data);
            });
            res.on('end', function () {
                requests--;
                var buffer = Buffer.concat(content);
                callback(buffer, res.headers)
            })
            res.on('error', function () {
                requests--;
                log('error')
                callback(false)
            })
        });
        req.setHeader('Range', 'bytes=' + r + '-' + r2);

        req.end();
    } catch (e) {
        log(e)
        callback(false)
    }
}

var port = process.env.PORT || 8080
log('binding to ' + port);
var server = new SimpleSockets({
    port: port
})
var clients = [];

server.on("connection", function (client) {
    clients.push(client)

    log(`Client (IP: ${client.IP}) connected!`)


    client.on("setinfo", function (m) {
        log("Client set info: " + m.info.source)


        client.source = m.info.source;
        client.size = m.info.size;
        client.max = m.info.max;
        client.compress = m.compress
        client.emit('hasinfo', true)
    })
    client.on("get", function (index) {
        if (client.source) {
            var start = client.size * index;
            var end = start + client.size - 1;
            if (start > client.max) return;
            if (end >= client.max) end = client.max - 1;
            var startTime = Date.now();
            request(client.source, function (dt) {
                if (dt && dt.length) {


                    if (speeds.length > requests) {
                        speeds.splice(0, 1);
                    }
                    speeds.push(dt.length / (Date.now() - startTime))
                    total += dt.length;
                    if (end - start + 1 !== dt.length) {
                        log("Size mismatch: " + (end - start + 1) + ", " + dt.length)
                        client.emit('err', index)
                        return;
                    }
                    if (client.compress) {
                        dt = SnappyJS.compress(dt)
                    }
                    /*
                    var newDt = Buffer.alloc(dt.length + 3);
                    newDt.writeUInt8(2, 0);
                    newDt.writeUInt16BE(index, 1);

                    dt.copy(newDt, 3);
                    */

                    client.emit('data', index)
                    client.socket.send(dt, {
                        binary: true
                    })
                } else {
                    client.emit('err', index)
                }
            }, start, end)
        }
    })
    client.on("disconnect", () => {
        log("Client " + client.IP + " disconnect")
        var ind = clients.indexOf(client);
        if (ind != -1) clients.splice(ind, 1)
    })
});
const EOL = require('os').EOL;
var width = process.stdout.columns;

function fill(text, w) {
    text = text.toString();
    while (text.length < w) {
        text += ' ';
    }
    return text;
}

function log(a) {
    console.log(fill(a.toString(), width))
}
setInterval(() => {
    var sum = 0;
    if (speeds.length > requests) {
        speeds.splice(0, 1);
    }
    speeds.forEach((s) => {
        sum += s;
    })
    var speed = Math.round(sum * 8e-6 * 1000 * 10) / 10

    process.stdout.write("\x1b[44m\x1b[37m");
    process.stdout.write(fill("  Connected Clients: " + fill(clients.length, 5) + "Requests: " + fill(requests, 5) + "Speed: " + fill(speed + 'mbs', 9) + 'Total: ' + fill((Math.round(total * 10 * 1e-6) / 10) + 'MB', 10), width))
    process.stdout.write("\x1b[0m\u001B[0m\r");


}, 1000)

var snrub = require('snrub'),
  express = require('express');

var secret = process.env.SECRET || "Not much of one.";
var host = process.env.HOST || "http://localhost:8001";

var app = express.createServer();

var push = snrub.createSubscriber({host: host, secret: secret});

app.configure(function() {
  app.use(express.logger());
  app.use(push.middleware());
  app.use(express.static(__dirname + '/public'));
});

var sjs = require('sockjs').listen(app, {prefix: '[/]sockjs'});

var connections = {};

var subs = {};

function add_sub(hub, topic, connection) {
  var sub = subs[topic];
  if (sub) {
    console.log("Already subscribed to " + topic);
    for (var i in sub.connections) {
      if (sub.connections[i] === connection) return;
    }
    sub.connections.push(connection);
    connection.write(JSON.stringify({subscribed: topic}));
  }
  else {
    console.log({attempt: 'subscribe', hub: hub, topic: topic});
    push.subscribe(hub, topic, {leaseSeconds: 10 * 60},
                   function(path) {
                     subs[topic] = {hub: hub, connections: [connection], path: path};
                     console.log({success: topic, path: path});
                   },
                   function(status) {
                     console.log({error: status});
                     connection.write(
                       JSON.stringify(
                         {error:
                          {reason: "Bad response from hub: " + status,
                           topic: topic, hub: hub}}));
                   });
  }
}

function send_topic(topic, obj) {
  var sub = subs[topic];
  if (sub) {
    var str = JSON.stringify(obj);
    sub.connections.forEach(function(conn) {
      if (conn.writable) {
        conn.write(str);
      }
    });
  }
}

function delete_subs(connection) {
  for (topic in subs) {
    if (subs.hasOwnProperty(topic)) {
      var sub = subs[topic];
      for (var i in sub.connections) {
        if (sub.connections[i] === connection) {
          sub.connections.splice(i, 1);
        }
      }
      if (sub.connections.length === 0) {
        // attempt to unsubscribe
        console.log({attempt: 'unsubscribe', hub: sub.hub,
                     topic: topic, path: sub.path});
        push.unsubscribe(sub.hub, topic, sub.path);
      }
    }
  }
}

function broadcast(obj) {
  var str = JSON.stringify(obj);
  for (var k in connections) {
    if (connections.hasOwnProperty(k)) {
      connections[k].write(str, 'utf8');
    }
  }
}

sjs.on('connection', function(connection) {
  var id = JSON.stringify(connection.address);
  connections[id] = connection;
  connection.on('close', function() {
    delete connections[id];
    delete_subs(connection);
  });
  connection.on('data', function(msg) {
    var obj;
    try {
      obj = JSON.parse(msg);
    }
    catch (e) {
      connection.write(JSON.stringify({protocol_error: "Cannot parse message"}));
      return;
    }
    if (obj.subscribe && obj.subscribe.hub && obj.subscribe.topic) {
      var topic = obj.subscribe.topic;
      var hub = obj.subscribe.hub;
      add_sub(hub, topic, connection);
    }
  });
});

push.on('subscribe', function(topic) {
  send_topic(topic, {subscribed: topic});
  console.log({subscribed: topic});
});

push.on('unsubscribe', function(topic) {
  send_topic(topic, {unsubscribed: topic});
  console.log({unsubscribed: topic});
  delete subs[topic];
});

push.on('error', function(errorObj) {
  var topic = errorObj.topic;
  send_topic(topic, {error: errorObj});
  console.log({error: errorObj});
  delete subs[topic];
});

push.on('update', function(topic, content) {
  send_topic(topic, {update: {topic: topic, content: content}});
});

app.listen(process.env.VCAP_APP_PORT || 8001);

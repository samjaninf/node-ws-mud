var app = require('express')();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);

app.get('/', function (req, res) {
  res.sendFile(path.resolve(__dirname + '/../html/index.html'));
});

io.on('connection', function (socket) {
  // console.log('a user has connected');
  io.emit('join', { 'user':'blarg' });
  socket.on('com', function (msg) {
    // console.log('message: ' + msg);
    io.emit('com', msg);
  });
});

http.listen(3000, function () {
  console.log('listening on *:3000');;
})

var net = require('net');
var aup = require('ansi_up').ansi_to_html;
var aeh = require('ansi_up').escape_for_html ;
var ali = require('ansi_up').linkify;
var gui = require('nw.gui');
var win = gui.Window.get();

var TelnetInput = require('telnet-stream').TelnetInput;
var TelnetOutput = require('telnet-stream').TelnetOutput;

var display = function(data) {
  console.log(data);
}

var socket = net.createConnection(4545, 'narutofor.us', function() {
// var socket = net.createConnection(4100, '6d.genesismuds.com', function() {
// var socket = net.createConnection(4000, 'dbinfinity.bounceme.net', function() {
  var telnetInput = new TelnetInput().setEncoding('utf8');
  var telnetOutput = new TelnetOutput();
  var serverNawsOk = false;

  var sendWindowSize = function() {
    var nawsBuffer = new Buffer(4);
    nawsBuffer.writeInt16BE(win.width, 0);
    nawsBuffer.writeInt16BE(win.height, 2);
    telnetOutput.writeSub(NAWS, nawsBuffer);
  };

  // Ignore all options for now!
  telnetInput.on('do', function(option) {
    if (option === NAWS) {
      serverNawsOk = true;
      telnetOutput.writeWill(NAWS);
      sendWindowSize();
    }
    telnetOutput.writeWont(option);
    console.log("Option #: "+option);
  });

  telnetInput.on('will', function(option) {
    telnetOutput.writeDont(option);
    console.log("Option #: "+option);
  });

  $('a').click(function (e) {
    console.log("You clicked a link, now suffer! "+e);
  });

  // Deal with data coming in from the mud.
  telnetInput.on('data', function(funk) {
    // Strip out all the extra \r from mud output
    var chunk = funk.replace(/(\r)/gm, "");
    // ansi up the output and append it to the main body.
      // * with link
    // $('#main_body').append(ali(aup($.trim(aeh(chunk)))));
      // * without link
    $('#main_body').append(aup($.trim(aeh(chunk))));
    // change the height of the main output window on load
    $('#main_body').scrollTop(document.getElementById("main_body").scrollHeight);
  });

  $('#main_input').on('autosize:resized', function () {
    $('#main_body').height(win.height - $('#main_input').height() - 105);
  });

  // Deal with data going in to the mud.
  // telnetOutput.on('')
  $('#main_input').bind('keyup', 'return', function () {
    // Scroll to the bottom of the output whenever someone hits enter
    $('#main_body').scrollTop(document.getElementById("main_body").scrollHeight);
    // Send information to the mud via a stream
    telnetOutput.write($(this).val());
    // Since this is a one off client, meant to be customized, this will close on
    // them quitting, hopefully will find a way to close on them getting kicked
    // maybe or even when they get their password wrong. Any DC event should
    // probably close.
    if ($(this).val().toLowerCase().indexOf("quit") != -1)
      win.close();
    // Empty the value of the text box field.
    // @TO-DO make it so that their buffer is stored in a history.
    $(this).val("");
  });

  // Listen for the close event and clean up database connections and the like.
  win.on('close', function () {
    this.hide();
    console.log("Doing some shutdown work here.");
    this.close(true);
  });

  win.on('resize', function (w, h) {
    // Keep size of the input window consistent through resizing.
    $('#main_input').width(w - 100);
    if (serverNawsOk) {
      sendWindowSize();
    }
  });

  // Pipe socket output stream to telnetInput
  socket.pipe(telnetInput);
  // Pipe player input from telnetOutput t osocket.
  telnetOutput.pipe(socket);
});

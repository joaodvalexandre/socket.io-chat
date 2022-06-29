var app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    Crypt = require("g-crypt"),
    passphrase = 'passphrasethatsucks',
    crypter = Crypt(passphrase),
    port = process.env.PORT || 3000,
    nicknames = [];

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  Object.keys(nicknames).forEach(function (key){
    io.emit('user update', key);
  });

  socket.on('user update', function(id){
    nicknames.push(id);
    io.emit('user update', nicknames, nicknames.length);
    console.log(id+' has connected.');
    io.emit('chat message', id+' has connected.');
  });

  socket.on('user update delete', function(id, nick){
    for(var i = 0; i < nicknames.length; i++){
      if(nicknames[i] == id){
        nicknames.remove(id);
        console.log(id+' has disconnected.');
        io.emit('chat message', id+' has disconnected.');
      } else if(nicknames[i] == nick){
        nicknames.remove(nick);
        console.log(nick+' has disconnected.');
        io.emit('chat message', nick+' has disconnected.');
      }
    }
    io.emit('user update delete', nicknames.length, nicknames);
  });

  socket.on('chat message', function(msg){
    if(msg != ''){
      if (msg.indexOf('@') > -1) {
        user = msg.split(" ");
        user = user[1].replace('@', '');
        for(var i = 0; i < nicknames.length; i++){
          if(nicknames[i] == user){
            io.emit('call notify', user, 'You have been mentioned');
            break;
          }
        }
      }
      console.log(msg);
      io.emit('chat message', msg);
    }
  });

  socket.on('user is typing', function(id, nick, is_typing){
    if(is_typing){
      for(var i = 0; i < nicknames.length; i++){
        if(nicknames[i] == id){
          io.emit('user is typing', id, true);
        } else if(nicknames[i] == nick){
          io.emit('user is typing', nick, true);
        }
      }
    } else {
      for(var i = 0; i < nicknames.length; i++){
        if(nicknames[i] == id){
          io.emit('user is typing', id, false);
        } else if(nicknames[i] == nick){
          io.emit('user is typing', nick, false);
        }
      }
    }
  });

  socket.on('change nickname', function(id, nick, oldnick){
    if(nick != ''){
      has_user = false;
      for(var i = 0; i < nicknames.length; i++){
        if(nicknames[i] == nick){
          has_user = true
        }
      }
      if(has_user){
        io.emit('call notify', id, 'Can\'t create a nickname that already exists.');
      } else {
        for(var i = 0; i < nicknames.length; i++){
          if(nicknames[i] == id){
            nicknames[i] = nick;
            io.emit('user update', nicknames, nicknames.length);
            console.log(id+' has changed its nickname to '+nick);
            io.emit('change nickname', id, nick, id+' has changed its nickname to '+nick, true);
          } else if(nicknames[i] == oldnick){
            nicknames[i] = nick;
            io.emit('user update', nicknames, nicknames.length);
            console.log(oldnick+' has changed its nickname to '+nick);
            io.emit('change nickname', id, nick, oldnick+' has changed its nickname to '+nick, true);
          }
        }
      }
    }
  });

  socket.on('disconnect', function(){
    io.emit('user update delete', nicknames.length, nicknames);
  });
});

http.listen(port, function(){
  console.log('Listening on *:' + port);
});

Array.prototype.remove = function() {
  var what, a = arguments, L = a.length, ax;
  while (L && this.length) {
      what = a[--L];
      while ((ax = this.indexOf(what)) !== -1) {
          this.splice(ax, 1);
      }
  }
  return this;
};
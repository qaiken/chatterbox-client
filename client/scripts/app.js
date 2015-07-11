var app;

(function() {

  var cachedMessages = [];
  var chatRooms = [];
  var friends = {};
  var messageContainer;
  var timer;
  var server = 'https://api.parse.com/1/classes/chatterbox';

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  };

  function initFeed(data) {
    messageContainer.html('');

    frag = $(document.createDocumentFragment());

    _.each(data.results, function(data) {
      if(_.indexOf(cachedMessages, data.createdAt) == -1) {
        cachedMessages.push(data.createdAt);
      }
      if( data.roomname === $('#chat-room').val() ) {
        frag.append(buildMessage(data));
      }
    });

    messageContainer.append(frag);
  }

  function buildMessage(data) {
    var div = $('<div />');
    var friendClass = '';
    if(!data.text || !data.username) {
      return;
    }
    var userName = escapeHtml(data.username).split(' ').join('');
    if(friends[userName]) {
      friendClass = 'friend';
    }
    div.append('<p class="user-name '+userName+' '+friendClass+'">User:<span>'+ escapeHtml(data.username) +'</span></p>');
    div.append('<p>'+ escapeHtml(data.text) +'</p>');
    return div;
  }

  function switchRooms() {
    cachedMessages = [];
    $('#new-chatroom').val(this.value);
    fetch();
  }

  function messageParse() {
    var message = {
      username: $('#user-name').val(),
      text: $('#message').val(),
      roomname: $('#new-chatroom').val()
    };

    $('#message').val('');

    send(message);
  }

  function addFriend() {
    var userName = $(this).find('span').text().split(' ').join('');

    if(friends[userName]) {
      friends[userName] = false;
    } else {
      friends[userName] = true;
    }

    $('.'+userName).each(function(i,el) {
      $(el).toggleClass('friend',friends[userName]);
    });
  }

  function init(params) {
    messageContainer = params.container;

    messageContainer.on('click','.user-name',addFriend);

    $('#send-message').on('click',messageParse);
    $('#chat-room').on('change',switchRooms);

    fetch();
  };

  function send(message) {
    $.ajax({
      // This is the url you should use to communicate with the parse API server.
      url: server,
      type: 'POST',
      data: JSON.stringify(message),
      contentType: 'application/json',
      success: function (data) {
        clearInterval(timer);
        fetch();
        console.log('chatterbox: Message sent');
      },
      error: function (data) {
        // See: https://developer.mozilla.org/en-US/docs/Web/API/console.error
        console.error('chatterbox: Failed to send message');
      }
    });
  };

  function fetch() {
    $.ajax({
      url: server,
      type: 'GET',
      data: {order: '-createdAt'},
      contentType: 'application/json',
      success: function(data) {
        clearInterval(timer);
        timer = setInterval(fetch,5000);
        displayMessages(data);
      },
      error: function (data) {
        // See: https://developer.mozilla.org/en-US/docs/Web/API/console.error
        console.error('chatterbox: Failed to fetch message');
      }
    });
  };

  function displayMessages(data) {
    var frag;

    _.each(data.results, function(data) {
      var roomname = data.roomname;
      if( _.indexOf(chatRooms,roomname) === -1 ) {
        chatRooms.push(roomname);
        $('#chat-room').append('<option value="'+ roomname +'">'+roomname+'</option');
      }
    });

    if(!cachedMessages.length) {
      initFeed(data);
      return;
    }

    if( JSON.stringify(data.results[0]) === JSON.stringify(cachedMessages[0]) ) {
      return;
    }

    frag = $(document.createDocumentFragment());

    for(var i = 0; i < data.results.length; i++) {
      if(_.indexOf(cachedMessages, data.results[i].createdAt) > -1) {
        break;
      }
      cachedMessages.push(data.results[i].createdAt);
      if( data.results[i].roomname === $('#chat-room').val() ) {
        frag.append(buildMessage(data.results[i]));
      }
    }

    messageContainer.prepend(frag);
  };

  app = {
    server: server,
    init: init,
    send: send,
    fetch: fetch,
    displayMessages: displayMessages
  };

}());

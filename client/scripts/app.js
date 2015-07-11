var app;

(function() {

  var cachedMessages = [];
  var chatRooms = [];
  var messageContainer;
  var timer;

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
        frag.append(buildMessage(data.text));
      }
    });

    messageContainer.append(frag);
  }

  function buildMessage(text) {
    var div = $('<div />');
    if(!text) {
      return;
    }
    div.append('<p>'+ escapeHtml(text) +'</p>');
    return div;
  }

  function switchRooms() {
    cachedMessages = [];
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

  function init(params) {
    messageContainer = params.container;

    $('#send-message').on('click',messageParse);
    $('#chat-room').on('change',switchRooms);

    fetch();
  };

  function send(message) {
    $.ajax({
      // This is the url you should use to communicate with the parse API server.
      url: 'https://api.parse.com/1/classes/chatterbox',
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
      url: 'https://api.parse.com/1/classes/chatterbox',
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
        frag.append(buildMessage(data.results[i].text));
      }
    }

    messageContainer.prepend(frag);
  };

  app = {
    init: init,
    send: send,
    fetch: fetch,
    displayMessages: displayMessages
  };

}());

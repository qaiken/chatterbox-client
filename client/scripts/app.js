var app;

$(function() {

  var $messageContainer, timer;
  var cachedMessages = [];
  var chatRooms = [];
  var friends = {};
  var $spinner = $('.spinner');
  var $messageForm = $('#message-form');
  var $chatRoomSelector = $('#chat-room-select');
  var $userName = $('#user-name');
  var $newChatRoom = $('#new-chatroom');
  var $message = $('#message');
  var $sendMessage = $('#send-message');
  var server = 'https://api.parse.com/1/classes/chatterbox';

  function initFeed(messages) {
    var frag = $(document.createDocumentFragment());

    $messageContainer.html('');

    _.each(messages, function(message) {
      if(_.indexOf(cachedMessages, message.createdAt) == -1) {
        cachedMessages.push(message.createdAt);
      }
      if( message.roomname === $chatRoomSelector.val() ) {
        frag.append(buildMessage(message));
      }
    });

    $messageContainer.append(frag);
  }

  function buildMessage(data) {
    var userName;
    var div = $('<div />');
    var friendClass = '';

    if(!data.text || !data.username) {
      return;
    }

    userName = _.escape(data.username).replace(/ +/g,'');

    if(friends[userName]) {
      friendClass = 'friend';
    }

    div.append('<p class="user-name '+friendClass+'" data-username="'+userName+'">User:<span>'+userName+'</span></p>');
    div.append('<p>'+ _.escape(data.text) +'</p>');
    return div;
  }

  function appendNewMessages(messages) {
    var frag = $(document.createDocumentFragment());

    for(var i = 0; i < messages.length; i++) {
      if(_.indexOf(cachedMessages, messages[i].createdAt) > -1) {
        break;
      }
      cachedMessages.push(messages[i].createdAt);
      if( messages[i].roomname === $chatRoomSelector.val() ) {
        frag.append(buildMessage(messages[i]));
      }
    }

    $messageContainer.prepend(frag);
  }

  function buildChatRooms(messages) {
    _.each(messages, function(message) {
      var roomname = _.escape(message.roomname);
      if( _.indexOf(chatRooms,roomname) === -1 ) {
        chatRooms.push(roomname);
        $chatRoomSelector.append('<option value="'+ roomname +'">'+roomname+'</option');
      }
    });
  }

  function switchRooms() {
    cachedMessages = [];
    $newChatRoom.val(this.value);
    fetch();
  }

  function messageParse() {

    var userName = $userName.val();
    var text = $message.val();
    var roomName = $newChatRoom.val();

    if( !userName || !text || !roomName) {
      return;
    }

    var message = {
      username: userName,
      text: text,
      roomname: roomName
    };

    $message.val('');

    send(message);
  }

  function addFriend() {
    var userName = $(this).data('username');

    if(friends[userName]) {
      friends[userName] = false;
    } else {
      friends[userName] = true;
    }

    $('.user-name[data-username="'+userName+'"]').each(function(i,el) {
      $(el).toggleClass('friend',friends[userName]);
    });
  }

  function init(params) {
    $messageContainer = params.container;

    $messageContainer.on('click','.user-name',addFriend);

    $messageForm.on('submit',function(e) {
      e.preventDefault();
    });

    $sendMessage.on('click',messageParse);
    $chatRoomSelector.on('change',switchRooms);

    fetch();
  };

  function send(message) {

    $spinner.show();

    $.ajax({
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
        $spinner.fadeOut();
      },
      error: function (data) {
        console.error('chatterbox: Failed to fetch message');
      }
    });
  };

  function displayMessages(data) {

    buildChatRooms(data.results);

    if(!cachedMessages.length) {
      initFeed(data.results);
      return;
    }

    if( JSON.stringify(data.results[0]) !== JSON.stringify(cachedMessages[0]) ) {
      appendNewMessages(data.results);
    }

  };

  app = {
    server: server,
    init: init,
    send: send,
    fetch: fetch,
    displayMessages: displayMessages
  };

});

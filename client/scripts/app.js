var app;

(function() {

  var cachedMessages = [];
  var messageContainer;

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  };
  function buildMessage(text) {
    var div = $('<div />');
    if(!text) {
      return;
    }
    div.append('<p>'+ escapeHtml(text) +'</p>');
    return div;
  }
  function init(params) {
    messageContainer = params.container;
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
      success: function (data) {
        // var test = data.results[3].text;
        // test = escapeHtml(test);

        // if !cachedMessages.length
        var frag;

        if(!cachedMessages.length) {
          frag = $(document.createDocumentFragment());
          // loop through all of data.results
          _.each(data.results, function(data) {
            frag.append(buildMessage(data.text));
          });
          cachedMessages = data.results;
          // append to #main
          messageContainer.append(frag);

          return;

        }

        // check first message - data.results[0]
        if( JSON.stringify(data.results[0]) === JSON.stringify(cachedMessages[0]) ) {
          return;
        }

        frag = $(document.createDocumentFragment());

        for(var i = 0; i < data.results.length; i++) {
          if(_.indexOf(cachedMessages, data.results[i]) > -1) {
            return;
          }
          frag.append(buildMessage(data.results[i].text));
        }
        messageContainer.append(frag);


        // setTimeout to call fetch again
         setTimeout(fetch,5000);

      },
      error: function (data) {
        // See: https://developer.mozilla.org/en-US/docs/Web/API/console.error
        console.error('chatterbox: Failed to fetch message');
      }
    });
  };
  function displayMessages() {

  };

  app = {
    init: init,
    send: send,
    fetch: fetch,
    displayMessages: displayMessages
  }

}());

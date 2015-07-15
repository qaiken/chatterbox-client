var $chatRoomSelect = $('#chat-room-select');
var $newChatRoom = $('#new-chatroom');
var $feed = $('#feed');
var onscreenMessages = {};

var Message = Backbone.Model.extend({
  url: 'https://api.parse.com/1/classes/chatterbox/',
  defaults: {
    username: '',
    text: '',
    roomname: 'lobby'
  }
});

var Messages = Backbone.Collection.extend({
  url: 'https://api.parse.com/1/classes/chatterbox/',
  model: Message,

  loadMsgs: function() {
    this.fetch({data: { order: '-createdAt' }});
  },

  parse: function(response, options){
    var results = [];
    for( var i = response.results.length-1; i >= 0; i-- ){
      results.push(response.results[i]);
    }
    return results;
  }

});


var FormView = Backbone.View.extend({

  initialize: function(){
    this.collection.on('sync', this.stopSpinner, this);
    this.collection.on('sync', this.buildChatRooms, this);

    this.chatRooms = [];
    this.$text = this.$('#message');
    this.$userName = this.$('#user-name');
    this.$roomName = this.$('#new-chatroom');
    this.$spinner = this.$('.spinner');
    this.$chatRoomSelect = this.$('#chat-room-select');
  },

  events: {
    'submit #message-form': 'handleSubmit',
    'change #chat-room-select': 'switchRooms'
  },

  switchRooms: function(e) {
    onscreenMessages = {};
    $feed.html('');

    $newChatRoom.val(e.target.value);

    this.collection.loadMsgs();
  },

  handleSubmit: function(e) {
    e.preventDefault();

    this.startSpinner();

    this.collection.create({
      username: this.$userName.val(),
      text: this.$text.val(),
      roomname: this.$roomName.val()
    });

    this.$text.val('');
  },

  buildChatRooms: function() {

    var appendChatRoom = function(message) {
      var roomname = _.escape(message.get('roomname'));
      if( _.indexOf(this.chatRooms,roomname) === -1 ) {
        this.chatRooms.push(roomname);
        this.$chatRoomSelect.append('<option value="'+ roomname +'">'+roomname+'</option');
      }
    };

    this.collection.forEach(appendChatRoom,this);

  },

  startSpinner: function() {
    this.$spinner.show();
  },

  stopSpinner: function() {
    this.$spinner.fadeOut('fast');
  }

});

var MessageView = Backbone.View.extend({

  template: _.template('<div class="chat" data-id="<%- objectId %>"> \
                       <div class="user-name" data-username="<%- username %>"><%- username %></div> \
                       <div class="text"><%- text %></div> \
                       </div>'),

  render: function() {
    this.$el.html(this.template(this.model.attributes));
    return this.$el;
  }

});

var MessagesView = Backbone.View.extend({

  initialize: function() {
    this.collection.on('sync', this.render, this);
    this.friends = {};
  },

  events: {
    'click .user-name': 'addFriend'
  },

  addFriend: function(e) {
    var userName = $(e.target).data('username');

    if(this.friends[userName]) {
      this.friends[userName] = false;
    } else {
      this.friends[userName] = true;
    }

    this.$('.user-name[data-username="'+userName+'"]').each(function(i,el) {
      $(el).toggleClass('friend',this.friends[userName]);
    }.bind(this));
  },

  render: function() {
    this.collection.forEach(this.renderMessage, this);
  },

  renderMessage: function(message) {
    var $frag = $(document.createDocumentFragment());

    if( message.get('roomname') === $chatRoomSelect.val() && !onscreenMessages[message.get('objectId')] ) {
      var messageView = new MessageView({model: message});
      $frag.prepend(messageView.render());
      onscreenMessages[message.get('objectId')] = true;
    }

    this.$el.prepend($frag);
  }

});
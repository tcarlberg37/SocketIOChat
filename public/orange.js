$(function(){
    //var socket = io.connect('http://localhost:3000');
    var socket = io('/orange');
    var message = $('#message');
    var username = $('#username');
    var send_message = $('#send_message');
    var change_username = $('#change_username');
    var chatroom = $('#chatroom');
    var typing_message = $('#typing_message');
    var change_room_list = $('#change_room_list');
    var change_room_btn = $('#change_room_btn');
    var room_name = $('#room_name');

    // send new message from the socket
    send_message.click(function() {
        socket.emit('new_message', {message: message.val()})
    })

    socket.on('user_joined', (info) => {
        console.log(info);
        chatroom.append('<p class="message">' + info.username + ' has joined the chat room.<p>');
    })

    socket.on('user_disconnect', (info) => {
        console.log(info);
        chatroom.append('<p class="message">' + info.username + ' has left the chat room.<p>');
    })

    // add to the chatroom once socket has emitted new_message
    socket.on('new_message', (info) => {
        console.log(info);
        chatroom.append('<p class="message">' + info.username + ' says: ' + info.message + '<p>');
        message.val(""); // reset message text box to empty after message is sent
    })

    // change username by emitting to socket
    change_username.click(function() {
        console.log(username.val());
        socket.emit('change_username', {username: username.val()});
    })

    // add message when user is typing
    message.bind('keypress', () => {
        socket.emit('typing');
    })

    socket.on('typing', (user) => {
        typing_message.html('<p><i>' + user.username + ' is typing...</i></p>');
    })

    socket.on('no_typing', () => {
        typing_message.html('<p><br/></p>');
    })

    /*
    // This is never called because I could not get it to change the socket room in one page properly
    socket.on('change_room', (new_room) => {
        socket.emit('change_room', new_room);
        socket = io('/' + new_room); // change the socket
        console.log(socket);
        room_name.html('<h2 id="room_name">' + new_room + '</h2>');
        chatroom.append('<p class="message"><i>' + new_room + '</i><p>');
    })

    change_room_btn.click(function() {
        console.log(change_room_list.val());
        socket.emit('change_room', {new_room: change_room_list.val()});
    })
    */
});
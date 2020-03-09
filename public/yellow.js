$(function(){
    var socket = io('/yellow');
    var message = $('#message');
    var username = $('#username');
    var send_message = $('#send_message');
    var change_username = $('#change_username');
    var chatroom = $('#chatroom');
    var typing_message = $('#typing_message');

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
});
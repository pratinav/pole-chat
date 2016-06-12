window.onload = function() {

    var socket = io();
    var init = false;
    var loginWrapperEl = document.querySelector('.login-wrapper');
    var loginFormEl = document.querySelector('.login');
    var loginInputEl = document.querySelector('.login-input');
    var usernameInvalidEl = document.querySelector('.username-invalid');
    var usernameTakenEl = document.querySelector('.username-taken');
    var usersOnlineEl = document.querySelector('.users-online');
    var userNumEl = document.querySelectorAll('.user-no');
    var chatBoxEl = document.querySelector('.chatbox');
    var messageFormEl = document.querySelector('.send-msg form');
    var messageInputEl = document.querySelector('.msg');
    var openSideBarEl = document.querySelector('.pull');
    var closeSideBarEl = document.querySelector('.close');
    var username;
    var users;

    loginFormEl.addEventListener('submit', onLogin);
    messageFormEl.addEventListener('submit', onMessage);
    openSideBarEl.addEventListener('click', toggleSideBar);
    closeSideBarEl.addEventListener('click', toggleSideBar);

    socket.on('init', onInit);
    socket.on('joined', postNotice);
    socket.on('disconnect', postNotice);
    socket.on('chat message', postMessage);

    function onLogin(evt) {
        evt.preventDefault();
        if (!init) return;
        username = loginInputEl.value.trim();
        if (!validateUsername())
            return;

        users.push(username);
        socket.emit('login', username);

         document.querySelector('.me').appendChild(document.createTextNode(username));

        loginWrapperEl.classList.add('login-wrapper--disabled');
        loginWrapperEl.addEventListener('transitionend', function(evt) {
            loginWrapperEl.parentNode.removeChild(loginWrapperEl);
            loginWrapperEl.removeEventListener('transitionend', this);
        });

        loginFormEl.removeEventListener('submit', onLogin);
    }

    function validateUsername() {
        if (usernameInvalidEl.style.display === 'block')
            usernameInvalidEl.style.display = 'none';
        if (usernameTakenEl.style.display === 'block')
            usernameTakenEl.style.display = 'none';
        if (!/^[a-z0-9_-]{3,15}$/i.test(username)) {
            usernameInvalidEl.style.display = 'block';
            return false;
        }
        var usernameTaken = false;
        for (var i = 0; i < users.length; i++) {
            if (users[i] === username) {
                usernameTaken = true;
                break;
            }
        }
        if (usernameTaken) {
            usernameTakenEl.style.display = 'block';
            return false;
        }
        return true;
    }

    function onInit(existingUsers) {
        init = true;
        users = existingUsers;
        updateUserNum(users.length + 1);
        users.forEach(function(user) {
            var newUserListEl = document.createElement('div');
            newUserListEl.setAttribute('data-user', user);
            var newUsername = document.createTextNode(user);
            newUserListEl.appendChild(newUsername);
            usersOnlineEl.appendChild(newUserListEl);
        });
    }

    function onMessage(evt) {
        evt.preventDefault();
        var msg = messageInputEl.value.trim();
        if (!msg)
            return;
        postMessage(msg, username, new Date());
        socket.emit('chat message', msg, username);
        messageInputEl.value = '';
    }

    function postNotice(user) {
        var index = users.indexOf(user);
        var hasLeft = index > -1;
        var newNoticeEl = document.createElement('li');
        newNoticeEl.classList.add('notice');
        var newUserEl = document.createElement('span');
        newUserEl.classList.add('user');
        newUserEl.appendChild(document.createTextNode(user));
        newNoticeEl.appendChild(newUserEl);
        newNoticeEl.appendChild(document.createTextNode(' ' + (hasLeft ? 'disconnected' : 'connected')));
        chatBoxEl.appendChild(newNoticeEl);
        scrollDown();
        if (hasLeft) {
            usersOnlineEl.removeChild(usersOnlineEl.querySelector('div[data-user="' + user + '"]'));
            users.splice(index, 1);
        } else {
            var newUserListEl = document.createElement('div');
            newUserListEl.setAttribute('data-user', user);
            newUserListEl.appendChild(document.createTextNode(user));
            usersOnlineEl.appendChild(newUserListEl);
            users.push(user);
        }
        updateUserNum(users.length);
    }

    function postMessage(msg, user) {
        var time = getTime();
        var newBubbleEl = document.createElement('div');
        newBubbleEl.classList.add('bubble');
        newBubbleEl.setAttribute('data-time', time);
        newBubbleEl.appendChild(document.createTextNode(msg));
        var newTimeEl;
        var lastMessageEl = chatBoxEl.querySelectorAll('li');
        lastMessageEl = lastMessageEl[lastMessageEl.length - 1];
        if (lastMessageEl && lastMessageEl.getAttribute('data-user') === user) {
            var lastBubbleEl = lastMessageEl.querySelectorAll('.bubble');
            lastBubbleEl = lastBubbleEl[lastBubbleEl.length - 1];
            if (lastBubbleEl.getAttribute('data-time') === time) {
                var brEl = document.createElement('br');
                lastMessageEl.insertBefore(brEl, lastBubbleEl.nextSibling);
                lastMessageEl.insertBefore(newBubbleEl, brEl.nextSibling);
            } else {
                newTimeEl = document.createElement('span');
                newTimeEl.classList.add('time');
                newTimeEl.appendChild(document.createTextNode(time));
                lastMessageEl.appendChild(newBubbleEl);
                lastMessageEl.appendChild(newTimeEl);
            }
        } else {
            var newMessageEl = document.createElement('li');
            newMessageEl.setAttribute('data-user', user);
            if (user === username)
                newMessageEl.classList.add('mine');
            else {
                var newUserEl = document.createElement('span');
                newUserEl.classList.add('name');
                newUserEl.appendChild(document.createTextNode(user));
                newMessageEl.appendChild(newUserEl);
            }
            newTimeEl = document.createElement('span');
            newTimeEl.classList.add('time');
            newTimeEl.appendChild(document.createTextNode(time));
            newMessageEl.appendChild(newBubbleEl);
            newMessageEl.appendChild(newTimeEl);
            chatBoxEl.appendChild(newMessageEl);
        }
        scrollDown();
    }

    function updateUserNum(newUserNum) {
        for (var x = 0; x < userNumEl.length; x++)
            userNumEl[x].innerHTML = newUserNum + ' User' + (users.length > 0 ? 's' : '');
    }

    function toggleSideBar() {
        usersOnlineEl.classList.toggle('users-online--visible');
    }

};

function getTime() {
    var time = new Date();
    var hours = time.getHours();
    var minutes = time.getMinutes();
    if (hours < 10) hours = '0' + hours;
    if (minutes < 10) minutes = '0' + minutes;
    return hours + ':' + minutes;
}

function scrollDown() {
    window.scrollTo(0, document.body.scrollHeight);
}

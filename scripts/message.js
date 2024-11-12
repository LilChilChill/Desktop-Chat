const socket = io('http://localhost:5000');
let currentFriendId = null;
let selectedFile = null;
let friendAvatar = null;
let friendName = null; 

function getFriends() {
    const token = localStorage.getItem('token'); 

    if (!token) {
        alert('Vui lòng đăng nhập.');
        window.location.href = 'index.html'; 
        return;
    }

    fetch('http://localhost:5000/api/users/friends', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(friends => {
        const friendList = document.getElementById('friendList');
        const headerName = document.getElementById('header')
        friendList.innerHTML = ''; 

        if (friends.length === 0) {
            friendList.innerHTML = '<p>Không có bạn bè nào.</p>';
        } else {
            friends.forEach(friend => {
                const friendAvatar = friend.avatar && friend.avatar.data && typeof friend.avatar.data === 'string'
                    ? `data:${friend.avatar.contentType};base64,${friend.avatar.data}`
                    : null;

                const friendItem = document.createElement('div');
                friendItem.classList.add('friend-item');
                friendItem.innerHTML = `
                    <div class='chatUser' onclick="openChat('${friend._id}', '${friend.name}', '${friendAvatar}')">
                        <img src="${friendAvatar}" alt="${friend.name}" class="avatar">
                        <div class='content'>
                            <span>${friend.name}</span>
                        </div>
                    </div>
                `;
                friendList.appendChild(friendItem);
            });
        }
    })
    .catch(error => {
        console.error('Lỗi khi lấy danh sách bạn bè:', error);
        document.getElementById('friendList').innerHTML = '<p>Không thể tải danh sách bạn bè. Vui lòng thử lại sau.</p>';
    });
}

function openChat(friendId, name, avatar, page = 1) {
    friendName = name;
    friendAvatar = avatar;
    document.getElementById('username').textContent = friendName;
    document.getElementById('avatar').src = friendAvatar;
    currentFriendId = friendId;

    const friendInfo = document.getElementById('headerSide')
    friendInfo.innerHTML = '<p style="color: #000;">Loading ...</p>'

    const chatArea = document.getElementById('chatArea');
    chatArea.innerHTML = '<p class="loading">Đang tải tin nhắn...</p>';

    const fileData = document.getElementById('file')
    fileData.innerHTML = '<p>Loading ...</p>'

    fetch(`http://localhost:5000/api/messages/${friendId}?page=${page}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Lỗi khi lấy tin nhắn');
        }
        return response.json();
    })
    .then(messages => {
        chatArea.innerHTML = '';
        friendInfo.innerHTML = '';
        fileData.innerHTML = '';

        if (messages.length === 0) {
            chatArea.innerHTML = '<p>Không có tin nhắn nào.</p>';
            friendInfo.innerHTML = ''
            fileData.innerHTML = '';
        } else {
            messages.forEach(message => {
                const messageDiv = document.createElement('div');
                messageDiv.classList.add('message', message.sender === friendId ? 'received' : 'sent');
                
                const fileDataUrl = message.file && message.file.data && typeof message.file.data === 'string'
                    ? `data:${message.file.contentType};base64,${message.file.data}`
                    : null;
                    
                messageDiv.innerHTML = `
                    ${message.sender === friendId ? 
                        `<img src="${friendAvatar}" alt="${friendName}" class="avatar">` : 
                        `<img src="" alt="Bạn" style="display: none;">`
                    }
                    <div class="msgContent">
                        <div style="display: flex; flex-direction: row; align-items: center;">
                            <div class="messageContent">
                                <p>${message.content.replace(/\n/g, '<br>')}</p> <!-- Chuyển đổi dòng mới -->
                            </div>
                            <div class="chat">
                            <a href="#"><i class="fa-regular fa-face-smile"></i></a>
                            <a href="#"><i class="fa-solid fa-share"></i></a>
                            <a href="#"><i class="fa-solid fa-ellipsis-vertical"></i></a>
                            </div>
                        </div>
                        ${fileDataUrl ? `<img src="${fileDataUrl}" class="imgContent" />` : ''}
                    </div>
                `;

                friendInfo.innerHTML = `
                    <img src="${friendAvatar}" alt="Ảnh đại diện" id="headerAva"/>
                    <p>${friendName}</p>
                    <div>
                        <a href="#"><i class="fa-solid fa-bell"></i></a>
                        <a href="#"><i class="fa-solid fa-magnifying-glass"></i></a>
                    </div>
                `

                fileData.innerHTML = `
                    <a href="#" onclick="fileToggle()"><p>File phương tiện & file</p></a>
                    <div style="display: none" id="fileDisplay">
                        <a href="#"><p>File phương tiện</p></a>
                        <a href="#"><p>File</p></a>
                    </div>
                `

                chatArea.appendChild(messageDiv);
                
            });
        }

        chatArea.scrollTop = chatArea.scrollHeight; 
    })
    .catch(error => {
        console.error('Lỗi khi lấy tin nhắn:', error);
        chatArea.innerHTML = '<p>Không thể tải tin nhắn. Vui lòng thử lại sau.</p>';
    });
}



function fileToggle(){
    document.getElementById('fileDisplay').style.display = document.getElementById('fileDisplay').style.display === 'none'? 'flex' : 'none';
}
document.getElementById('fileInput').addEventListener('change', function(event) {
    const fileInput = event.target;
    selectedFile = fileInput.files[0]; 

    if (selectedFile) {
        const chatInput = document.getElementById('inputPreview');
        chatInput.innerHTML = `<img src="${URL.createObjectURL(selectedFile)}" alt="Selected File" class="imgPreview"/>`;
    }
});

document.getElementById('sendButton').addEventListener('click', () => {
    const messageInput = document.getElementById('chatInput');
    const content = messageInput.value.trim(); 

    if (!content && !selectedFile || !currentFriendId) {
        return;
    }

    const messageData = new FormData();
    messageData.append('content', content);
    messageData.append('receiverId', currentFriendId);

    if (selectedFile) {
        messageData.append('file', selectedFile);
    }

    fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: messageData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Lỗi khi gửi tin nhắn');
        }
        return response.json();
    })
    .then(data => {
        messageInput.value = ''; 
        selectedFile = null; 
        document.getElementById('inputPreview').innerHTML = ''; 

        
        socket.emit('sendMessage', {
            content: data.messageData.content,
            receiverId: currentFriendId,
            sender: localStorage.getItem('userId'), 
            file: data.messageData.file
        });

        
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'sent');

        const fileDataUrl = data.messageData.file && data.messageData.file.data && typeof data.messageData.file.data === 'string'
            ? `data:${data.messageData.file.contentType};base64,${data.messageData.file.data}`
            : null;

        messageDiv.innerHTML = `
            <div class="msgContent">
                <div class="messageContent">
                    <p>${data.messageData.content.replace(/\n/g, '<br>')}</p>
                </div>
                ${fileDataUrl ? `<img src="${fileDataUrl}" class="imgContent" />` : ''}
            </div>
        `; 
        document.getElementById('chatArea').appendChild(messageDiv);
        chatArea.scrollTop = chatArea.scrollHeight; 
    })
    .catch(error => {
        console.error('Lỗi khi gửi tin nhắn:', error);
    });
});

socket.on('receiveMessage', (messageData) => {
    if (messageData.receiverId === currentFriendId || messageData.sender === currentFriendId) {
        const chatArea = document.getElementById('chatArea');
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', messageData.sender === currentFriendId ? 'received' : 'sent');
        
        const fileDataUrl = messageData.file && messageData.file.data && typeof messageData.file.data === 'string'
            ? `data:${messageData.file.contentType};base64,${messageData.file.data}`
            : null;

        const avatarUrl = messageData.sender === currentFriendId ? friendAvatar : 'path_to_user_avatar';

        messageDiv.innerHTML = `
            <img src="${avatarUrl}" alt="${messageData.sender === currentFriendId ? friendName : 'Bạn'}" class="avatar">
            <div class="msgContent">
                <div class="messageContent">
                    <p>${messageData.content.replace(/\n/g, '<br>')}</p>
                </div>
                ${fileDataUrl ? `<img src="${fileDataUrl}" class="imgContent" />` : ''}
            </div>
        `;
        chatArea.appendChild(messageDiv);
        chatArea.scrollTop = chatArea.scrollHeight;
    }
});


document.getElementById('deleteChatButton').addEventListener('click', () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử chat không?')) {
        fetch(`http://localhost:5000/api/messages/delete/${currentFriendId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Lỗi khi xóa lịch sử chat');
            }
            document.getElementById('chatArea').innerHTML = '<p>Đã xóa lịch sử chat.</p>';
        })
        .catch(error => {
            console.error('Lỗi khi xóa lịch sử chat:', error);
        });
    }
});

getFriends();
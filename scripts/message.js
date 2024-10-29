const socket = io('http://localhost:5000');
let currentFriendId = null;
let selectedFile = null; 

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
        friendList.innerHTML = ''; 

        if (friends.length === 0) {
            friendList.innerHTML = '<p>Không có bạn bè nào.</p>';
        } else {
            friends.forEach(friend => {
                const friendItem = document.createElement('div');
                friendItem.classList.add('friend-item');
                friendItem.innerHTML = `
                    <div class='chatUser' onclick="openChat('${friend._id}', '${friend.name}', 'http://localhost:5000/${friend.avatar || 'default-avatar.png'}')">
                        <img src="http://localhost:5000/${friend.avatar || 'default-avatar.png'}" alt="${friend.name}" class="avatar">
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

function openChat(friendId, friendName, friendAvatar) {
    document.getElementById('username').textContent = friendName;
    document.getElementById('avatar').src = friendAvatar;
    currentFriendId = friendId;

    const chatArea = document.getElementById('chatArea');
    chatArea.innerHTML = '<p class="loading">Đang tải tin nhắn...</p>';

    fetch(`http://localhost:5000/api/messages/${friendId}`, {
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

        if (messages.length === 0) {
            chatArea.innerHTML = '<p>Không có tin nhắn nào.</p>';
        } else {
            const userAvatar = localStorage.getItem('avatar') 
                ? `http://localhost:5000/${localStorage.getItem('avatar').replace(/\\/g, '/')}` 
                : 'default-avatar.png';

            messages.forEach(message => {
                const messageDiv = document.createElement('div');
                messageDiv.classList.add('message', message.sender === friendId ? 'received' : 'sent');
                
                const senderAvatarUrl = `http://localhost:5000/uploads/Avatars/${message.sender}/avatar.png`;

                messageDiv.innerHTML = `
                    ${message.sender === friendId ? 
                        `<img src="${friendAvatar}" alt="${friendName}" class="avatar">` : 
                        `<img src="${senderAvatarUrl}" alt="Bạn" style="display: none;" >`
                    }
                    <div class="msgContent">
                        <div class="messageContent">
                        <p>${message.content}</p>
                        <p class="contentTime">${message.timestamp}</p>
                        </div>
                        ${message.file ? `<img src="http://localhost:5000/${message.file}" class="imgContent" />` : ''}
                    </div>
                `;
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


document.getElementById('fileInput').addEventListener('change', function(event) {
    const fileInput = event.target;
    selectedFile = fileInput.files[0]; 

    
    if (selectedFile) {
        // document.getElementById('chatInput').value = `Đã chọn file: ${selectedFile.name}`;
        const chatInput = document.getElementById('inputPreview')
        chatInput.innerHTML = `<img src="${selectedFile.name}" />`
    }
    // if (selectedFile) {
    //     document.getElementById('chatInput').value = `<img src="http://localhost:5000/${selectedFile.name}" />`;
    // }
});

document.getElementById('sendButton').addEventListener('click', () => {
    const messageInput = document.getElementById('chatInput');
    const content = messageInput.value;

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
        openChat(currentFriendId, document.getElementById('username').textContent, document.getElementById('avatar').src);
    })
    .catch(error => {
        console.error('Lỗi khi gửi tin nhắn:', error);
    });
});

socket.on('receiveMessage', (messageData) => {
    if (messageData.receiverId === currentFriendId || messageData.sender === currentFriendId) {
        openChat(currentFriendId, '', '');
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
            return response.json();
        })
        .then(data => {
            const chatArea = document.getElementById('chatArea');
            chatArea.innerHTML = '<p>Lịch sử chat đã được xóa.</p>';
        })
        .catch(error => {
            console.error('Lỗi khi xóa lịch sử chat:', error);
        });
    }
});

document.addEventListener('DOMContentLoaded', getFriends);

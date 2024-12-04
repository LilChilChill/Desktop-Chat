const socket = io('https://server-57ql.onrender.com');
let currentFriendId = null;
let selectedFile = null;
let friendAvatar = null;
let friendName = null; 
let currentPage = 1;

socket.on('connect', () => {
    const userId = localStorage.getItem('userId');

    console.log('Đã kết nối với server:', socket.id);
    if (userId) {
        socket.emit('register', userId);
        console.log(`Đã gửi sự kiện đăng ký userId: ${userId}`);
    } else {
        console.error('Không tìm thấy userId trong localStorage.');
    }
});

socket.on('receiveMessage', (message) => {
    console.log('Nhận tin nhắn:', message);
});

socket.on('disconnect', () => {
    console.log('Mất kết nối tới server.');
});

//----------------------------------------------------- PRIVATE CHAT -------------------------------------------------------------\\
function getFriends() {
    const token = localStorage.getItem('token'); 

    if (!token) {
        alert('Vui lòng đăng nhập.');
        window.location.href = 'index.html'; 
        return;
    }

    fetch('https://server-57ql.onrender.com/api/users/friends', {
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
                    : '../img/default-avatar.png';

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
    currentPage = 1;

    const friendInfo = document.getElementById('headerSide');
    friendInfo.innerHTML = `
        <div class="three-body">
            <div class="three-body__dot"></div>
            <div class="three-body__dot"></div>
            <div class="three-body__dot"></div>
        </div>
    `;

    const chatArea = document.getElementById('chatArea');
    chatArea.innerHTML = `
        <div style="display: flex; justify-content: center;">
            <div class="three-body">
                <div class="three-body__dot"></div>
                <div class="three-body__dot"></div>
                <div class="three-body__dot"></div>
            </div>
        </div>
    `;

    const fileData = document.getElementById('file');
    fileData.innerHTML = '';

    fetch(`https://server-57ql.onrender.com/api/messages/${friendId}?page=${page}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
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
            } else {
                let lastMessageDate = null;

                messages.forEach(message => {
                    // const messageDate = new Date(message.date).toLocaleDateString();

                    // // Thêm date separator nếu ngày thay đổi
                    // if (lastMessageDate !== messageDate) {
                    //     const dateSeparator = document.createElement('div');
                    //     dateSeparator.classList.add('date-separator');
                    //     dateSeparator.textContent = messageDate;
                    //     chatArea.appendChild(dateSeparator);
                    //     lastMessageDate = messageDate;
                    // }

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
                            <div class="messageContent">
                                <p>${message.content.replace(/\n/g, '<br>')}</p>
                            </div>
                            ${fileDataUrl ? `<img src="${fileDataUrl}" class="imgContent" />` : ''}
                            </div>
                            `;
                            // ${message.date ? `<p class="msgDate">${message.date}</p>` : ''}
                            
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
                                    <a href="#"><p>- File phương tiện</p></a>
                                    <a href="#"><p>- File</p></a>
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

document.getElementById('fileInput').addEventListener('change', function(event) {
    const fileInput = event.target;
    selectedFile = fileInput.files[0]; 

    if (selectedFile) {
        const chatInput = document.getElementById('inputPreview');
        const fileInput = document.getElementById('chatInput');
        
        if (selectedFile.type.startsWith('image/')) {
            chatInput.innerHTML = `<img src="${URL.createObjectURL(selectedFile)}" alt="Selected File" class="imgPreview"/>`;
        } else {
            chatInput.innerHTML = `<p>${selectedFile.name}</p>`;
        }
    }
});


document.getElementById('sendButton').addEventListener('click', () => {
    const messageInput = document.getElementById('chatInput');
    const content = messageInput.value.trim(); 
    const chatFunction = document.getElementById('chatFunction');

    if (!content && !selectedFile || !currentFriendId) {
        return;
    }

    const messageData = new FormData();
    messageData.append('content', content);
    messageData.append('receiverId', currentFriendId); 

    if (selectedFile) {
        messageData.append('file', selectedFile); 
    }

    fetch('https://server-57ql.onrender.com/api/messages', {
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
            chatType: 'private',
            receiverId: currentFriendId,
            sender: localStorage.getItem('userId'),
            content: content,
            file: selectedFile ? {
                name: selectedFile.name,
                type: selectedFile.type,
                size: selectedFile.size
            } : null,
            date: data.date
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
                // <p class="msgDate">${data.messageData.date}</p>
        console.log('time', data.messageData.date)
        document.getElementById('chatArea').appendChild(messageDiv);
        chatArea.scrollTop = chatArea.scrollHeight; 
        
    })
    .catch(error => {
        console.error('Lỗi khi gửi tin nhắn:', error);
    });
});


socket.on('receiveMessage', (messageData) => {
    const chatArea = document.getElementById('chatArea');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', messageData.sender === currentFriendId ? 'received' : 'sent');

    const fileDataUrl = messageData.file && messageData.file.data && typeof messageData.file.data === 'string'
        ? `data:${messageData.file.contentType};base64,${messageData.file.data}`
        : null;

    const avatarUrl = messageData.sender === currentFriendId ? friendAvatar : '../img/default-avatar.png';

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
});


document.getElementById('deleteChatButton').addEventListener('click', () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử chat không?')) {
        fetch(`https://server-57ql.onrender.com/api/messages/delete/${currentFriendId}`, {
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

let isLoadingMessages = false; 

document.getElementById('chatArea').addEventListener('scroll', () => {
    const chatArea = document.getElementById('chatArea');
    
    if (chatArea.scrollTop === 0 && !isLoadingMessages) {
        loadOlderMessages();
    }
});

function loadOlderMessages() {
    isLoadingMessages = true;
    fetch(`https://server-57ql.onrender.com/api/messages/${currentFriendId}?page=${currentPage + 1}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Lỗi khi lấy tin nhắn cũ');
            }
            return response.json();
        })
        .then(messages => {
            if (messages.length > 0) {
                const chatArea = document.getElementById('chatArea');

                currentPage++;

                let lastMessageDate = null;

                messages.forEach(message => {
                    // const messageDate = new Date(message.date).toLocaleDateString();

                    // if (lastMessageDate !== messageDate) {
                    //     const dateSeparator = document.createElement('div');
                    //     dateSeparator.classList.add('date-separator');
                    //     dateSeparator.textContent = messageDate;
                    //     chatArea.insertBefore(dateSeparator, chatArea.firstChild);
                    //     lastMessageDate = messageDate;
                    // }

                    const messageDiv = document.createElement('div');
                    messageDiv.classList.add('message', message.sender === currentFriendId ? 'received' : 'sent');

                    const fileDataUrl = message.file && message.file.data && typeof message.file.data === 'string'
                        ? `data:${message.file.contentType};base64,${message.file.data}`
                        : null;

                    messageDiv.innerHTML = `
                        ${message.sender === currentFriendId ? 
                            `<img src="${friendAvatar}" alt="${friendName}" class="avatar">` : 
                            `<img src="" alt="Bạn" style="display: none;">`}
                        <div class="msgContent">
                            <div class="messageContent">
                                <p>${message.content.replace(/\n/g, '<br>')}</p>
                            </div>
                            ${fileDataUrl ? `<img src="${fileDataUrl}" class="imgContent" />` : ''}
                        </div>
                    `;

                    chatArea.insertBefore(messageDiv, chatArea.firstChild);
                });
            }
        })
        .catch(error => {
            console.error('Lỗi khi lấy tin nhắn cũ:', error);
        })
        .finally(() => {
            isLoadingMessages = false;
        });
}

document.getElementById('chatInput').addEventListener('keydown', (event) => {
    
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); 
        document.getElementById('sendButton').click(); 
    }
});

function fileToggle(){
    document.getElementById('fileDisplay').style.display = document.getElementById('fileDisplay').style.display === 'none'? 'flex' : 'none';
}

function sideMenu(){
    document.getElementById('sideMenu').style.display = document.getElementById('sideMenu').style.display === 'none'? 'flex' : 'none';
    document.getElementById('icon').style.left = document.getElementById('icon').style.left === '65%' ? '86%' : '65%';
}

function emojiToggle(){
    document.getElementById('emoji').style.display = document.getElementById('emoji').style.display === 'none'? 'flex' : 'none';
}


getFriends();


//----------------------------------------------------- GROUP CHAT -------------------------------------------------------------\\
function showCreateGroupForm() {
    document.getElementById('createGroupForm').style.display = 'block';

    fetch('https://server-57ql.onrender.com/api/users/friends', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(friends => {
        const friendCheckboxList = document.getElementById('friendCheckboxList');
        friendCheckboxList.innerHTML = ''; 

        if (friends.length === 0) {
            friendCheckboxList.innerHTML = '<p>Không có bạn bè nào để thêm.</p>';
        } else {
            friends.forEach(friend => {
                const friendCheckbox = document.createElement('div');
                friendCheckbox.classList.add('friend-checkbox-item');
                friendCheckbox.innerHTML = `
                    <input type="checkbox" id="friend_${friend._id}" value="${friend._id}">
                    <label for="friend_${friend._id}">${friend.name}</label>
                `;
                friendCheckboxList.appendChild(friendCheckbox);
            });
        }
    })
    .catch(error => {
        console.error('Lỗi khi tải danh sách bạn bè:', error);
        document.getElementById('friendCheckboxList').innerHTML = '<p>Lỗi khi tải danh sách bạn bè.</p>';
    });
}

function hideCreateGroupForm() {
    document.getElementById('createGroupForm').style.display = 'none';
}

function createGroup() {
    const groupName = document.getElementById('groupNameInput').value.trim();
    const selectedFriendIds = Array.from(document.querySelectorAll('#friendCheckboxList input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);

    if (!groupName) {
        alert('Vui lòng nhập tên nhóm.');
        return;
    }

    if (selectedFriendIds.length < 2) {
        alert('Vui lòng chọn ít nhất hai bạn bè để thêm vào nhóm.');
        return;
    }

    const userId = localStorage.getItem('userId');

    const members = [...selectedFriendIds, userId];  

    fetch('https://server-57ql.onrender.com/api/groups/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            groupName: groupName, 
            members: members      
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Lỗi khi tạo nhóm.');
        }
        return response.json();
    })
    .then(group => {
        alert('Nhóm được tạo thành công!');
        hideCreateGroupForm();
        console.log('Creating group with data:', {
            groupName,
            members: members
        });
        loadGroupChats()
    })
    .catch(error => {
        console.error('Lỗi khi tạo nhóm:', error);
        alert('Không thể tạo nhóm. Vui lòng thử lại.');
    });
}

function loadGroupChats() {
    const userId = localStorage.getItem('userId');
    fetch(`https://server-57ql.onrender.com/api/groups/${userId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(groups => {
        const groupList = document.getElementById('groupList');
        
        if (!groupList) {
            console.error("Không tìm thấy phần tử #groupList trong DOM");
            return;  
        }

        groupList.innerHTML = ''; 

        if (groups.length === 0) {
            groupList.innerHTML = '<p>Không có nhóm nào.</p>';
        } else {
            groups.forEach(group => {
                const groupItem = document.createElement('div');
                groupItem.classList.add('group-item');
                groupItem.innerHTML = `
                    <div class="chatUser" onclick="openGroupChat('${group._id}', '${group.groupName}')">
                        <span>${group.groupName}</span>
                        <p>Side</p>
                    </div>
                `;
                groupList.appendChild(groupItem);
                console.log('groupName', group.groupName)
            });
        }
    })
    .catch(error => {
        console.error('Lỗi khi tải danh sách nhóm:', error);
        const groupList = document.getElementById('groupList');
        
        if (groupList) {
            groupList.innerHTML = '<p>Lỗi khi tải danh sách nhóm.</p>';
        }
    });
}

function openGroupChat(groupId, groupName) {
    document.getElementById('username').textContent = groupName;
    // document.getElementById('avatar') = defaultAvatar;
    currentFriendId = null; 

    const chatArea = document.getElementById('chatArea');
    chatArea.innerHTML = `
        <div style="display: flex; justify-content: center;">
            <div class="three-body">
                <div class="three-body__dot"></div>
                <div class="three-body__dot"></div>
                <div class="three-body__dot"></div>
            </div>
        </div>
    `;
    localStorage.setItem('groupId', groupId)
    fetch(`https://server-57ql.onrender.com/api/groups/${groupId}/messages`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Lỗi khi tải tin nhắn nhóm.');
        }
        return response.json();
    })
    .then(messages => {
        chatArea.innerHTML = '';
        if (messages.length === 0) {
            chatArea.innerHTML = '<p>Không có tin nhắn nào.</p>';
        } else {
            messages.forEach(message => {
                const messageDiv = document.createElement('div');
                messageDiv.classList.add('message', message.sender === localStorage.getItem('userId') ? 'sent' : 'received');
                messageDiv.innerHTML = `
                    <div class="messageContent">
                        <p>${message.content}</p>
                    </div>
                `;
                chatArea.appendChild(messageDiv);
            });
        }
    })
    .catch(error => {
        console.error('Lỗi khi tải tin nhắn nhóm:', error);
        chatArea.innerHTML = '<p>Lỗi khi tải tin nhắn nhóm.</p>';
    });
}

loadGroupChats();
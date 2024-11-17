const userInfoContainer = document.getElementById('userInfo');
const updateButton = document.getElementById('updateButton');
const updateForm = document.getElementById('updateForm');
const saveButton = document.getElementById('saveButton');
let currentUser = {};

const getUserInfo = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
        alert('Vui lòng đăng nhập trước khi truy cập thông tin.');
        window.location.href = 'index.html';
        return;
    }

    try {
        const res = await fetch('http://localhost:5000/api/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.ok) {
            currentUser = await res.json();
            displayUserInfo(currentUser);
        } else {
            const errorMsg = await res.json();
            alert(errorMsg.message || 'Không thể lấy thông tin người dùng.');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

const displayUserInfo = (user) => {

    localStorage.setItem('userId', user._id);
    const avatarUrl = user.avatar && user.avatar.data && typeof user.avatar.data === 'string'
        ? `data:${user.avatar.contentType};base64,${user.avatar.data}`
        : null;

    userInfoContainer.innerHTML = `
        <img id="userAvatar" src="${avatarUrl}" alt="Avatar" style="width: 100px; height: 100px; border-radius: 50%;">
        <p><strong>Tên:</strong> ${user.name || 'Chưa có thông tin'}</p>
        <p><strong>Ngày sinh:</strong> ${user.birthDate ? new Date(user.birthDate).toLocaleDateString('vi-VN') : 'Chưa có thông tin'}</p>
        <p><strong>Giới tính:</strong> ${user.gender || 'Chưa có thông tin'}</p>
    `;
};

updateButton.addEventListener('click', () => {
    updateForm.style.display = updateForm.style.display === 'none' ? 'block' : 'none';
    if (updateForm.style.display === 'block') {
        document.getElementById('name').value = currentUser.name || '';
        document.getElementById('birthDate').value = currentUser.birthDate ? new Date(currentUser.birthDate).toISOString().split('T')[0] : ''; 
        document.getElementById('gender').value = currentUser.gender === 'Nam' ? 'male' : currentUser.gender === 'Nữ' ? 'female' : 'other';
    }
});

const showStatusMessage = (message, isError = false) => {
    const statusMessage = document.createElement('div');
    statusMessage.className = isError ? 'error' : 'success';
    statusMessage.textContent = message;
    document.body.appendChild(statusMessage);

    setTimeout(() => {
        document.body.removeChild(statusMessage);
    }, 3000);
};

const validateInputs = (name, birthDate) => {
    if (!name || !birthDate) {
        showStatusMessage('Vui lòng điền đầy đủ thông tin.', true);
        return false;
    }
    return true;
};

saveButton.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    const name = document.getElementById('name').value || currentUser.name;
    const birthDate = document.getElementById('birthDate').value || currentUser.birthDate;

    if (!validateInputs(name, birthDate)) return; 

    let gender = document.getElementById('gender').value || currentUser.gender;
    gender = gender === 'male' ? 'Nam' : gender === 'female' ? 'Nữ' : 'Khác';

    const avatar = document.getElementById('avatar') ? document.getElementById('avatar').files[0] : null;
    const formData = new FormData();

    if (name !== currentUser.name) formData.append('name', name);
    if (birthDate !== currentUser.birthDate) formData.append('birthDate', birthDate);
    if (gender !== currentUser.gender) formData.append('gender', gender);
    if (avatar) formData.append('avatar', avatar);

    if (Array.from(formData.keys()).length === 0) {
        showStatusMessage('Không có thông tin nào để cập nhật.', true);
        return;
    }

    try {
        const res = await fetch('http://localhost:5000/api/users/update', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData,
        });

        if (res.ok) {
            const updatedUser = await res.json();
            currentUser = updatedUser;
            displayUserInfo(updatedUser);
            updateForm.style.display = 'none';
            showStatusMessage('Cập nhật thông tin thành công!');
        } else {
            const errorMsg = await res.json();
            showStatusMessage(errorMsg.message || 'Cập nhật thông tin không thành công.', true);
        }
    } catch (error) {
        console.error('Error:', error);
        showStatusMessage('Có lỗi xảy ra. Vui lòng thử lại.', true);
    }
});

getUserInfo();

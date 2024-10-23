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
    const avatarUrl = user.avatar ? `http://localhost:5000/${user.avatar.replace(/\\/g, '/')}` : 'default-avatar.png';
    userInfoContainer.innerHTML = `
        <img id="userAvatar" src="${avatarUrl}" alt="Avatar">
        <p><strong>Tên:</strong> ${user.name || 'Chưa có thông tin'}</p>
        <p><strong>Ngày sinh:</strong> ${user.birthDate ? new Date(user.birthDate).toLocaleDateString('vi-VN') : 'Chưa có thông tin'}</p>
        <p><strong>Giới tính:</strong> ${user.gender || 'Chưa có thông tin'}</p>
    `;
}

updateButton.addEventListener('click', () => {
    updateForm.style.display = updateForm.style.display === 'none' ? 'block' : 'none';
    if (updateForm.style.display === 'block') {
        document.getElementById('name').value = currentUser.name || '';
        document.getElementById('birthDate').value = currentUser.birthDate ? new Date(currentUser.birthDate).toISOString().split('T')[0] : ''; // Định dạng để hiển thị đúng trong input
        document.getElementById('gender').value = currentUser.gender === 'Nam' ? 'male' : currentUser.gender === 'Nữ' ? 'female' : 'other';
    }
});

saveButton.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    const name = document.getElementById('name').value || currentUser.name;
    const birthDate = document.getElementById('birthDate').value || currentUser.birthDate;
    let gender = document.getElementById('gender').value || currentUser.gender;

    // Chuyển đổi giới tính sang giá trị mà backend yêu cầu
    if (gender === 'male') {
        gender = 'Nam';
    } else if (gender === 'female') {
        gender = 'Nữ';
    } else if (gender === 'other') {
        gender = 'Khác';
    }

    const avatar = document.getElementById('avatar').files[0];

    const formData = new FormData();
    if (name !== currentUser.name) formData.append('name', name);
    if (birthDate !== currentUser.birthDate) formData.append('birthDate', birthDate);
    if (gender !== currentUser.gender) formData.append('gender', gender);
    if (avatar) formData.append('avatar', avatar);

    if (formData.has('name') || formData.has('birthDate') || formData.has('gender') || formData.has('avatar')) {
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
                alert('Cập nhật thông tin thành công!');
                location.reload();
            } else {
                const errorMsg = await res.json();
                alert(errorMsg.message || 'Cập nhật thông tin không thành công.');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    } else {
        alert('Không có thông tin nào để cập nhật.');
    }
});

getUserInfo();

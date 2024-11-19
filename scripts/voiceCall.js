let peerConnection;
const servers = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};
let localStream;
let remoteStream;


function startVoiceCall() {
    alert('Đang bắt đầu cuộc gọi thoại...');
    initializeCall('voice');
}


function startVideoCall() {
    alert('Đang bắt đầu cuộc gọi video...');
    initializeCall('video');
}


async function initializeCall(callType) {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === 'video' });

        const localAudio = new Audio();
        localAudio.srcObject = localStream;
        localAudio.play();

        peerConnection = new RTCPeerConnection(servers);

        
        peerConnection.addEventListener('icecandidate', (event) => {
            if (event.candidate) {
                socket.emit('candidate', event.candidate);
            }
        });

        peerConnection.addEventListener('track', (event) => {
            if (event.track.kind === 'audio') {
                remoteStream = event.streams[0];
                const remoteAudio = new Audio();
                remoteAudio.srcObject = remoteStream;
                remoteAudio.play();
            }
        });

        
        localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

        
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', offer);

        
        document.getElementById('callInProgress').style.display = 'block';

    } catch (err) {
        console.error('Lỗi khi khởi tạo cuộc gọi:', err);
    }
}


socket.on('offer', async (offer) => {
    
    document.getElementById('incomingCall').style.display = 'block';
});


function acceptCall() {
    document.getElementById('incomingCall').style.display = 'none';
    initializeCall('voice');
}


function declineCall() {
    document.getElementById('incomingCall').style.display = 'none';
    alert('Cuộc gọi đã bị từ chối');
}


socket.on('candidate', (candidate) => {
    peerConnection.addIceCandidate(candidate);
});


function endVoiceCall() {
    localStream.getTracks().forEach(track => track.stop());
    peerConnection.close();
    document.getElementById('callInProgress').style.display = 'none';
    alert('Cuộc gọi đã kết thúc.');
}

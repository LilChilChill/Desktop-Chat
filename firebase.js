import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBlR_5YiPsDtIdc8uRPWR5oFIg7jTRdqWo",
    authDomain: "chat-app-1670d.firebaseapp.com",
    projectId: "chat-app-1670d",
    storageBucket: "chat-app-1670d.appspot.com",
    messagingSenderId: "1070656965656",
    appId: "1:1070656965656:web:35a7e4cb62930bbbdc876d",
    measurementId: "G-LN4236KHXP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function signUp(name, email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            name: name,
            email: email,
            createdAt: new Date()
        });
        console.log('Đăng ký thành công:', userCredential.user);
    } catch (error) {
        console.error('Lỗi đăng ký:', error.message);
    }
}

// Xuất ra các chức năng
export { auth, db, signUp };

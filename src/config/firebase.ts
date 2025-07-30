// Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDUsEFOdlNO8muiTUx0Em65KY59Da_V_3A",
  authDomain: "bos-games-145f0.firebaseapp.com",
  projectId: "bos-games-145f0",
  storageBucket: "bos-games-145f0.firebasestorage.app",
  messagingSenderId: "303868662210",
  appId: "1:303868662210:web:8d737920e41afe8540065b",
  measurementId: "G-5NHMN87Z34",
};

// VAPID key for push notifications
// To get this key:
// 1. Go to Firebase Console -> Project Settings -> Cloud Messaging
// 2. Scroll to "Web configuration" section
// 3. Click "Generate key pair" under "Web Push certificates"
// 4. Copy the "Public key" (this is your VAPID key)
export const vapidKey =
  "BKIlF0YS9FZix8JOnhkmfXQ2v5uItzP1wI_tNcQ14fr6yt8MX3da-3n7RtXiL_wzAIpSwvwmnL8qoy27cqLmPac"; // Replace with your actual VAPID key from Firebase Console

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyDQGPUpcboLX1u1Tkl4WqYZS41uSFfyTQA",
  authDomain: "react-js--meet-clone-3f3d1.firebaseapp.com",
  projectId: "react-js--meet-clone-3f3d1",
  storageBucket: "react-js--meet-clone-3f3d1.appspot.com",
  messagingSenderId: "778048691101",
  appId: "1:778048691101:web:aa14918bdda48824d9ed74",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };

import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "./config";

const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async (onSuccess, onError) => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const { displayName: name, email, photoURL: file } = result.user;
    onSuccess({ name, email, file });
  } catch (error) {
    onError(error);
  }
};

export const logoutFromGoogle = async (onSuccess, onError) => {
  try {
    await signOut(auth);
    onSuccess();
  } catch (error) {
    onError(error);
  }
};

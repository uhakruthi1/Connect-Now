// Import the functions you need from the SDKs you need
import { initializeApp ,getApp,getApps} from "firebase/app";
import {getReactNativePersistence,initializeAuth} from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import AsyncStorage from "@react-native-async-storage/async-storage";
import {getFirestore,collection}from 'firebase/firestore';
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_MESSENGER_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_APP_ID
};

console.log("Firebase Config:", firebaseConfig);
const app = getApps().length===0?initializeApp(firebaseConfig):getApp();
export const auth=initializeAuth(app,{
    persistence:getReactNativePersistence(AsyncStorage)
})

export const db=getFirestore(app)

export const userRef=collection(db,'users');


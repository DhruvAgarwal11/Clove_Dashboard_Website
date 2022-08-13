import { initializeApp } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-app.js";
//import {getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword} from '/firebase/auth';
import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-database.js";
import { GoogleAuthProvider, getAuth,signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup
  } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-auth.js";


var loggedIn = false;
var firebaseConfig = {
    apiKey: "AIzaSyAU12lW7Axec4TF6aDChHuC7Nk-irx47bU",
    authDomain: "clove-4d6c4.firebaseapp.com",
    databaseURL: "https://clove-4d6c4-default-rtdb.firebaseio.com",
    projectId: "clove-4d6c4",
    storageBucket: "clove-4d6c4.appspot.com",
    messagingSenderId: "579159556398",
    appId: "ppocdkdojbecalnifjihpablekpmpcbb",
    measurementId: "G-6YHEH9NKSG"
  };

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const database = getDatabase();



var curUser = null;

export function getApp(){ return firebaseApp; }

const loginEmailPassword = async () => {
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  const result = await signInWithPopup(auth, provider);
  curUser = result.user;
  if (curUser != null){
    document.cookie = "email="+curUser.email;
      window.location.href = "index.html";
  }
}

if(document.getElementById("sign-in-button")){
  document.getElementById("sign-in-button").addEventListener("click", loginEmailPassword);
}
if(document.getElementById("sign-up-button")){
  document.getElementById("sign-up-button").addEventListener("click", loginEmailPassword);
}
// src/Login.js
import React from "react";
import { auth, database } from "./firebase-config"; // Asegúrate de que la ruta es correcta
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();

  const signInWithGoogle = () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;
        console.log("User signed in:", user);

        // Verificar si el usuario ya está registrado en Firebase Realtime Database
        const userRef = ref(database, `users/${user.uid}`);

        get(userRef)
          .then((snapshot) => {
            if (snapshot.exists()) {
              console.log("User already exists in database");
              navigate("/lends");
            } else {
              // Registrar el usuario en Firebase Realtime Database
              set(userRef, {
                email: user.email,
                displayName: user.displayName,
                uid: user.uid,
                // photoURL: user.photoURL,
              })
                .then(() => {
                  console.log("User registered in database");
                  navigate("/lends");
                })
                .catch((error) => {
                  console.error("Error registering user in database:", error);
                });
            }
          })
          .catch((error) => {
            console.error("Error checking user in database:", error);
          });
      })
      .catch((error) => {
        console.error("Error signing in:", error);
      });
  };

  return (
    <div>
      <h1>Login</h1>
      <button onClick={signInWithGoogle}>Sign in with Google</button>
    </div>
  );
};

export default Login;

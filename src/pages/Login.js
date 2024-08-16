// src/Login.js
import React, { useContext, useEffect } from "react";
import { auth, database } from "../firebase-config"; // Asegúrate de que la ruta es correcta
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../UserContext";
import "../styles/login.css";
import { Button, Card } from "antd";
import Title from "antd/es/typography/Title";
import { GoogleOutlined } from "@ant-design/icons";

const Login = () => {
  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();
  const { user, setUser } = useContext(UserContext);

  useEffect(() => {
    if (user?.uid) {
      navigate("/lends");
    }
  }, [user, navigate]);

  const signInWithGoogle = () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;
        console.log("User signed in:", user);

        // Verificar si el usuario ya está registrado en Firebase Realtime Database
        const userRef = ref(database, `users/${user.uid}`);

        get(userRef)
          .then((snapshot) => {
            const userPropsInRealtimeDB = snapshot.val();
            if (snapshot.exists()) {
              console.log("User already exists in database");
              setUser({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                company: userPropsInRealtimeDB?.company,
                numberOfColumns: userPropsInRealtimeDB?.numberOfColumns,
              });
            } else {
              // Registrar el usuario en Firebase Realtime Database
              set(userRef, {
                email: user.email,
                displayName: user.displayName,
                uid: user.uid,
                company: "null",
                numberOfColumns: 2,
              })
                .then(() => {
                  console.log("User registered in database");
                  setUser({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    company: userPropsInRealtimeDB?.company,
                    numberOfColumns: userPropsInRealtimeDB?.numberOfColumns,
                  });
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
    <div className="login-container">
      <Card className="login-card">
        <Title level={1}>L E N D S</Title>
        <Button
          type="primary"
          icon={<GoogleOutlined />}
          onClick={signInWithGoogle}
          size="large"
        >
          Iniciar sesión en Google
        </Button>
      </Card>
    </div>
  );
};

export default Login;

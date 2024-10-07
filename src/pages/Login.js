// src/Login.js
import React, { useContext, useEffect } from "react";
import { auth, database } from "../firebase-config"; // Asegúrate de que la ruta es correcta
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../UserContext";
import "../styles/login.css";
import { Button, Card, message } from "antd";
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
                  setUser({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    company: userPropsInRealtimeDB?.company,
                    numberOfColumns: userPropsInRealtimeDB?.numberOfColumns,
                  });
                })
                .catch((error) => {
                  message.error({
                    content: "Error registrando usuario en database",
                    duration: 4,
                    style: {
                      position: "fixed",
                      top: 10,
                      right: 10,
                      zIndex: 1000, // Asegúrate de que el mensaje esté por encima de otros elementos
                      padding: "10px",
                      borderRadius: 4,
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                    },
                  });
                });
            }
          })
          .catch((error) => {
            message.error({
              content: `Error buscando usuario en database: ${error.message}`,
              duration: 4,
              style: {
                position: "fixed",
                top: 10,
                right: 10,
                zIndex: 1000, // Asegúrate de que el mensaje esté por encima de otros elementos
                padding: "10px",
                borderRadius: 4,
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
              },
            });
          });
      })
      .catch((error) => {
        message.error({
          content: "Error en el inicio de sesión",
          duration: 4,
          style: {
            position: "fixed",
            top: 10,
            right: 10,
            zIndex: 1000, // Asegúrate de que el mensaje esté por encima de otros elementos
            padding: "10px",
            borderRadius: 4,
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
          },
        });
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

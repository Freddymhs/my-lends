import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Home from "./pages/Home";
import { UserProvider } from "./UserContext";

function App() {
  return (
    <UserProvider>
      <div className="App">
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/lends" element={<Home />} />
          </Routes>
        </Router>
      </div>
    </UserProvider>
  );
}

export default App;

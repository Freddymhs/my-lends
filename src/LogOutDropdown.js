import { Dropdown, Button, Menu } from "antd";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { useNavigate } from "react-router";
import { auth } from "./firebase-config";
import { LogoutOutlined } from "@ant-design/icons";

const menuItems = [
  {
    key: "1",
    label: "Salir",
  },
];

const LogoutDropdown = () => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate(); // Use navigate for routing

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User signed out successfully");
      navigate("/"); // Redirect to home page after logout
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleMenuClick = (event) => {
    if (event.key === "1") {
      handleLogout();
    }
  };

  const handleDropdownVisibleChange = (flag) => {
    setVisible(flag);
  };

  return (
    <Dropdown
      overlay={<Menu items={menuItems} onClick={handleMenuClick} />}
      visible={visible}
      onVisibleChange={handleDropdownVisibleChange}
    >
      <Button type="primary" onClick={() => setVisible(true)}>
        <LogoutOutlined />
      </Button>
    </Dropdown>
  );
};
export default LogoutDropdown;

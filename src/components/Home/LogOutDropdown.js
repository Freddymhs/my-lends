import { Dropdown, Button, Menu } from "antd";
import { signOut } from "firebase/auth";
import { useCallback, useContext } from "react";
import { useNavigate } from "react-router";
import { auth } from "../../firebase-config";
import { LogoutOutlined } from "@ant-design/icons";
import { UserContext } from "../../UserContext";

const menuItems = [
  {
    key: "1",
    label: "Salir",
  },
];

const LogoutDropdown = () => {
  const navigate = useNavigate();
  const { _, setUser } = useContext(UserContext);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      console.log("User signed out successfully");
      setUser(null);
      navigate("/"); // Redirect to home page after logout
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, [navigate]);

  const handleMenuClick = useCallback(
    (event) => {
      if (event.key === "1") {
        handleLogout();
      }
    },
    [handleLogout]
  );

  return (
    <Dropdown
      overlay={<Menu items={menuItems} onClick={handleMenuClick} />}
      trigger={["click"]}
    >
      <Button size="large" type="primary" icon={<LogoutOutlined />} />
    </Dropdown>
  );
};

export default LogoutDropdown;

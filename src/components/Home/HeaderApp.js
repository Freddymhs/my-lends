import { Tabs, Button, Col, Row, Spin, Divider, Card } from "antd";
import { ColumnWidthOutlined } from "@ant-design/icons";
import { Header } from "antd/es/layout/layout";
import { changeNumberOfColumnsInDatabase } from "../../helpers";
import LogoutDropdown from "../Home/LogOutDropdown";
import { UserContext } from "../../UserContext";
import { useContext } from "react";
import { isMobile } from "react-device-detect";

const HeaderApp = () => {
  const { user } = useContext(UserContext);
  const { numberOfColumns } = user || {};
  return (
    <>
      <Header style={{ background: "#fff", padding: 0 }}>
        <Row
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-evenly",
          }}
        >
          <Col
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <LogoutDropdown />
            {isMobile && (
              <Button
                size="large"
                type="primary"
                icon={<ColumnWidthOutlined />}
                onClick={() =>
                  changeNumberOfColumnsInDatabase(numberOfColumns, user)
                }
              />
            )}
          </Col>

          <Divider type="vertical" />

          <Col
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end", // Alinear el título a la derecha
            }}
          >
            <h1>Mis Préstamos</h1>
          </Col>
        </Row>
      </Header>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "55px",
        }}
      >
        <Divider
          style={{
            marginTop: 0,
            marginBottom: 0,
          }}
        />
      </div>
    </>
  );
};

export default HeaderApp;

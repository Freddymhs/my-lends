import { Tabs, Button, Col, Row, Spin, Divider } from "antd";
import { Header } from "antd/es/layout/layout";
import LogoutDropdown from "../Home/LogOutDropdown";

const HeaderApp = () => {
  return (
    <>
      <Header style={{ background: "#fff", padding: 0 }}>
        <Row justify="space-around" align="middle">
          <Col>
            <LogoutDropdown />
          </Col>
          <Divider type="vertical" />
          <Col>
            <h1>Mis Prestamos</h1>
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

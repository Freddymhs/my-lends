import React, { useEffect, useState } from "react";
import { Tabs, List, Card, Descriptions, Button, Col, Row, Spin } from "antd";
import {
  SwipeableList,
  TrailingActions,
  SwipeableListItem,
  SwipeAction,
} from "react-swipeable-list";
import "react-swipeable-list/dist/styles.css";
import { PlusOutlined } from "@ant-design/icons";
import "./FloatingButton.css";
import { auth } from "./firebase-config";
import {
  addNewItemToDatabase,
  getDataFromFirebase,
  getUsersInFirebase,
  deleteItemFromDatabase,
} from "./helpers";
import AddLoanModal from "./AddLoanModal";
import LogoutDropdown from "./LogOutDropdown";

const { TabPane } = Tabs;

const Home = () => {
  const [users, setUsers] = useState([]);
  const [visible, setVisible] = useState(false);
  const [returnData, setReturnData] = useState([]);
  const [belongsData, setBelongsData] = useState([]);
  const [loading, setLoading] = useState(true);

  const { currentUser } = auth || {};
  const { uid } = currentUser || {};

  useEffect(() => {
    let unsubscribeLeads = () => {};
    let unsubscribeUsers = () => {};

    const loadData = async () => {
      if (uid) {
        setLoading(true);
        unsubscribeLeads = getDataFromFirebase((lends) => {
          const myLends = lends.filter((item) => item.from === uid);
          const mybelongs = lends.filter((item) => item.to === uid);
          setReturnData(myLends);
          setBelongsData(mybelongs);
          setLoading(false);
        });

        unsubscribeUsers = getUsersInFirebase((data) => {
          setUsers(data);
        });
      } else {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      unsubscribeLeads();
      unsubscribeUsers();
    };
  }, [uid]);

  const onCreate = (data) => {
    addNewItemToDatabase(data);
  };

  const trailingActions = (data) => (
    <TrailingActions>
      <SwipeAction
        destructive={true}
        onClick={() => deleteItemFromDatabase(data)}
      >
        <div style={{ backgroundColor: "blue", color: "white", padding: 10 }}>
          Borrar elemento
        </div>
      </SwipeAction>
    </TrailingActions>
  );

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Row>
        <Col span={12}>
          <h1>Mis Prestamos</h1>
        </Col>
        <Col span={12}>
          <LogoutDropdown />
        </Col>
      </Row>

      <Tabs centered defaultActiveKey="1">
        <TabPane tab="Me Deben" key="1">
          <LoanList
            data={returnData}
            users={users}
            trailingActions={trailingActions}
            formatUser={formateUidToMail}
          />
        </TabPane>
        <TabPane tab="Pedi Prestado" key="2">
          <LoanList
            data={belongsData}
            users={users}
            trailingActions={trailingActions}
            formatUser={formateUidFromMail}
          />
        </TabPane>
      </Tabs>

      <div className="floating-button-container">
        <Button
          type="primary"
          shape="circle"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setVisible(!visible)}
        />
      </div>

      <AddLoanModal
        visible={visible}
        setVisible={setVisible}
        users={users}
        onCreate={onCreate}
      />
    </div>
  );
};

const LoanList = ({ data, users, trailingActions, formatUser }) => (
  <List
    grid={{ gutter: 16, column: 2 }}
    dataSource={data}
    renderItem={(item) => (
      <List.Item>
        <SwipeableList>
          <SwipeableListItem trailingActions={trailingActions(item)}>
            <Card title={item.name}>
              <Descriptions column={1}>
                <Descriptions.Item label="Cantidad de préstamo">
                  {item.quantity}
                </Descriptions.Item>
                <Descriptions.Item
                  label={formatUser === formateUidToMail ? "para:" : "dueño/a"}
                >
                  {formatUser(item, users)}
                </Descriptions.Item>
                <Descriptions.Item label="Fecha de préstamo">
                  {item.date}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </SwipeableListItem>
        </SwipeableList>
      </List.Item>
    )}
  />
);

const formateUidToMail = (item, users) =>
  users.find(({ uid }) => uid === item.to)?.email || "Email no encontrado";
const formateUidFromMail = (item, users) =>
  users.find(({ uid }) => uid === item.from)?.email || "Email no encontrado";

export default Home;

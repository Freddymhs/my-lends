import React, { useContext, useEffect, useState } from "react";
import { Tabs, List, Card, Descriptions, Button, Col, Row, Spin } from "antd";
import { isMobile } from "react-device-detect";
import {
  SwipeableList,
  TrailingActions,
  SwipeableListItem,
  SwipeAction,
} from "react-swipeable-list";
import "react-swipeable-list/dist/styles.css";
import { PlusOutlined } from "@ant-design/icons";
import "./FloatingButton.css";
import {
  addNewItemToDatabase,
  getDataFromFirebase,
  getUsersInFirebase,
  deleteItemFromDatabase,
} from "./helpers";
import AddLoanModal from "./AddLoanModal";
import LogoutDropdown from "./LogOutDropdown";
import { Header } from "antd/es/layout/layout";
import { UserContext } from "./UserContext";
import DateRangeFilter from "./DateRangeFilter";

const { TabPane } = Tabs;

const Home = () => {
  const [users, setUsers] = useState([]);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, _ } = useContext(UserContext);
  const { company } = user || {};
  const { uid } = user || {};
  const [returnData, setReturnData] = useState([]);
  const [belongsData, setBelongsData] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);

  useEffect(() => {
    let unsubscribeLeads = () => {};
    let unsubscribeUsers = () => {};

    const loadData = async () => {
      if (uid) {
        setLoading(true);
        unsubscribeLeads = getDataFromFirebase(
          (lends) => {
            const myLends = lends.filter(
              (item) => item.fromCompany === company
            );
            const mybelongs = lends.filter(
              (item) => item.toCompany === company
            );

            setReturnData(myLends);
            setBelongsData(mybelongs);
            setLoading(false);
          },
          startDate,
          endDate
        );

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
  }, [uid, startDate, endDate]);
  const handleFilter = (newStartDate, newEndDate) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const onCreate = (data) => {
    addNewItemToDatabase(data);
  };
  const trailingActions = (item) => (
    <TrailingActions>
      <SwipeAction
        destructive={true}
        onClick={() => deleteItemFromDatabase(item)}
      >
        <div
          style={{
            backgroundColor: "red",
            color: "white",
            padding: 10,
            fontSize: 18,
          }}
        >
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
      <Header style={{ background: "#fff", padding: 0 }}>
        <Row justify="space-around" align="middle">
          <Col>
            <LogoutDropdown />
          </Col>
          <Col>
            <h1>Mis Prestamos</h1>
          </Col>
        </Row>
      </Header>
      <br />
      <br />
      <DateRangeFilter
        onFilter={handleFilter}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />
      <Tabs centered defaultActiveKey="1">
        <TabPane tab="Prestamos" key="1">
          <LoanList
            data={returnData}
            users={users}
            trailingActions={trailingActions}
            formatUser={formateUidToMail}
            blockSwipe={false}
          />
        </TabPane>
        <TabPane tab="Deudas" key="2">
          <LoanList
            data={belongsData}
            users={users}
            trailingActions={trailingActions}
            formatUser={formateUidFromMail}
            blockSwipe={true}
          />
        </TabPane>
      </Tabs>

      <div
        className={
          isMobile
            ? "floating-button-container-mobile"
            : "floating-button-container"
        }
      >
        <Button
          className={isMobile ? "floating-button-mobile" : "floating-button"}
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setVisible(!visible)}
        />
      </div>

      <AddLoanModal
        visible={visible}
        setVisible={setVisible}
        users={users}
        onCreate={onCreate}
        actualCompanyIs={company}
      />
    </div>
  );
};

const LoanList = ({ data, users, trailingActions, formatUser, blockSwipe }) => (
  <List
    grid={{ gutter: 16, column: isMobile ? 2 : 4 }}
    dataSource={data}
    renderItem={(item) => (
      <List.Item>
        <SwipeableList fullSwipe={true}>
          <SwipeableListItem
            key={item.id}
            blockSwipe={blockSwipe}
            trailingActions={trailingActions(item)}
            type="ommer"
          >
            <Card
              bordered={true}
              hoverable={true}
              actions={[
                <span
                  style={{
                    color: "#1890ff",
                    display: "flex",
                    justifyContent: "space-around",
                  }}
                >
                  <p>{item.toCompany}</p>
                </span>,
                <span
                  style={{
                    color: "#1890ff",
                    display: "flex",
                    justifyContent: "space-around",
                  }}
                >
                  <p>Cantidad:({item.quantity})</p>
                </span>,
              ]}
              title={
                <span
                  style={{ wordWrap: "break-word", whiteSpace: "pre-wrap" }}
                >
                  {item.name}
                </span>
              }
            >
              <Descriptions
                size="small"
                column={isMobile ? 2 : 3}
                layout="vertical"
                style={{ textAlign: "left" }}
              >
                <Descriptions.Item
                  label={formatUser === formateUidToMail ? "para" : "dueño/a"}
                >
                  {formatUser(item, users)}
                </Descriptions.Item>

                <Descriptions.Item label="Fecha de préstamo">
                  {item.date}
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    formatUser === formateUidToMail ? "Anotado por" : "dueño/a"
                  }
                >
                  {formateUidFromMail(item, users)}
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
  users.find(({ uid }) => uid === item.to)?.displayName ||
  "Email no encontrado";
const formateUidFromMail = (item, users) =>
  users.find(({ uid }) => uid === item.from)?.displayName ||
  "Email no encontrado";

export default Home;

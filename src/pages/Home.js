import React, { useContext, useEffect, useState } from "react";
import IsLoadingScreen from "../components/IsLoadingScreen";
import { Tabs, Button } from "antd";
import { isMobile } from "react-device-detect";
import { TrailingActions, SwipeAction } from "react-swipeable-list";
import "react-swipeable-list/dist/styles.css";
import { PlusOutlined } from "@ant-design/icons";
import "../styles/FloatingButton.css";
import {
  addNewItemToDatabase,
  getDataFromFirebase,
  getUsersInFirebase,
  deleteItemFromDatabase,
} from "../helpers";
import AddLoanModal from "../components/Home/AddLoanModal";
import { UserContext } from "../UserContext";
import DateRangeFilter from "../components/DateRangeFilter";
import { Modal, Alert } from "antd";
import { formateUidToMail, formateUidFromMail } from "../helpers/index";
import LendsList from "../components/Home/LendsList";
import HeaderApp from "../components/Home/HeaderApp";
import NoCompanyAlert from "../components/Home/NoCompanyAlert";

const { TabPane } = Tabs;

const Home = () => {
  const [users, setUsers] = useState([]);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, setUser } = useContext(UserContext);
  const { company } = user || {};
  const { uid } = user || {};
  const [returnData, setReturnData] = useState([]);
  const [belongsData, setBelongsData] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);

  const openDeleteConfirmation = (item) => {
    Modal.confirm({
      title: "¿Estás seguro de que deseas eliminar este elemento?",
      content: "Esta acción es irreversible.",
      okText: "Eliminar",
      cancelText: "Cancelar",
      okType: "danger",
      centered: true,
      onOk() {
        deleteItemFromDatabase(item);
      },
      onCancel() {},
    });
  };

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
          const userDataFromUserLogged = data.filter(
            ({ uid }) => uid === user.uid
          )[0];

          // list users in database
          setUsers(data);
          // context user in memory
          setUser({
            ...user,
            ...userDataFromUserLogged,
          });
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
  }, [uid, startDate, endDate, company]);
  const handleFilter = (newStartDate, newEndDate) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const trailingActions = (item) => (
    <TrailingActions>
      <SwipeAction
        destructive={false}
        onClick={() => openDeleteConfirmation(item)}
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

  return (
    <>
      <IsLoadingScreen loading={loading} />
      <HeaderApp />
      {/*  */}
      <DateRangeFilter
        onFilter={handleFilter}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />
      {/*  */}
      <NoCompanyAlert company={company} />
      {/*  */}
      <Tabs centered defaultActiveKey="1">
        <TabPane tab="Prestamos" key="1">
          <LendsList
            data={returnData}
            users={users}
            trailingActions={trailingActions}
            formatUser={formateUidToMail}
            blockSwipe={false}
          />
        </TabPane>
        <TabPane tab="Deudas" key="2">
          <LendsList
            data={belongsData}
            users={users}
            trailingActions={trailingActions}
            formatUser={formateUidFromMail}
            blockSwipe={true}
          />
        </TabPane>
      </Tabs>
      {/*  */}
      <AddLoanModal
        company={company}
        users={users}
        visible={visible}
        setVisible={setVisible}
        actualCompanyIs={company}
        onCreate={addNewItemToDatabase}
      />
    </>
  );
};

export default Home;

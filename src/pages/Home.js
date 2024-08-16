import React, { useContext, useEffect, useState } from "react";
import IsLoadingScreen from "../components/IsLoadingScreen";
import { Tabs, Input } from "antd";
import { isMobile } from "react-device-detect";
import { message } from "antd";
import {
  TrailingActions,
  SwipeAction,
  LeadingActions,
} from "react-swipeable-list";
import "react-swipeable-list/dist/styles.css";
import { PlusOutlined } from "@ant-design/icons";
import "../styles/FloatingButton.css";
import {
  addNewItemToDatabase,
  getDataFromFirebase,
  getUsersInFirebase,
  deleteItemFromDatabase,
  changeStateOfItemInDatabase,
} from "../helpers";
import AddLoanModal from "../components/Home/AddLoanModal";
import { UserContext } from "../UserContext";
import DateRangeFilter from "../components/DateRangeFilter";
import { Modal, Alert } from "antd";
import { findToUserName, findFromUserName } from "../helpers/index";
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
  const { displayName } = user || {};
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

  const openChangeStateConfirmation = (item, uid) => {
    let comment = "";
    Modal.confirm({
      title: "Confirmar cambio de estado",
      content: (
        <>
          {!item.returned &&
            `Este cambio lo marcará como regresado por ${displayName} y puedes agregar un comentario`}
          {item.returned &&
            `Este cambio lo desmarcará como regresado por ${displayName} y puedes agregar un comentario`}
          <p
            style={{
              color: "#ff7043",
              fontSize: "18px",
            }}
          >
            Historial de cambios:
          </p>
          {item.comment?.split("\n").map((line, index) => (
            <p
              style={{
                margin: "0px",
                marginBottom: "7px",
                wordBreak: "break-word",
                lineHeight: "1.2",
                textAlign: "left",
              }}
              key={index}
            >
              {line}
            </p>
          ))}
          <Input.TextArea
            maxLength={100}
            placeholder="Añadir un comentario (opcional)"
            onChange={(e) => {
              if (e.target.value.length >= 100) {
                message.error(
                  "El comentario no puede superar los 100 caracteres"
                );
                return;
              }
              comment = e.target.value;
            }}
            rows={3}
          />
        </>
      ),
      okText: "Confirmar",
      cancelText: "Cancelar",
      okType: "primary",
      centered: true,
      onOk() {
        console.log("El estado del item ha sido cambiado por", uid);
        changeStateOfItemInDatabase(
          item,
          { uid, displayName, comment },
          "returned"
        );
      },
      onCancel() {
        console.log("Operación cancelada.");
      },
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
            // padding: 10,
            fontSize: 18,
          }}
        >
          Borrar elemento
        </div>
      </SwipeAction>
    </TrailingActions>
  );
  const leadingActions = (item) => (
    <LeadingActions>
      <SwipeAction
        destructive={false}
        onClick={() => openChangeStateConfirmation(item, uid)}
      >
        <div
          style={{
            backgroundColor: "#ff7043",
            color: "white",
            // padding: 10,
            fontSize: 18,
          }}
        >
          Marcar como regresado
        </div>
      </SwipeAction>
    </LeadingActions>
  );
  if (loading) {
    return <IsLoadingScreen loading={loading} />;
  }
  return (
    <>
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
            allUsersInFirebase={users}
            trailingActions={trailingActions}
            leadingActions={leadingActions}
            formatUser={findToUserName}
            showLeadingActions={false}
          />
        </TabPane>
        <TabPane tab="Deudas" key="2">
          <LendsList
            data={belongsData}
            allUsersInFirebase={users}
            trailingActions={trailingActions}
            leadingActions={leadingActions}
            formatUser={findFromUserName}
            showTrailingActions={false}
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

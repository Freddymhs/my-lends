import React, { useContext, useEffect, useState } from "react";
import IsLoadingScreen from "../components/IsLoadingScreen";
import { Tabs, Input } from "antd";
import { isMobile } from "react-device-detect";
import { signOut } from "firebase/auth";
import { auth } from "../firebase-config";
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
import Filters from "../Filters";
import { Modal, Alert } from "antd";
import { findToUserName, findFromUserName } from "../helpers/index";
import LendsList from "../components/Home/LendsList";
import HeaderApp from "../components/Home/HeaderApp";
import NoCompanyAlert from "../components/Home/NoCompanyAlert";
import { useNavigate } from "react-router-dom";

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
  const [filterType, setFilterType] = useState({
    notReturned: true,
    returned: true,
    wasReturned: true,
    deleted: false,
  });
  const navigate = useNavigate();

  const openDeleteConfirmation = (item) => {
    Modal.confirm({
      title: "¿Estás seguro de que deseas eliminar este elemento?",
      content: "Esta acción es irreversible.",
      okText: "Eliminar",
      cancelText: "Cancelar",
      okType: "danger",
      centered: true,
      onOk() {
        // deleteItemFromDatabase(item);
        changeStateOfItemInDatabase(
          item,
          { uid, displayName, comment: "deleted" },
          "deleted"
        );
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
    if (!user?.company || user.company === "null" || user.company === "") {
      const getOut = () => {
        try {
          setTimeout(async () => {
            setUser(null);
            setUsers([]);
            setReturnData([]);
            setBelongsData([]);
            setLoading(false);
            await signOut(auth);
            console.log("User signed out successfully");
            navigate("/");
          }, 4000);
        } catch (error) {
          console.error("Error signing out:", error);
        }
      };
      getOut();
      return;
    }
  }, [user]);

  useEffect(() => {
    let unsubscribeLeads = () => {};
    let unsubscribeUsers = () => {};

    const loadData = async () => {
      if (uid) {
        setLoading(true);
        try {
          unsubscribeUsers = getUsersInFirebase(
            (data) => {
              const userDataFromUserLogged = data.filter(
                ({ uid }) => uid === user.uid
              )[0];

              // Actualizar la lista de usuarios y el usuario en memoria
              setUsers(data);
              setUser({
                ...user,
                ...userDataFromUserLogged,
              });
            },
            (errorMessage) => {
              setUsers([]);
              setUser({});
              message.error({
                content: errorMessage.message,
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
            }
          );

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
            (errorMessage) => {
              setReturnData([]);
              setBelongsData([]);
              setLoading(false);
              message.error({
                content: errorMessage.message,
                duration: 6,
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
            },
            startDate,
            endDate,
            filterType
          );
        } catch (error) {
          console.log(error);
        }

        // si existe error manejarlo
      } else {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      unsubscribeLeads();
      unsubscribeUsers();
    };
  }, [uid, startDate, endDate, company, filterType]);
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
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 8,
        }}
      >
        {" "}
        <Filters setFilterType={setFilterType} filterType={filterType} />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 8,
        }}
      >
        <DateRangeFilter
          onFilter={handleFilter}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
      </div>

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

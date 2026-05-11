import React, { useContext, useEffect, useRef, useState } from "react";
import IsLoadingScreen from "../components/IsLoadingScreen";
import { Tabs, Input, Modal, message } from "antd";
import { isMobile } from "react-device-detect";
import { signOut } from "firebase/auth";
import { auth } from "../firebase-config";
import {
  TrailingActions,
  SwipeAction,
  LeadingActions,
} from "react-swipeable-list";
import "react-swipeable-list/dist/styles.css";
import "../styles/FloatingButton.css";
import {
  addNewItemToDatabase,
  changeStateOfItemInDatabase,
} from "../helpers";
import AddLoanModal from "../components/Home/AddLoanModal";
import { UserContext } from "../UserContext";
import DateRangeFilter from "../components/DateRangeFilter";
import Filters from "../Filters";
import { findToUserName, findFromUserName } from "../helpers/index";
import LendsList from "../components/Home/LendsList";
import HeaderApp from "../components/Home/HeaderApp";
import NoCompanyAlert from "../components/Home/NoCompanyAlert";
import { useNavigate } from "react-router-dom";
import useUsers from "../hooks/useUsers";
import useLends from "../hooks/useLends";

const EXPULSION_DELAY_MS = 4000;

const Home = () => {
  const { user, setUser } = useContext(UserContext);
  const { uid, company, displayName } = user || {};

  const [open, setOpen] = useState(false);
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
  const commentRef = useRef("");

  const { users } = useUsers(uid);
  const { returnData, belongsData, loading } = useLends(
    uid,
    company,
    startDate,
    endDate,
    filterType
  );

  // Expulsa al usuario sin company tras un delay (UX, no security boundary).
  useEffect(() => {
    const isMissingCompany =
      !company || company === "null" || company === "";
    if (!uid || !isMissingCompany) return undefined;

    const timeoutId = setTimeout(async () => {
      setUser(null);
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Error signing out:", error);
      }
      navigate("/");
    }, EXPULSION_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [uid, company, navigate, setUser]);

  const openDeleteConfirmation = (item) => {
    Modal.confirm({
      title: "¿Estás seguro de que deseas eliminar este elemento?",
      content: "Esta acción es irreversible.",
      okText: "Eliminar",
      cancelText: "Cancelar",
      okType: "danger",
      centered: true,
      onOk() {
        changeStateOfItemInDatabase(
          item,
          { uid, displayName, comment: "deleted" },
          "deleted"
        );
      },
      onCancel() {},
    });
  };

  const openChangeStateConfirmation = (item) => {
    commentRef.current = "";
    Modal.confirm({
      title: "Confirmar cambio de estado",
      content: (
        <>
          {!item.returned &&
            `Este cambio lo marcará como regresado por ${displayName} y puedes agregar un comentario`}
          {item.returned &&
            `Este cambio lo desmarcará como regresado por ${displayName} y puedes agregar un comentario`}
          <p style={{ color: "#ff7043", fontSize: "18px" }}>
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
              commentRef.current = e.target.value;
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
        changeStateOfItemInDatabase(
          item,
          { uid, displayName, comment: commentRef.current },
          "returned"
        );
      },
      onCancel() {},
    });
  };

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
        <div style={{ backgroundColor: "red", color: "white", fontSize: 18 }}>
          Borrar elemento
        </div>
      </SwipeAction>
    </TrailingActions>
  );

  const leadingActions = (item) => (
    <LeadingActions>
      <SwipeAction
        destructive={false}
        onClick={() => openChangeStateConfirmation(item)}
      >
        <div
          style={{ backgroundColor: "#ff7043", color: "white", fontSize: 18 }}
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
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 8,
        }}
      >
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
      <NoCompanyAlert company={company} />
      <Tabs
        centered
        defaultActiveKey="1"
        items={[
          {
            key: "1",
            label: "Prestamos",
            children: (
              <LendsList
                data={returnData}
                allUsersInFirebase={users}
                trailingActions={trailingActions}
                leadingActions={leadingActions}
                formatUser={findToUserName}
                showLeadingActions={false}
              />
            ),
          },
          {
            key: "2",
            label: "Deudas",
            children: (
              <LendsList
                data={belongsData}
                allUsersInFirebase={users}
                trailingActions={trailingActions}
                leadingActions={leadingActions}
                formatUser={findFromUserName}
                showTrailingActions={false}
              />
            ),
          },
        ]}
      />
      <AddLoanModal
        company={company}
        users={users}
        open={open}
        setOpen={setOpen}
        actualCompanyIs={company}
        onCreate={addNewItemToDatabase}
      />
    </>
  );
};

export default Home;

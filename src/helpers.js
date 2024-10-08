import {
  onValue,
  push,
  ref,
  remove,
  set,
  query,
  update,
} from "firebase/database";
import moment from "moment";
import { database } from "./firebase-config";
import { message } from "antd";

const LEADS_REF = "/lends";
const USERS_REF = "/users";

const convertToArray = (obj) =>
  obj ? Object.entries(obj).map(([id, value]) => ({ id, ...value })) : [];

const handleDatabaseError = (operation) => (error) => {
  console.error(`Error en operación ${operation}:`, error);
  throw error;
};

export const addNewItemToDatabase = async (newItem) => {
  const leadsRef = ref(database, LEADS_REF);
  const itemToAdd = {
    ...newItem,
    date: newItem.date.format("DD-MM-YYYY HH:mm:ss"),
  };

  try {
    await push(leadsRef, itemToAdd);
    message.success({
      content: "El elemento ha sido añadido exitosamente.",
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
  } catch (error) {
    handleDatabaseError("addNewItemToDatabase")(error);
  }
};

export const getDataFromFirebase = (
  callback,
  onError,
  startDate,
  endDate,
  filterType
) => {
  const leadsQuery = query(ref(database, LEADS_REF));

  if (typeof callback !== "function") {
    console.error("getDataFromFirebase: callback debe ser una función");
    return () => {}; // Retorna una función vacía si no hay callback
  }

  const unsubscribe = onValue(
    leadsQuery,
    (snapshot) => {
      const data = snapshot.val();
      let lends = data
        ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
        : [];

      // Aplicar filtro de fechas si se proporcionan startDate y endDate
      if (startDate && endDate) {
        lends = lends.filter((item) => {
          const itemDate = moment(item.date, "DD-MM-YYYY HH:mm:ss").toDate();
          return itemDate >= startDate && itemDate <= endDate;
        });
      }

      if (
        filterType.notReturned ||
        filterType.returned ||
        filterType.deleted ||
        filterType.wasReturned
      ) {
        const selectedNotReturned = filterType.notReturned;
        const selectedReturned = filterType.returned;
        const selectedDeleted = filterType.deleted;
        const selectedWasReturned = filterType.wasReturned;

        lends = lends.filter((item) => {
          const hasNotReturned =
            "returnedBy" in item && item.returned === false;
          const hasReturned = "returnedBy" in item && item.returned === true;
          const hasWasReturned =
            "returnedBy" in item && item.returned === false;
          const hasDeleted =
            "deleted" in item && item.deleted === true && item.deletedBy;

          return (
            (selectedNotReturned &&
              !hasNotReturned &&
              !hasReturned &&
              !hasWasReturned &&
              !hasDeleted) ||
            (selectedReturned && !hasDeleted && hasReturned) ||
            (selectedWasReturned && !hasDeleted && hasWasReturned) ||
            (selectedDeleted && hasDeleted)
          );
        });
      }

      //  order by date descending
      // lends.sort((a, b) => b.date.localeCompare(a.date));
      lends.reverse();

      callback(lends);
    },
    (error) => {
      onError(error);
    }
  );

  return unsubscribe;
};

export const getUsersInFirebase = (callback, onError) => {
  const usersRef = ref(database, USERS_REF);

  return onValue(
    usersRef,
    (snapshot) => {
      const users = convertToArray(snapshot.val());
      callback(users);
    },
    (error) => {
      onError(error);
    }
  );
};

export const uploadDataToFirebase = async (data) => {
  const leadsRef = ref(database, LEADS_REF);

  try {
    await set(leadsRef, data);
  } catch (error) {
    handleDatabaseError("uploadDataToFirebase")(error);
  }
};

export const deleteItemFromDatabase = async (item) => {
  const { id, returned, ...itemUpdated } = item;
  const leadRef = ref(database, `${LEADS_REF}/${id}`);

  try {
    itemUpdated.deleted = true; // await remove(leadRef);

    await set(leadRef, { ...itemUpdated });
    message.success({
      content: "El item ha sido borrado exitosamente.",
      duration: 4,
      style: {
        position: "fixed",
        top: 10,
        right: 10,
        zIndex: 1000,
        padding: "10px",
        borderRadius: 4,
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
      },
    });
  } catch (error) {
    handleDatabaseError("deleteItemFromDatabase")(error);
  }
};

export const changeStateOfItemInDatabase = async (
  item,
  { uid: responsibleUid, displayName, comment },
  typeChange
) => {
  const { id, returned, ...itemUpdated } = item;
  const leadRef = ref(database, `${LEADS_REF}/${id}`);
  const newParrafo = `(${moment().format("HH:mm")})${displayName}: ${
    comment.trim() || "✉️"
  }`;

  const validateNewParrafo = (comment) => {
    if (comment.length > 100) return comment.substring(0, 100);

    return comment;
  };

  const updatedComment = `${
    item.comment ? item.comment : ""
  } \n ${validateNewParrafo(newParrafo)}`;

  try {
    switch (typeChange) {
      case "returned":
        itemUpdated.returned = !returned;
        itemUpdated.returnedBy = responsibleUid || null;
        itemUpdated.comment = updatedComment;
        break;
      case "deleted":
        itemUpdated.deleted = true;
        itemUpdated.deletedBy = responsibleUid || null;
        itemUpdated.comment = updatedComment;
        break;
      default:
        break;
    }

    await set(leadRef, { ...itemUpdated });

    message.success({
      content: "Estado del item ha sido cambiado exitosamente.",
      duration: 4,
      style: {
        position: "fixed",
        top: 10,
        right: 10,
        zIndex: 1000,
        padding: "10px",
        borderRadius: 4,
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
      },
    });
  } catch (error) {
    handleDatabaseError("changeStateOfItemInDatabase")(error);
  }
};

export const changeNumberOfColumnsInDatabase = async (
  numberOfColumns,
  user
) => {
  const { uid } = user || {};
  const userRef = ref(database, `${USERS_REF}/${uid}`);

  try {
    await update(userRef, {
      numberOfColumns: numberOfColumns === 2 ? 1 : 2,
    });
  } catch (error) {
    handleDatabaseError("changeNumberOfColumnsInDatabase")(error);
  }
};
//
// import { onValue, push, ref, remove, set } from "firebase/database";
// import { database } from "./firebase-config";

// const LEADS_REF = "/lends";
// const USERS_REF = "/users";

// const convertToArray = (obj) =>
//   obj ? Object.entries(obj).map(([id, value]) => ({ id, ...value })) : [];

// const handleDatabaseOperation = async (operation, func) => {
//   try {
//     await func();
//   } catch (error) {
//     console.error(`Error en ${operation}:`, error);
//     throw error;
//   }
// };

// export const addNewItemToDatabase = (newItem) =>
//   handleDatabaseOperation("addNewItemToDatabase", () =>
//     push(ref(database, LEADS_REF), {
//       ...newItem,
//       date: newItem.date.format("DD-MM-YYYY"),
//     })
//   );

// export const getDataFromFirebase = (callback) => {
//   if (typeof callback !== "function") {
//     console.error("getDataFromFirebase: callback debe ser una función");
//     return () => {};
//   }

//   return onValue(ref(database, LEADS_REF), (snapshot) => {
//     callback(convertToArray(snapshot.val()));
//   });
// };

// export const getUsersInFirebase = (callback) =>
//   onValue(ref(database, USERS_REF), (snapshot) => {
//     callback(convertToArray(snapshot.val()));
//   });

// export const uploadDataToFirebase = (data) =>
//   handleDatabaseOperation("uploadDataToFirebase", () =>
//     set(ref(database, LEADS_REF), data)
//   );

// export const deleteItemFromDatabase = ({ id }) =>
//   handleDatabaseOperation("deleteItemFromDatabase", () =>
//     remove(ref(database, `${LEADS_REF}/${id}`))
//   );

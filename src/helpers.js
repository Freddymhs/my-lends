import { onValue, push, ref, remove, set } from "firebase/database";
import { database } from "./firebase-config";

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
    date: newItem.date.format("DD-MM-YYYY"),
  };

  try {
    await push(leadsRef, itemToAdd);
  } catch (error) {
    handleDatabaseError("addNewItemToDatabase")(error);
  }
};

export const getDataFromFirebase = (callback) => {
  const leadsRef = ref(database, LEADS_REF);

  if (typeof callback !== "function") {
    console.error("getDataFromFirebase: callback debe ser una función");
    return () => {}; // Retorna una función vacía si no hay callback
  }

  const unsubscribe = onValue(
    leadsRef,
    (snapshot) => {
      const data = snapshot.val();
      const lends = data
        ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
        : [];
      callback(lends);
    },
    (error) => {
      console.error("Error al obtener datos de Firebase:", error);
    }
  );

  return unsubscribe;
};

export const getUsersInFirebase = (callback) => {
  const usersRef = ref(database, USERS_REF);

  return onValue(
    usersRef,
    (snapshot) => {
      const users = convertToArray(snapshot.val());
      callback(users);
    },
    handleDatabaseError("getUsersInFirebase")
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

export const deleteItemFromDatabase = async ({ id }) => {
  const leadRef = ref(database, `${LEADS_REF}/${id}`);

  try {
    await remove(leadRef);
    console.log("Leand borrado con éxito");
  } catch (error) {
    handleDatabaseError("deleteItemFromDatabase")(error);
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

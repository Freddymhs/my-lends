const findToUserName = (item, users) => {
  return (
    users.find(({ uid }) => uid === item.to)?.displayName ||
    "Email no encontrado"
  );
};

const findFromUserName = (item, users) => {
  return (
    users.find(({ uid }) => uid === item.from)?.displayName ||
    "Email no encontrado"
  );
};

export { findToUserName, findFromUserName };

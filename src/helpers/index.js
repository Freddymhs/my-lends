const formateUidToMail = (item, users) =>
  users.find(({ uid }) => uid === item.to)?.displayName ||
  "Email no encontrado";
const formateUidFromMail = (item, users) =>
  users.find(({ uid }) => uid === item.from)?.displayName ||
  "Email no encontrado";

export { formateUidToMail, formateUidFromMail };

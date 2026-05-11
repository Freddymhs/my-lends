import { useContext, useEffect, useState } from "react";
import { message } from "antd";
import { getUsersInFirebase } from "../helpers";
import { UserContext } from "../UserContext";
import { TOAST_STYLE } from "../utils/toastStyle";

/**
 * Subscribe to /users in RTDB and keep the local list of users.
 * Side effect: when the logged-in user's profile changes in DB
 * (e.g. an admin assigns a company), merge it into UserContext.
 *
 * Uses the functional setState form (`setUser(prev => ...)`) so this
 * hook does NOT need to depend on `user` — avoids the re-subscription
 * loop that would happen if `user` were in the deps array.
 */
const useUsers = (uid) => {
  const { setUser } = useContext(UserContext);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!uid) return undefined;

    const unsubscribe = getUsersInFirebase(
      (data) => {
        const me = data.find((u) => u.uid === uid);
        setUsers(data);
        if (me) {
          setUser((prev) => ({ ...prev, ...me }));
        }
      },
      (errorMessage) => {
        setUsers([]);
        message.error({
          content: errorMessage.message,
          duration: 4,
          style: TOAST_STYLE,
        });
      }
    );

    return unsubscribe;
  }, [uid, setUser]);

  return { users };
};

export default useUsers;

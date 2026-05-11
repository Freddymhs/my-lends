import { useEffect, useState } from "react";
import { message } from "antd";
import { getDataFromFirebase } from "../helpers";
import { TOAST_STYLE } from "../utils/toastStyle";

/**
 * Subscribe to /lends scoped by company. Splits the result into:
 *   - returnData: lends issued by the current company (fromCompany)
 *   - belongsData: lends received by the current company (toCompany)
 *
 * Re-subscribes when any input changes (uid, company, date range, filterType).
 * Returns loading=true while waiting for the first snapshot.
 */
const useLends = (uid, company, startDate, endDate, filterType) => {
  const [returnData, setReturnData] = useState([]);
  const [belongsData, setBelongsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const unsubscribe = getDataFromFirebase(
      (lends) => {
        setReturnData(lends.filter((item) => item.fromCompany === company));
        setBelongsData(lends.filter((item) => item.toCompany === company));
        setLoading(false);
      },
      (errorMessage) => {
        setReturnData([]);
        setBelongsData([]);
        setLoading(false);
        message.error({
          content: errorMessage.message,
          duration: 6,
          style: TOAST_STYLE,
        });
      },
      startDate,
      endDate,
      filterType
    );

    return unsubscribe;
  }, [uid, company, startDate, endDate, filterType]);

  return { returnData, belongsData, loading };
};

export default useLends;

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/es";

dayjs.extend(customParseFormat);
dayjs.locale("es");

export default dayjs;

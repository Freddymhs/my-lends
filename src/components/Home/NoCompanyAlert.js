import { Alert } from "antd";

const NoCompanyAlert = ({ company }) => {
  const noCompany = !company || company === "null" || company === "";
  return (
    noCompany && (
      <Alert
        message="Error, no perteneces a ninguna compañía"
        description="Por favor, solicita a tu compañía para que te una a ella"
        showIcon={false}
        type="error"
      />
    )
  );
};

export default NoCompanyAlert;

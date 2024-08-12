import { Alert } from "antd";

const NoCompanyAlert = (company) => {
  return (
    company === "null" && (
      <Alert
        message="Error, no perteneces a ninguna compañía"
        description="Por favor, solicita a tu compañía para que te una a ella"
        showIcon
        type="error"
      />
    )
  );
};

export default NoCompanyAlert;

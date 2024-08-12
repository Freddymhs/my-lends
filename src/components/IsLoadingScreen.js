import { Spin } from "antd";
const IsLoadingScreen = ({ loading }) => {
  return (
    loading && (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    )
  );
};

export default IsLoadingScreen;

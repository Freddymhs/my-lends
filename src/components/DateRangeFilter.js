import React from "react";
import { DatePicker, Button } from "antd";
import { isMobile } from "react-device-detect";
// import moment from "moment";

const { RangePicker } = DatePicker;

const DateRangeFilter = ({ onFilter, dateRange, setDateRange }) => {
  const handleFilter = () => {
    if (dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf("day").toDate();
      const end = dateRange[1].endOf("day").toDate();
      onFilter(start, end);
    } else {
      console.log("Por favor selecciona un rango de fechas válido");
    }
  };

  const handleClear = () => {
    setDateRange([null, null]);
    onFilter(null, null);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: 8,
      }}
    >
      <RangePicker
        value={dateRange}
        onChange={setDateRange}
        style={{ width: "100%" }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <Button type="primary" onClick={handleFilter} style={{ flex: 1 }}>
          Filtrar por fecha
        </Button>
        <Button onClick={handleClear} style={{ flex: 1 }}>
          Quitar filtro
        </Button>
      </div>
    </div>
  );
};

export default DateRangeFilter;

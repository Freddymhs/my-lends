import React from "react";
import { DatePicker, Button } from "antd";
import { isMobile } from "react-device-detect";

const { RangePicker } = DatePicker;

const DateRangeFilter = ({ onFilter, dateRange, setDateRange }) => {
  const handleFilter = () => {
    if (dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf("day").toDate();
      const end = dateRange[1].endOf("day").toDate();
      onFilter(start, end);
    }
  };

  const handleClear = () => {
    setDateRange([null, null]);
    onFilter(null, null);
  };

  return (
    <>
      <RangePicker
        value={dateRange}
        onChange={setDateRange}
        style={{ width: "100%", maxWidth: "800px" }}
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
    </>
  );
};

export default DateRangeFilter;

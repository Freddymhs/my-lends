import React, { useState } from "react";
import { DatePicker, Button } from "antd";
// import moment from "moment";

const { RangePicker } = DatePicker;

const DateRangeFilter = ({ onFilter, dateRange, setDateRange }) => {
  const handleFilter = () => {
    if (dateRange[0] && dateRange[1]) {
      // console.log(" dateRange", dateRange);
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
        justifyContent: "space-around",
        marginBottom: 16,
      }}
    >
      <RangePicker
        value={dateRange}
        onChange={setDateRange}
        style={{ marginLeft: 8, flex: 3 }}
      />
      <Button
        onClick={handleFilter}
        type="primary"
        style={{ marginLeft: 8, flex: 1 }}
      >
        Filtrar por fecha
      </Button>
      <Button
        onClick={handleClear}
        style={{ marginLeft: 8, marginRight: 8, flex: 1 }}
      >
        Quitar filtro
      </Button>
    </div>
  );
};

export default DateRangeFilter;

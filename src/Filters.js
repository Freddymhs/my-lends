import React from "react";
import { TreeSelect } from "antd";

const Filters = ({ setFilterType, filterType }) => {
  const handleChange = (value) => {
    setFilterType({
      notReturned: value.includes("notReturned"),
      returned: value.includes("returned"),
      wasReturned: value.includes("wasReturned"),
      deleted: value.includes("deleted"),
    });
  };

  return (
    <>
      <TreeSelect
        showSearch={false}
        style={{ width: "100%" }}
        value={Object.keys(filterType).filter((key) => filterType[key])}
        dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
        treeCheckable={true}
        showCheckedStrategy={TreeSelect.SHOW_PARENT}
        placeholder="Estados para filtrar los prestamos"
        onChange={handleChange}
        allowClear
      >
        <TreeSelect.TreeNode value="notReturned" title="No regresados" />
        <TreeSelect.TreeNode value="returned" title="Regresados" />
        <TreeSelect.TreeNode
          value="wasReturned"
          title="Regresado anteriormente"
        />
        <TreeSelect.TreeNode value="deleted" title="Eliminados" />
      </TreeSelect>
    </>
  );
};

export default Filters;

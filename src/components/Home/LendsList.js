import React, { useState } from "react";
import { List, Collapse, Divider } from "antd";
import { isMobile } from "react-device-detect";
import {
  findToUserName,
  findFromUserName,
  findReturnedByUserName,
} from "../../helpers/index";
import { SwipeableList, SwipeableListItem } from "react-swipeable-list";
import { CheckCircleFilled, CheckCircleOutlined } from "@ant-design/icons";
import moment from "moment";
import "moment/locale/es";
moment.locale("es");

const LendsList = ({
  data,
  allUsersInFirebase,
  trailingActions,
  leadingActions,
  formatUser,
  showLeadingActions,
  showTrailingActions,
}) => {
  const { Panel } = Collapse;
  const [openKey, setOpenKey] = useState([]);

  const handleCollapseChange = (key) => {
    const isOpen = openKey.includes(key);

    isOpen && setOpenKey(openKey.filter((item) => item !== key));
    !isOpen && setOpenKey([...openKey, key]);
  };

  return (
    <List
      grid={{ gutter: 16, column: isMobile ? 1 : 4 }}
      dataSource={data}
      renderItem={(item) => {
        const { id } = item;
        return (
          <List.Item>
            <SwipeableList fullSwipe={true}>
              <SwipeableListItem
                key={id}
                blockSwipe={false}
                trailingActions={showTrailingActions ?? trailingActions(item)}
                leadingActions={showLeadingActions ?? leadingActions(item)}
              >
                <Collapse
                  activeKey={openKey.includes(id) ? id : []}
                  onChange={() => handleCollapseChange(id)}
                  style={{
                    width: "100%",
                    margin: "0 !important",
                    padding: "0 !important",
                  }}
                  expandIcon={() => {
                    return (
                      <>
                        {!!item?.returned ? (
                          <CheckCircleFilled
                            style={{
                              color: "#ff7043",
                              fontSize: "15px",
                              margin: "0 !important",
                              padding: "0 !important",
                              display: "block",
                            }}
                          />
                        ) : (
                          <CheckCircleOutlined
                            style={{
                              color: "#d9d9d9",
                              fontSize: "13px",
                              margin: "0 !important",
                              padding: "0 !important",
                              display: "block",
                            }}
                          />
                        )}
                      </>
                    );
                  }}
                >
                  <Panel
                    key={id}
                    header={
                      <div>
                        <span
                          style={{
                            color: item.returned ? "#ff7043" : "#1890ff",
                            display: "flex",
                            justifyContent: "start",
                          }}
                        >
                          {openKey.includes(id) &&
                            !!item.returnedBy &&
                            findReturnedByUserName(item, allUsersInFirebase)}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>{item.name}</span>
                        </div>
                        <Divider
                          style={{
                            margin: "3px",
                            borderWidth: "1px",
                          }}
                        />
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span
                            style={{
                              color: "#1890ff",
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <span>[{item.quantity.toString().trim()}]</span>
                          </span>
                          <span
                            style={{
                              color: "#1890ff",
                              display: "flex",
                              justifyContent: isMobile ? "start" : "center",
                              alignContent: "center",
                            }}
                          >
                            {item.toCompany}
                          </span>
                        </div>
                      </div>
                    }
                  >
                    {/* Contenido del Panel */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile
                          ? "1fr"
                          : "repeat(2, 1fr)", // Una columna en móvil, tres en escritorio
                        gap: "8px", // Espacio entre los elementos
                      }}
                    >
                      {[
                        {
                          label: "Recibe:",
                          value: findToUserName(item, allUsersInFirebase),
                        },
                        {
                          label: "Anota:",
                          value: findFromUserName(item, allUsersInFirebase),
                        },
                        {
                          label: "Fecha de préstamo:",
                          value: moment(item.date, "DD-MM").format("DD/MMMM"),
                        },
                        {
                          label: "Hora de préstamo:",
                          value: moment(
                            item.date,
                            "DD-MM-YYYY HH:mm:ss"
                          ).format("HH:mm"),
                        },
                      ].map((entry, index) => (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px", // Espacio entre la etiqueta y el valor
                            marginBottom: isMobile ? "8px" : "0", // Margen inferior en vista móvil
                          }}
                        >
                          <strong>{entry.label}</strong> {entry.value}
                        </div>
                      ))}
                    </div>
                    <div>
                      <strong> Historial de cambios: </strong>
                      {item.comment?.split("\n").map((line, index) => (
                        <p
                          style={{
                            margin: "0px",
                            marginBottom: "7px",
                            wordBreak: "break-word",
                            lineHeight: "1.2",
                            textAlign: "left",
                          }}
                          key={index}
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  </Panel>
                </Collapse>
                {/* <Card
                  style={{
                    borderRadius: "7px", // Para bordes redondeados, si lo prefieres
                  }}
                  bordered={true}
                  hoverable={true}
                  actions={[
                    <span
                      style={{
                        color: "#1890ff",
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <span>{item.toCompany}</span>
                    </span>,
                    <span
                      style={{
                        color: "#1890ff",
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <span>Cantidad: {item.quantity}</span>
                    </span>,
                  ]}
                  title={
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-evenly",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          flex: "1 ",
                        }}
                      >
                        {!!item?.returned && (
                          <CheckCircleFilled
                            style={{
                              color: "#ff7043",
                              fontSize: "34px",
                            }}
                          />
                        )}
                      </span>

                      <span
                        style={{
                          margin: 0, // Elimina márgenes por defecto del <p>
                          textAlign: "right", // Alinea el texto a la derecha
                        }}
                      >
                        {item.name}
                      </span>
                    </div>
                  }
                >
                  <Descriptions
                    size="small"
                    column={isMobile ? 2 : 3}
                    layout="vertical"
                    style={{ textAlign: "left" }}
                  >
                    <Descriptions.Item
                      // label={formatUser === findToUserName ? "recibe" : "recibio"}
                      label="recibe"
                    >
                      {findToUserName(item, allUsersInFirebase)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Fecha de préstamo">
                      {item.date}
                    </Descriptions.Item>

                    <Descriptions.Item
                      // label={formatUser === findFromUserName ? "solicito" : "anota"}
                      label="anota"
                    >
                      {findFromUserName(item, allUsersInFirebase)}
                    </Descriptions.Item>
                  </Descriptions>
                </Card> */}
              </SwipeableListItem>
            </SwipeableList>
          </List.Item>
        );
      }}
    />
  );
};
export default LendsList;

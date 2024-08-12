import React from "react";
import { List, Card, Descriptions } from "antd";
import { isMobile } from "react-device-detect";
import { findToUserName, findFromUserName } from "../../helpers/index";
import { SwipeableList, SwipeableListItem } from "react-swipeable-list";

const LendsList = ({
  data,
  allUsersInFirebase,
  trailingActions,
  formatUser,
  blockSwipe,
}) => (
  <List
    grid={{ gutter: 16, column: isMobile ? 2 : 4 }}
    dataSource={data}
    renderItem={(item) => (
      <List.Item>
        <SwipeableList fullSwipe={true}>
          <SwipeableListItem
            key={item.id}
            blockSwipe={blockSwipe}
            trailingActions={trailingActions(item)}
            type="ommer"
          >
            <Card
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
                <span
                  style={{ wordWrap: "break-word", whiteSpace: "pre-wrap" }}
                >
                  {item.name}
                </span>
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
            </Card>
          </SwipeableListItem>
        </SwipeableList>
      </List.Item>
    )}
  />
);
export default LendsList;

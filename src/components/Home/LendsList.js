import React from "react";
import { List, Card, Descriptions } from "antd";
import { isMobile } from "react-device-detect";
import { formateUidToMail, formateUidFromMail } from "../../helpers/index";
import { SwipeableList, SwipeableListItem } from "react-swipeable-list";

const LendsList = ({
  data,
  users,
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
                  <p>{item.toCompany}</p>
                </span>,
                <span
                  style={{
                    color: "#1890ff",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <p>Cantidad: {item.quantity}</p>
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
                  label={formatUser === formateUidToMail ? "para" : "dueño/a"}
                >
                  {formatUser(item, users)}
                </Descriptions.Item>

                <Descriptions.Item label="Fecha de préstamo">
                  {item.date}
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    formatUser === formateUidToMail ? "Anotado por" : "dueño/a"
                  }
                >
                  {formateUidFromMail(item, users)}
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

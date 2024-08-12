import React, { useState } from "react";
import { Modal, Form, Input, DatePicker, InputNumber, Select } from "antd";
import moment from "moment";
import { auth } from "../../firebase-config";
import { isMobile } from "react-device-detect";
import { PlusOutlined } from "@ant-design/icons";
import { Button } from "antd";

const { Option } = Select;

const AddLoanModal = ({
  visible,
  onCreate,
  setVisible,
  users,
  actualCompanyIs,
  company,
}) => {
  const [form] = Form.useForm();
  const [toCompany, setToCompany] = useState("");

  const initialValues = {
    date: moment(),
    from: auth.currentUser?.uid,
    fromCompany: actualCompanyIs,
    name: "",
    quantity: 1,
    to: "",
    toCompany: "",
  };

  const filteredUsers = users.filter(
    ({ uid }) => uid !== auth?.currentUser?.uid
  );
  const filteredUsersByCompany = filteredUsers.filter(
    ({ company }) => company !== actualCompanyIs
  );

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onCreate(values);
      setVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleCancel = () => {
    setVisible(false);
    form.resetFields();
  };

  return (
    <>
      <div
        className={
          isMobile
            ? "floating-button-container-mobile"
            : "floating-button-container"
        }
      >
        <Button
          disabled={company === "null"}
          className={isMobile ? "floating-button-mobile" : "floating-button"}
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setVisible(!visible)}
        />
      </div>
      <Modal
        visible={visible}
        title="Crear Préstamo"
        okText="Agregar"
        cancelText="Cancelar"
        onCancel={handleCancel}
        onOk={handleOk}
      >
        <Form form={form} layout="vertical" initialValues={initialValues}>
          <Form.Item name="fromCompany" label="FROM COMPANY" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="toCompany" label="TO COMPANY" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="date"
            label="Fecha"
            hidden
            showTime
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="Selecciona fecha y hora"
            rules={[
              { required: true, message: "Por favor ingresa la fecha y hora" },
            ]}
          >
            <DatePicker
              format="YYYY-MM-DD HH:mm:ss"
              showTime={{
                defaultValue: moment(),
              }}
            />
          </Form.Item>

          <Form.Item
            name="from"
            label="From (tu ID)"
            hidden
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="name"
            label="Nombre del artículo"
            rules={[
              {
                required: true,
                message: "Por favor ingresa el nombre del artículo",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Cantidad"
            rules={[
              { required: true, message: "Por favor ingresa la cantidad" },
              {
                type: "number",
                min: 1,
                message: "La cantidad debe ser al menos 1",
              },
            ]}
          >
            <InputNumber style={{ width: "100%" }} type="number" />
          </Form.Item>

          <Form.Item
            name="to"
            label="Para (Usuario que recibirá el préstamo)"
            rules={[
              {
                required: true,
                message: "Por favor selecciona el destinatario",
              },
            ]}
          >
            <Select
              placeholder="Selecciona el destinatario"
              onChange={(_, args) => {
                setToCompany(args?.toCompany);
                form.setFieldsValue({ toCompany: args?.toCompany });
              }}
            >
              {filteredUsersByCompany.map(({ uid, displayName, company }) => (
                <Option
                  key={uid}
                  value={uid}
                  toCompany={company}
                  disabled={company === "null"}
                >
                  {displayName} - {company}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AddLoanModal;

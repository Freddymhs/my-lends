import React from "react";
import { Modal, Form, Input, DatePicker, InputNumber, Select } from "antd";
import moment from "moment";
import { auth } from "./firebase-config";

const { Option } = Select;

const AddLoanModal = ({ visible, onCreate, setVisible, users }) => {
  const [form] = Form.useForm();

  const initialValues = {
    date: moment(),
    from: auth.currentUser?.uid,
    name: "",
    quantity: 1,
    to: "",
  };

  const filteredUsers = users.filter(
    ({ uid }) => uid !== auth?.currentUser?.uid
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
    <Modal
      visible={visible}
      title="Crear Préstamo"
      okText="Agregar"
      cancelText="Cancelar"
      onCancel={handleCancel}
      onOk={handleOk}
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item
          name="date"
          label="Fecha"
          hidden
          rules={[{ required: true, message: "Por favor ingresa la fecha" }]}
        >
          <DatePicker style={{ width: "100%" }} />
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
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="to"
          label="Para (Usuario que recibirá el préstamo)"
          rules={[
            { required: true, message: "Por favor selecciona el destinatario" },
          ]}
        >
          <Select placeholder="Selecciona el destinatario">
            {filteredUsers.map(({ email, uid }) => (
              <Option key={uid} value={uid}>
                {email}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddLoanModal;

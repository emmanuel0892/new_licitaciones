"use client"

import { useState, useEffect, useRef } from "react"
import { Table, Button, Space, Tag, Typography, Card, App, Popconfirm } from "antd"
import { PlusOutlined, EditOutlined, CheckOutlined, StopOutlined } from "@ant-design/icons"
import { getUsers, changeUserStatus } from "@/actions/users"
import { formatDate } from "@/lib/helpers"
import ModalUsuario from "@/components/modals/ModalUsuario"
import styles from "./usuarios.module.css"

const { Title } = Typography

const UsuariosPage = () => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const modalRef = useRef(null)

  const loadUsers = async () => {
    setLoading(true)
    const result = await getUsers()
    if (result.data) {
      setUsers(result.data.map((user) => ({ ...user, key: user.id })))
    }
    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleChangeStatus = async (id) => {
    message.loading("Cambiando estado del usuario...")
    const result = await changeUserStatus(id)
    if (result.success) {
      message.success("Estado del usuario actualizado correctamente")
      loadUsers()
    } else {
      message.error(result.error || "Error al cambiar el estado")
    }
  }

  const handleOpenModal = (id, action) => {
    modalRef.current?.open(id, action)
  }

  const columns = [
    {
      title: "Nombre",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name)
    },
    {
      title: "Apellido",
      dataIndex: "lastname",
      key: "lastname",
      sorter: (a, b) => a.lastname.localeCompare(b.lastname)
    },
    {
      title: "RUT",
      dataIndex: "rut",
      key: "rut"
    },
    {
      title: "Correo",
      dataIndex: "email",
      key: "email"
    },
    {
      title: "Departamento",
      dataIndex: "departamento",
      key: "departamento"
    },
    {
      title: "Tipo de Cuenta",
      dataIndex: "typeAccount",
      key: "typeAccount",
      render: (text) => (
        <Tag color="#23aeaa">{text}</Tag>
      )
    },
    {
      title: "Creación",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => formatDate(text),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    },
    {
      title: "Estado",
      dataIndex: "active",
      key: "active",
      render: (text) => (
        <Tag color={text === "active" ? "success" : "error"}>
          {text === "active" ? "Activo" : "Inactivo"}
        </Tag>
      )
    },
    {
      title: "Acciones",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#23aeaa" }} />}
            onClick={() => handleOpenModal(record.id, "edit")}
          />
          {record.active === "active" ? (
            <Popconfirm
              title="¿Deseas deshabilitar este usuario?"
              okText="Deshabilitar"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleChangeStatus(record.id)}
            >
              <Button
                type="text"
                icon={<StopOutlined style={{ color: "#e53935" }} />}
              />
            </Popconfirm>
          ) : (
            <Popconfirm
              title="¿Deseas activar este usuario?"
              okText="Activar"
              cancelText="Cancelar"
              onConfirm={() => handleChangeStatus(record.id)}
            >
              <Button
                type="text"
                icon={<CheckOutlined style={{ color: "#268e00" }} />}
              />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Title level={3} style={{ margin: 0 }}>Usuarios</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal(null, "create")}
          >
            Agregar Usuario
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `Total: ${total} usuarios`
          }}
        />
      </Card>

      <ModalUsuario ref={modalRef} onSuccess={loadUsers} />
    </div>
  )
}

export default UsuariosPage

"use client"

import { useState, useEffect, useRef } from "react"
import { Table, Button, Space, Tag, Typography, Card, App, Popconfirm, Tooltip } from "antd"
import { PlusOutlined, EditOutlined, CheckOutlined, StopOutlined, UploadOutlined } from "@ant-design/icons"
import { getUsers, changeUserStatus } from "@/actions/users"
import { formatDate } from "@/lib/helpers"
import ModalUsuario from "@/components/modals/ModalUsuario"
import ModalFirmaUsuario from "@/components/modals/ModalFirmaUsuario"
import styles from "./usuarios.module.css"

const { Title } = Typography

const mapUsersToRows = (items = []) => items.map((user) => ({ ...user, key: user.id }))

const UsuariosPage = () => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const modalRef = useRef(null)
  const signatureModalRef = useRef(null)

  const loadUsers = async () => {
    setLoading(true)
    const result = await getUsers()
    if (result.data) {
      setUsers(mapUsersToRows(result.data))
    }
    setLoading(false)
  }

  useEffect(() => {
    let ignore = false

    const loadInitialUsers = async () => {
      const result = await getUsers()

      if (ignore) {
        return
      }

      if (result.data) {
        setUsers(mapUsersToRows(result.data))
      }

      setLoading(false)
    }

    loadInitialUsers()

    return () => {
      ignore = true
    }
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

  const handleOpenSignatureModal = (user) => {
    signatureModalRef.current?.open(user)
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
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#23aeaa" }} />}
            onClick={() => handleOpenModal(record.id, "edit")}
          />
          <Tooltip title="Subir firma">
            <Button
              type="text"
              icon={<UploadOutlined style={{ color: "#1677ff" }} />}
              onClick={() => handleOpenSignatureModal(record)}
            />
          </Tooltip>
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
      <ModalFirmaUsuario ref={signatureModalRef} onSuccess={loadUsers} />
    </div>
  )
}

export default UsuariosPage

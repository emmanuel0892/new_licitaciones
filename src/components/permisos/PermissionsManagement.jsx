"use client"

import { useEffect, useMemo, useState } from "react"
import {
  App,
  Button,
  Card,
  Checkbox,
  Col,
  Empty,
  List,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography
} from "antd"
import { EditOutlined, ReloadOutlined, SafetyCertificateOutlined, TeamOutlined } from "@ant-design/icons"
import {
  getPermissionManagementData,
  syncPermissionCatalog,
  updateRolePermissions,
  updateUserRoles
} from "@/actions/permisos"

const { Text, Title } = Typography

const WORKFLOW_CATEGORIES = new Set(["Workflow - Avanzar", "Workflow - Devolver"])

const getStepNumberFromPermissionCode = (codigo) => {
  const parts = String(codigo).split(".")
  const last = parts[parts.length - 1]
  const number = Number(last)

  return Number.isFinite(number) ? number : 999999
}

const getWorkflowSectionByStep = (numeroPaso) => {
  const step = Number(numeroPaso)

  if (step >= 1 && step <= 16) return "Flujo principal"
  if (step >= 17 && step <= 24) return "Inicio anticipado"
  if (step >= 25 && step <= 35) return "Contrato"
  if (step >= 36 && step <= 46) return "Addendum"

  return "Otro"
}

const getWorkflowSectionColor = (section) => {
  const colors = {
    "Flujo principal": "blue",
    "Inicio anticipado": "gold",
    Contrato: "green",
    Addendum: "purple"
  }

  return colors[section] ?? "default"
}

const PermissionsManagement = () => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [selectedRoleId, setSelectedRoleId] = useState(null)
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([])
  const [rolesModalOpen, setRolesModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedUserRoleIds, setSelectedUserRoleIds] = useState([])

  const loadData = async () => {
    const result = await getPermissionManagementData()

    if (result.data) {
      setUsers(result.data.users)
      setRoles(result.data.roles)
      setPermissions(result.data.permissions)

      const currentRoleId = selectedRoleId ?? result.data.roles[0]?.id ?? null
      const currentRole = result.data.roles.find((role) => role.id === currentRoleId)

      setSelectedRoleId(currentRoleId)
      setSelectedPermissionIds(currentRole?.permissionIds ?? [])
    } else {
      message.error(result.error || "Error al obtener permisos")
    }

    setLoading(false)
  }

  useEffect(() => {
    let active = true

    getPermissionManagementData().then((result) => {
      if (!active) return

      if (result.data) {
        setUsers(result.data.users)
        setRoles(result.data.roles)
        setPermissions(result.data.permissions)

        const currentRoleId = result.data.roles[0]?.id ?? null
        const currentRole = result.data.roles.find((role) => role.id === currentRoleId)

        setSelectedRoleId(currentRoleId)
        setSelectedPermissionIds(currentRole?.permissionIds ?? [])
      } else {
        message.error(result.error || "Error al obtener permisos")
      }

      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [message])

  const groupedPermissions = useMemo(() => {
    const groups = permissions.reduce((itemsByCategory, permission) => {
      const category = permission.categoria || "Sin categoría"
      const items = itemsByCategory.get(category) ?? []
      items.push(permission)
      itemsByCategory.set(category, items)
      return itemsByCategory
    }, new Map())

    groups.forEach((categoryPermissions, category) => {
      const orderedPermissions = [...categoryPermissions].sort((a, b) => {
        if (WORKFLOW_CATEGORIES.has(category)) {
          const aStep = getStepNumberFromPermissionCode(a.codigo)
          const bStep = getStepNumberFromPermissionCode(b.codigo)

          if (aStep !== bStep) return aStep - bStep
        }

        return a.nombre.localeCompare(b.nombre, "es")
      })

      groups.set(category, orderedPermissions)
    })

    return groups
  }, [permissions])

  const handleSelectRole = (roleId) => {
    const role = roles.find((item) => item.id === roleId)
    setSelectedRoleId(roleId)
    setSelectedPermissionIds(role?.permissionIds ?? [])
  }

  const handleTogglePermission = (permissionId, checked) => {
    setSelectedPermissionIds((current) => {
      if (checked) {
        return [...new Set([...current, permissionId])]
      }

      return current.filter((id) => id !== permissionId)
    })
  }

  const handleSelectCategory = (categoryPermissions) => {
    setSelectedPermissionIds((current) => [
      ...new Set([...current, ...categoryPermissions.map((permission) => permission.id)])
    ])
  }

  const handleClearCategory = (categoryPermissions) => {
    const categoryIds = new Set(categoryPermissions.map((permission) => permission.id))
    setSelectedPermissionIds((current) => current.filter((id) => !categoryIds.has(id)))
  }

  const handleSavePermissions = async () => {
    if (!selectedRoleId) return

    setSaving(true)
    const result = await updateRolePermissions({
      roleId: selectedRoleId,
      permissionIds: selectedPermissionIds
    })

    if (result.success) {
      message.success("Permisos actualizados correctamente")
      await loadData()
    } else {
      message.error(result.error || "Error al actualizar permisos")
    }

    setSaving(false)
  }

  const handleSyncPermissionCatalog = async () => {
    setSaving(true)
    const result = await syncPermissionCatalog()

    if (result.success) {
      message.success("Catálogo de permisos actualizado correctamente")
      await loadData()
    } else {
      message.error(result.error || "Error al actualizar el catálogo de permisos")
    }

    setSaving(false)
  }

  const handleOpenRolesModal = (user) => {
    setSelectedUser(user)
    setSelectedUserRoleIds(user.roleIds)
    setRolesModalOpen(true)
  }

  const handleSaveUserRoles = async () => {
    if (!selectedUser) return

    setSaving(true)
    const result = await updateUserRoles({
      userId: selectedUser.id,
      roleIds: selectedUserRoleIds
    })

    if (result.success) {
      message.success("Roles actualizados correctamente")
      setRolesModalOpen(false)
      await loadData()
    } else {
      message.error(result.error || "Error al actualizar roles")
    }

    setSaving(false)
  }

  const userColumns = [
    {
      title: "Nombre",
      key: "name",
      render: (_, user) => `${user.name} ${user.lastname}`
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email"
    },
    {
      title: "Roles actuales",
      key: "roles",
      render: (_, user) => (
        <Space wrap>
          {user.roleNames.length > 0
            ? user.roleNames.map((roleName) => <Tag key={roleName}>{roleName}</Tag>)
            : <Text type="secondary">Sin roles</Text>}
        </Space>
      )
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_, user) => (
        <Button icon={<EditOutlined />} onClick={() => handleOpenRolesModal(user)}>
          Gestionar roles
        </Button>
      )
    }
  ]

  const usersAndRolesTab = (
    <Card>
      <Table
        rowKey="id"
        dataSource={users}
        columns={userColumns}
        pagination={{ pageSize: 10, showSizeChanger: false }}
      />
    </Card>
  )

  const rolesAndPermissionsTab = (
    <Row gutter={16}>
      <Col xs={24} lg={7}>
        <Card title="Roles">
          <List
            dataSource={roles}
            locale={{ emptyText: "No hay roles registrados" }}
            renderItem={(role) => (
              <List.Item
                onClick={() => handleSelectRole(role.id)}
                style={{
                  cursor: "pointer",
                  padding: "12px",
                  borderRadius: 8,
                  background: selectedRoleId === role.id ? "#e6f4ff" : "transparent"
                }}
              >
                <Text strong={selectedRoleId === role.id}>{role.name}</Text>
              </List.Item>
            )}
          />
        </Card>
      </Col>
      <Col xs={24} lg={17}>
        <Card
          title="Permisos del rol"
          extra={
            <Button type="primary" loading={saving} onClick={handleSavePermissions} disabled={!selectedRoleId}>
              Guardar cambios
            </Button>
          }
        >
          {!selectedRoleId ? (
            <Empty description="Seleccione un rol" />
          ) : permissions.length === 0 ? (
            <Empty description="No hay permisos registrados" />
          ) : (
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              {[...groupedPermissions.entries()].map(([category, categoryPermissions]) => (
                <Card
                  key={category}
                  size="small"
                  title={category}
                  extra={
                    <Space>
                      <Button size="small" onClick={() => handleSelectCategory(categoryPermissions)}>
                        Seleccionar todos
                      </Button>
                      <Button size="small" onClick={() => handleClearCategory(categoryPermissions)}>
                        Limpiar categoría
                      </Button>
                    </Space>
                  }
                >
                  <Space direction="vertical">
                    {categoryPermissions.map((permission) => {
                      const workflowPermission = WORKFLOW_CATEGORIES.has(category)
                      const stepNumber = getStepNumberFromPermissionCode(permission.codigo)
                      const workflowSection = getWorkflowSectionByStep(stepNumber)

                      return (
                        <Checkbox
                          key={permission.id}
                          checked={selectedPermissionIds.includes(permission.id)}
                          onChange={(event) => handleTogglePermission(permission.id, event.target.checked)}
                        >
                          <Space size={8} wrap>
                            <Text>{permission.nombre}</Text>
                            {workflowPermission && (
                              <Tag color={getWorkflowSectionColor(workflowSection)}>
                                {workflowSection}
                              </Tag>
                            )}
                            <Text type="secondary">
                              {permission.codigo}
                            </Text>
                          </Space>
                        </Checkbox>
                      )
                    })}
                  </Space>
                </Card>
              ))}
            </Space>
          )}
        </Card>
      </Col>
    </Row>
  )

  return (
    <div>
      <Title level={3}>Gestión de Permisos</Title>
      <Text type="secondary">
        Configure roles de usuarios y permisos operativos por rol.
      </Text>
      <div style={{ marginTop: 16 }}>
        <Button icon={<ReloadOutlined />} loading={saving} onClick={handleSyncPermissionCatalog}>
          Inicializar o actualizar catálogo
        </Button>
      </div>

      <Spin spinning={loading}>
        <Tabs
          style={{ marginTop: 20 }}
          items={[
            {
              key: "users",
              label: (
                <Space>
                  <TeamOutlined />
                  Usuarios y roles
                </Space>
              ),
              children: usersAndRolesTab
            },
            {
              key: "permissions",
              label: (
                <Space>
                  <SafetyCertificateOutlined />
                  Roles y permisos
                </Space>
              ),
              children: rolesAndPermissionsTab
            }
          ]}
        />
      </Spin>

      <Modal
        title={selectedUser ? `Gestionar roles - ${selectedUser.name} ${selectedUser.lastname}` : "Gestionar roles"}
        open={rolesModalOpen}
        onCancel={() => setRolesModalOpen(false)}
        onOk={handleSaveUserRoles}
        okText="Guardar roles"
        cancelText="Cancelar"
        confirmLoading={saving}
      >
        <Select
          mode="multiple"
          style={{ width: "100%" }}
          placeholder="Seleccione uno o más roles"
          value={selectedUserRoleIds}
          onChange={setSelectedUserRoleIds}
          options={roles.map((role) => ({
            value: role.id,
            label: role.name
          }))}
        />
      </Modal>
    </div>
  )
}

export default PermissionsManagement

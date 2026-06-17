"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
  getRolePermissions,
  syncPermissionCatalog,
  updateRolePermissions,
  updateUserRoles
} from "@/actions/permisos"
import { getTratoDirectoPermissionOrder, getConvenioMarcoPermissionOrder, getCompraAgilPermissionOrder } from "@/lib/permissionCodes"

const { Text, Title } = Typography

const WORKFLOW_CATEGORIES = new Set(["Workflow - Avanzar", "Workflow - Devolver"])
const NOVEDADES_PERMISSION_ORDER = new Map([
  ["novedades.ver", 0],
  ["novedades.crear", 1],
  ["novedades.editar", 2],
  ["novedades.eliminar", 3]
])
const CATEGORY_ORDER = [
  "Administración",
  "Sidebar",
  "Firmas",
  "Licitaciones",
  "Workflow - Avanzar",
  "Workflow - Devolver",
  "Trato Directo",
  "Convenio Marco / Gran Compra",
  "Compra Agil",
  "Documentos",
  "Usuarios",
  "Gestión Novedades"
]

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

const formatRoleName = (roleName = "") => {
  return String(roleName)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase())
}

const normalizePermissionIds = (permissionIds = []) => {
  return permissionIds
    .map((permissionId) => Number(
      permissionId?.permiso_id ?? permissionId?.permisoId ?? permissionId?.id ?? permissionId
    ))
    .filter((permissionId) => Number.isInteger(permissionId) && permissionId > 0)
}

const categoryFooterStyle = {
  display: "flex",
  justifyContent: "flex-end",
  paddingTop: 12,
  marginTop: 12,
  borderTop: "1px solid #f1f5f9"
}

const PermissionsManagement = () => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [selectedRoleId, setSelectedRoleId] = useState(null)
  const [selectedRoleName, setSelectedRoleName] = useState("")
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([])
  const [loadingRolePermissions, setLoadingRolePermissions] = useState(false)
  const [rolesModalOpen, setRolesModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedUserRoleIds, setSelectedUserRoleIds] = useState([])
  const rolePermissionRequestRef = useRef(0)

  const loadData = async () => {
    const result = await getPermissionManagementData()

    if (result.data) {
      setUsers(result.data.users)
      setRoles(result.data.roles)
      setPermissions(result.data.permissions)

      const currentRoleId = selectedRoleId ?? result.data.roles[0]?.id ?? null
      const currentRole = result.data.roles.find((role) => role.id === currentRoleId)

      setSelectedRoleId(currentRoleId)
      setSelectedRoleName(currentRole?.name ?? "")
      setSelectedPermissionIds(normalizePermissionIds(currentRole?.permissionIds))
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
        setSelectedRoleName(currentRole?.name ?? "")
        setSelectedPermissionIds(normalizePermissionIds(currentRole?.permissionIds))
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
        if (category === "Gestión Novedades") {
          return (
            (NOVEDADES_PERMISSION_ORDER.get(a.codigo) ?? 999999) -
            (NOVEDADES_PERMISSION_ORDER.get(b.codigo) ?? 999999)
          )
        }

        if (WORKFLOW_CATEGORIES.has(category)) {
          const aStep = getStepNumberFromPermissionCode(a.codigo)
          const bStep = getStepNumberFromPermissionCode(b.codigo)

          if (aStep !== bStep) return aStep - bStep
        }

        if (category === "Trato Directo") {
          return getTratoDirectoPermissionOrder(a) - getTratoDirectoPermissionOrder(b)
        }

        if (category === "Compra Agil") {
          return getCompraAgilPermissionOrder(a) - getCompraAgilPermissionOrder(b)
        }

        if (category === "Convenio Marco / Gran Compra") {
          return getConvenioMarcoPermissionOrder(a) - getConvenioMarcoPermissionOrder(b)
        }

        return a.nombre.localeCompare(b.nombre, "es")
      })

      groups.set(category, orderedPermissions)
    })

    return [...groups.entries()].sort(([firstCategory], [secondCategory]) => {
      const firstIndex = CATEGORY_ORDER.indexOf(firstCategory)
      const secondIndex = CATEGORY_ORDER.indexOf(secondCategory)
      const firstOrder = firstIndex === -1 ? CATEGORY_ORDER.length : firstIndex
      const secondOrder = secondIndex === -1 ? CATEGORY_ORDER.length : secondIndex

      if (firstOrder !== secondOrder) return firstOrder - secondOrder

      return firstCategory.localeCompare(secondCategory, "es")
    })
  }, [permissions])

  const loadRolePermissions = async (roleId) => {
    const requestId = rolePermissionRequestRef.current + 1
    rolePermissionRequestRef.current = requestId
    setLoadingRolePermissions(true)
    const result = await getRolePermissions(roleId)

    if (rolePermissionRequestRef.current !== requestId) return

    if (result.data) {
      setSelectedPermissionIds(normalizePermissionIds(result.data))
    } else {
      message.error(result.error || "Error al obtener permisos del rol")
    }

    setLoadingRolePermissions(false)
  }

  const handleSelectRole = async (role) => {
    setSelectedRoleId(role.id)
    setSelectedRoleName(role.name)
    await loadRolePermissions(role.id)
  }

  const handleTogglePermission = (permissionId, checked) => {
    const id = Number(permissionId)

    setSelectedPermissionIds((current) => {
      if (checked) {
        return [...new Set([...current, id])]
      }

      return current.filter((currentId) => currentId !== id)
    })
  }

  const handleSelectCategory = (categoryPermissions) => {
    setSelectedPermissionIds((current) => [
      ...new Set([...current, ...categoryPermissions.map((permission) => Number(permission.id))])
    ])
  }

  const handleClearCategory = (categoryPermissions) => {
    const categoryIds = new Set(categoryPermissions.map((permission) => Number(permission.id)))
    setSelectedPermissionIds((current) => current.filter((id) => !categoryIds.has(id)))
  }

  const handleSavePermissions = async () => {
    if (!selectedRoleId) {
      message.warning("Debe seleccionar un rol")
      return
    }

    const roleIdToSave = selectedRoleId
    const permissionIdsToSave = normalizePermissionIds(selectedPermissionIds)

    setSaving(true)

    try {
      const result = await updateRolePermissions({
        roleId: roleIdToSave,
        permissionIds: permissionIdsToSave
      })

      if (result.success) {
        await loadRolePermissions(roleIdToSave)
        message.success("Permisos actualizados correctamente")
      } else {
        message.error(result.error || "Error al actualizar permisos")
      }
    } finally {
      setSaving(false)
    }
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
            ? user.roleNames.map((roleName) => (
              <Tag key={roleName}>{formatRoleName(roleName)}</Tag>
            ))
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
                onClick={() => handleSelectRole(role)}
                style={{
                  cursor: "pointer",
                  padding: "12px",
                  borderRadius: 8,
                  background: selectedRoleId === role.id ? "#e6f4ff" : "transparent"
                }}
              >
                <Text strong={selectedRoleId === role.id}>{formatRoleName(role.name)}</Text>
              </List.Item>
            )}
          />
        </Card>
      </Col>
      <Col xs={24} lg={17}>
        <Card
          title={selectedRoleName ? `Permisos del rol: ${formatRoleName(selectedRoleName)}` : "Permisos del rol"}
          extra={
            <Button
              type="primary"
              loading={saving}
              onClick={handleSavePermissions}
              disabled={!selectedRoleId || loadingRolePermissions || saving}
            >
              Guardar cambios
            </Button>
          }
        >
          {!selectedRoleId ? (
            <Empty description="Seleccione un rol" />
          ) : permissions.length === 0 ? (
            <Empty description="No hay permisos registrados" />
          ) : (
            <Spin spinning={loadingRolePermissions}>
              <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 8 }}>
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                {groupedPermissions.map(([category, categoryPermissions]) => (
                  <Card
                    key={category}
                    size="small"
                    title={category}
                    extra={
                      <Space>
                        <Button
                          size="small"
                          disabled={loadingRolePermissions}
                          onClick={() => handleSelectCategory(categoryPermissions)}
                        >
                          Seleccionar todos
                        </Button>
                        <Button
                          size="small"
                          disabled={loadingRolePermissions}
                          onClick={() => handleClearCategory(categoryPermissions)}
                        >
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
                            checked={selectedPermissionIds.includes(Number(permission.id))}
                            disabled={loadingRolePermissions}
                            onChange={(event) => handleTogglePermission(permission.id, event.target.checked)}
                          >
                            <Space size={8} wrap>
                              <Text>{permission.nombre}</Text>
                              {workflowPermission && (
                                <Tag color={getWorkflowSectionColor(workflowSection)}>
                                  {workflowSection}
                                </Tag>
                              )}
                            </Space>
                          </Checkbox>
                        )
                      })}
                    </Space>
                    <div style={categoryFooterStyle}>
                      <Button
                        type="primary"
                        loading={saving}
                        disabled={!selectedRoleId || loadingRolePermissions || saving}
                        onClick={handleSavePermissions}
                      >
                        Guardar cambios
                      </Button>
                    </div>
                  </Card>
                ))}
              </Space>
              </div>
            </Spin>
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
            label: formatRoleName(role.name)
          }))}
        />
      </Modal>
    </div>
  )
}

export default PermissionsManagement

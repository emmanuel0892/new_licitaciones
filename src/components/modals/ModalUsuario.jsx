"use client"

import { useState, useImperativeHandle, forwardRef } from "react"
import { Modal, Form, Input, Select, Alert, Space, Typography, App, Skeleton } from "antd"
import { CheckOutlined, CloseOutlined } from "@ant-design/icons"
import { validateRut, formatRut } from "rutlib"
import { createUser, updateUser, getUserById, getRoles } from "@/actions/users"
import { DEPARTAMENTOS } from "@/lib/helpers"

const { Text } = Typography

const ROLE_LABELS = {
  requirente: "Requirente",
  coordinador_licitacion: "Coordinador Licitacion",
  jefe_compras: "Jefe Compras",
  jefe_adquisiciones: "Jefe Adquisiciones",
  abogado: "Abogado",
  jefe_unidad_legal: "Jefe Unidad Legal",
  secretaria_legal: "Secretaria Legal",
  secretaria_adquisiciones: "Secretaria Adquisiciones",
  subdirector_administrativo: "Subdirector Administrativo",
  secretaria_subdireccion: "Secretaria Subdireccion",
  director: "Director",
  secretaria_direccion: "Secretaria Direccion",
  oficina_partes: "Oficina de Partes",
  jefe_presupuesto: "Jefe Presupuesto",
  analista_presupuesto: "Analista Presupuesto",
  visor: "Visor"
}

const formatRoleLabel = (roleName = "") => {
  if (ROLE_LABELS[roleName]) {
    return ROLE_LABELS[roleName]
  }

  return roleName
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

const ModalUsuario = forwardRef(({ onSuccess }, ref) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [userId, setUserId] = useState(null)
  const [rutValid, setRutValid] = useState(true)
  const [roleOptions, setRoleOptions] = useState([])

  const [passwordReqs, setPasswordReqs] = useState({
    length: false,
    upperLower: false,
    numbers: false,
    symbols: false
  })

  useImperativeHandle(ref, () => ({
    open: async (id, action) => {
      setOpen(true)
      form.resetFields()
      setPasswordReqs({ length: false, upperLower: false, numbers: false, symbols: false })
      setRutValid(true)
      setLoadingData(true)

      const rolesResult = await getRoles()
      if (rolesResult.data) {
        setRoleOptions(
          rolesResult.data.map((role) => ({
            label: formatRoleLabel(role.name),
            value: role.id
          }))
        )
      } else {
        setRoleOptions([])
      }

      if (action === "edit" && id) {
        setIsEdit(true)
        setUserId(id)
        const result = await getUserById(id)
        if (result.data) {
          form.setFieldsValue({
            name: result.data.name,
            lastname: result.data.lastname,
            rut: result.data.rut,
            email: result.data.email,
            roleId: result.data.roleId || undefined,
            departamento: result.data.departamento
          })
        }
      } else {
        setIsEdit(false)
        setUserId(null)
      }

      setLoadingData(false)
    }
  }))

  const handleRutChange = (e) => {
    let rawRut = e.target.value
    const formatted = formatRut(rawRut, false)
    form.setFieldValue("rut", formatted)

    if (formatted.length < 8) {
      setRutValid(false)
    } else {
      setRutValid(validateRut(formatted))
    }
  }

  const handlePasswordChange = (e) => {
    const password = e.target.value

    setPasswordReqs({
      length: password.length >= 6,
      upperLower: password !== password.toUpperCase() && password !== password.toLowerCase(),
      numbers: /[0-9]/.test(password),
      symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    })
  }

  const handleSubmit = async (values) => {
    if (!isEdit && !rutValid) {
      message.error("Ingrese un RUT válido")
      return
    }

    if (!isEdit) {
      const { length, upperLower, numbers, symbols } = passwordReqs
      if (!length || !upperLower || !numbers || !symbols) {
        message.error("La contraseña no cumple con los requisitos")
        return
      }
    }

    setLoading(true)

    let result
    if (isEdit) {
      result = await updateUser(userId, {
        name: values.name,
        lastname: values.lastname,
        roleId: values.roleId,
        departamento: values.departamento,
        password: values.password || ""
      })
    } else {
      result = await createUser(values)
    }

    if (result.success) {
      message.success(isEdit ? "Usuario actualizado correctamente" : "Usuario creado correctamente")
      setOpen(false)
      form.resetFields()
      onSuccess?.()
    } else {
      message.error(result.error || "Error al guardar el usuario")
    }

    setLoading(false)
  }

  const PasswordRequirement = ({ met, text }) => (
    <Space size="small">
      {met ? (
        <CheckOutlined style={{ color: "#268e00" }} />
      ) : (
        <CloseOutlined style={{ color: "#e53935" }} />
      )}
      <Text type={met ? "success" : "danger"}>{text}</Text>
    </Space>
  )

  return (
    <Modal
      title={isEdit ? "Editar Usuario" : "Crear Usuario"}
      open={open}
      onCancel={() => setOpen(false)}
      onOk={() => form.submit()}
      okText={isEdit ? "Actualizar" : "Crear"}
      cancelText="Cancelar"
      confirmLoading={loading}
      width={500}
      destroyOnHidden
    >
      {loadingData ? (
        <Space direction="vertical" style={{ width: "100%" }}>
          <Skeleton.Input active style={{ width: "100%" }} />
          <Skeleton.Input active style={{ width: "100%" }} />
          <Skeleton.Input active style={{ width: "100%" }} />
          <Skeleton.Input active style={{ width: "100%" }} />
        </Space>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="Nombre"
            rules={[{ required: true, message: "Ingrese el nombre" }]}
          >
            <Input placeholder="Ingresa nombre" />
          </Form.Item>

          <Form.Item
            name="lastname"
            label="Apellido"
            rules={[{ required: true, message: "Ingrese el apellido" }]}
          >
            <Input placeholder="Ingresa apellido" />
          </Form.Item>

          <Form.Item
            name="rut"
            label="RUT"
            rules={[{ required: !isEdit, message: "Ingrese el RUT" }]}
          >
            <Input
              placeholder="12.345.678-9"
              onChange={handleRutChange}
              disabled={isEdit}
              maxLength={12}
            />
          </Form.Item>

          {!rutValid && (
            <Alert
              message="RUT inválido"
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Form.Item
            name="email"
            label="Correo Electrónico"
            rules={[
              { required: !isEdit, message: "Ingrese el correo" },
              { type: "email", message: "Ingrese un correo válido" }
            ]}
          >
            <Input placeholder="correo@ejemplo.com" disabled={isEdit} />
          </Form.Item>

          <Form.Item
            name="departamento"
            label="Departamento"
            rules={[{ required: true, message: "Seleccione un departamento" }]}
          >
            <Select
              placeholder="Seleccione un departamento"
              options={DEPARTAMENTOS}
            />
          </Form.Item>

          <Form.Item
            name="roleId"
            label="Rol"
            rules={[{ required: true, message: "Debe seleccionar al menos un rol" }]}
          >
            <Select
              placeholder="Seleccione un rol"
              options={roleOptions}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={isEdit ? "Nueva Contraseña (opcional)" : "Contraseña"}
            rules={[{ required: !isEdit, message: "Ingrese la contraseña" }]}
          >
            <Input.Password
              placeholder="Ingresa contraseña"
              onChange={handlePasswordChange}
            />
          </Form.Item>

          {!isEdit && (
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                Requisitos de contraseña:
              </Text>
              <Space direction="vertical" size="small">
                <PasswordRequirement met={passwordReqs.length} text="Mínimo 6 caracteres" />
                <PasswordRequirement met={passwordReqs.upperLower} text="Mayúsculas y minúsculas" />
                <PasswordRequirement met={passwordReqs.numbers} text="Al menos un número" />
                <PasswordRequirement met={passwordReqs.symbols} text="Al menos un símbolo (@#$%)" />
              </Space>
            </div>
          )}
        </Form>
      )}
    </Modal>
  )
})

ModalUsuario.displayName = "ModalUsuario"

export default ModalUsuario

"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Layout, Menu, Avatar, Typography, Dropdown, Space, Button } from "antd"
import {
  DashboardOutlined,
  FileTextOutlined,
  InboxOutlined,
  FolderOutlined,
  PlusCircleOutlined,
  UserOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShoppingCartOutlined,
  CalendarOutlined,
  FileSearchOutlined,
  PieChartOutlined,
  EditOutlined,
  FormOutlined,
  SafetyCertificateOutlined
} from "@ant-design/icons"
import { useSession } from "next-auth/react"
import { logoutAction } from "@/actions/auth"
import NotificacionesAlertas from "./NotificacionesAlertas"
import styles from "./Sidebar.module.css"

const { Sider, Header, Content } = Layout
const { Text } = Typography

const Sidebar = ({ children, permissions = [], isSuperAdmin = false }) => {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()

  const user = session?.user
  const userType = user?.typeAccount
  const can = (permissionCode) => {
    return isSuperAdmin || permissions.includes(permissionCode)
  }

  const handleLogout = async () => {
    try { sessionStorage.removeItem("alertas-popup-shown") } catch {}
    await logoutAction()
    router.push("/login")
    router.refresh()
  }

  const getMenuItems = () => {
    const items = []
    const canShowCrearNuevoProceso =
      can("sidebar.licitaciones.crear") &&
      can("licitacion.crear")
    const canShowGestionNovedades =
      can("sidebar.gestion_novedades") &&
      can("novedades.ver")
    const canShowGestionPermisos =
      can("sidebar.gestion_permisos") &&
      can("roles.gestionar")
    const canShowLicitacionesGroup =
      can("sidebar.licitaciones") ||
      canShowCrearNuevoProceso ||
      can("sidebar.licitaciones.mis_licitaciones") ||
      can("sidebar.licitaciones.todas")

    if (can("sidebar.inicio")) {
      items.push({
        key: "/dashboard",
        icon: <DashboardOutlined />,
        label: "Inicio"
      })
    }

    if (can("sidebar.novedades")) {
      items.push({
        key: "/dashboard/novedades",
        icon: <BellOutlined />,
        label: "Novedades"
      })
    }

    if (canShowLicitacionesGroup) {
      items.push({
        key: "licitaciones",
        icon: <FileTextOutlined />,
        label: "Licitaciones",
        children: [
          ...(canShowCrearNuevoProceso ? [{
            key: "/dashboard/licitaciones/crear",
            icon: <PlusCircleOutlined />,
            label: "Crear Nuevo Proceso"
          }] : []),
          ...(can("sidebar.licitaciones.mis_licitaciones") ? [{
            key: "/dashboard/licitaciones/mis-licitaciones",
            icon: <FolderOutlined />,
            label: "Mis Licitaciones"
          }] : []),
          ...(can("sidebar.licitaciones.todas") ? [{
            key: "/dashboard/licitaciones/todas",
            icon: <FileSearchOutlined />,
            label: "Todas las Licitaciones"
          }] : [])
        ]
      })
    }

    if (can("sidebar.bandeja")) {
      items.push({
        key: "/dashboard/licitaciones/bandeja",
        icon: <InboxOutlined />,
        label: "Bandeja de Entrada"
      })
    }

    if (can("sidebar.seguimiento_consumo")) {
      items.push({
        key: "/dashboard/consumo",
        icon: <PieChartOutlined />,
        label: "Seguimiento Consumo"
      })
    }

    if (can("sidebar.formato_bases")) {
      items.push({
        key: "/dashboard/formato-bases",
        icon: <FolderOutlined />,
        label: "Formato Bases"
      })
    }

    if (can("sidebar.usuarios")) {
      items.push(
        {
          key: "/dashboard/usuarios",
          icon: <UserOutlined />,
          label: "Usuarios"
        }
      )
    }

    if (canShowGestionNovedades) {
      items.push(
        {
          key: "/dashboard/novedades/gestion",
          icon: <SettingOutlined />,
          label: "Gestión Novedades"
        }
      )
    }

    if (canShowGestionPermisos) {
      items.push({
        key: "/dashboard/permisos",
        icon: <SafetyCertificateOutlined />,
        label: "Gestión de Permisos"
      })
    }

    return items
  }

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Mi Perfil"
    },
    {
      type: "divider"
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Cerrar Sesión",
      danger: true,
      onClick: handleLogout
    }
  ]

  const handleMenuClick = ({ key }) => {
    if (key !== "logout" && key !== "profile") {
      router.push(key)
    }
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        className={styles.sider}
        theme="light"
      >
        <div className={styles.logoContainer}>
          <div onClick={() => router.push("/dashboard")} style={{ cursor: "pointer" }}>
            <img src="/logoHRR.png" alt="Logo HRR" style={{ width: 220, height: "auto", objectFit: "contain", padding: "20px 0" }} />
          </div>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          defaultOpenKeys={[]}
          items={getMenuItems()}
          onClick={handleMenuClick}
          className={styles.menu}
        />
      </Sider>

      <Layout>
        <Header className={styles.header}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className={styles.collapseButton}
          />

          <div className={styles.headerRight}>
            <NotificacionesAlertas />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space className={styles.userInfo}>
                <Avatar
                  style={{ backgroundColor: "#23aeaa" }}
                  icon={<UserOutlined />}
                />
                {user && (
                  <div className={styles.userDetails}>
                    <Text strong>{user.name} {user.lastname}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{userType}</Text>
                  </div>
                )}
              </Space>
            </Dropdown>
          </div>
        </Header>

        <Content className={styles.content}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default Sidebar

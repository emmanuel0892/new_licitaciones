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
  PieChartOutlined
} from "@ant-design/icons"
import { useSession } from "next-auth/react"
import { logoutAction } from "@/actions/auth"
import { ROLES } from "@/lib/helpers"
import styles from "./Sidebar.module.css"

const { Sider, Header, Content } = Layout
const { Text } = Typography

const Sidebar = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()

  const user = session?.user
  const userType = user?.typeAccount

  const handleLogout = async () => {
    await logoutAction()
    router.push("/login")
    router.refresh()
  }

  const getMenuItems = () => {
    const items = [
      {
        key: "/dashboard",
        icon: <DashboardOutlined />,
        label: "Inicio",
        roles: "all"
      },
      {
        key: "/dashboard/novedades",
        icon: <BellOutlined />,
        label: "Novedades",
        roles: "all"
      }
    ]

    if (userType === ROLES.SUPER_ADMIN || userType === ROLES.LICITADOR) {
      items.push({
        key: "licitaciones",
        icon: <FileTextOutlined />,
        label: "Licitaciones",
        children: [
          {
            key: "/dashboard/licitaciones/crear",
            icon: <PlusCircleOutlined />,
            label: "Crear Licitación"
          },
          {
            key: "/dashboard/licitaciones/mis-licitaciones",
            icon: <FolderOutlined />,
            label: "Mis Licitaciones"
          },
          ...(userType === ROLES.SUPER_ADMIN ? [
            {
              key: "/dashboard/licitaciones/todas",
              icon: <FileSearchOutlined />,
              label: "Todas las Licitaciones"
            }
          ] : [])
        ]
      })
    }

    if (
      userType === ROLES.SUPER_ADMIN ||
      userType === ROLES.LICITADOR ||
      userType === ROLES.SECRETARIO_JURIDICO ||
      userType === ROLES.PRESUPUESTO ||
      userType === ROLES.SUBDIRECCION_ADMINISTRATIVA
    ) {
      items.push({
        key: "/dashboard/licitaciones/bandeja",
        icon: <InboxOutlined />,
        label: "Bandeja de Entrada"
      })
    }

    if (userType === ROLES.SUPER_ADMIN || userType === ROLES.LICITADOR) {
      items.push({
        key: "/dashboard/consumo",
        icon: <PieChartOutlined />,
        label: "Seguimiento Consumo"
      })
    }

    if (userType === ROLES.SUPER_ADMIN || userType === ROLES.SECRETARIA_ABASTECIMIENTO) {
      items.push(
        {
          key: "pac",
          icon: <CalendarOutlined />,
          label: "Plan de Compras",
          children: [
            {
              key: "/dashboard/pac",
              icon: <CalendarOutlined />,
              label: "PAC"
            },
            {
              key: "/dashboard/pac/consolidado",
              icon: <FileSearchOutlined />,
              label: "Consolidado PAC"
            }
          ]
        },
        {
          key: "/dashboard/requerimientos",
          icon: <ShoppingCartOutlined />,
          label: "Requerimientos"
        }
      )
    }

    items.push({
      key: "/dashboard/formato-bases",
      icon: <FolderOutlined />,
      label: "Formato Bases",
      roles: "all"
    })

    if (userType === ROLES.SUPER_ADMIN) {
      items.push(
        {
          key: "/dashboard/usuarios",
          icon: <UserOutlined />,
          label: "Usuarios"
        },
        {
          key: "/dashboard/novedades/gestion",
          icon: <SettingOutlined />,
          label: "Gestión Novedades"
        }
      )
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
          defaultOpenKeys={["licitaciones", "pac"]}
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

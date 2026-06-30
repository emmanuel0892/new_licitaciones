// Paleta institucional Hospital Dr. Franco Ravera Zunino
// Verde base del logo: #93C01F  ·  Teal complementario: #23AEAA
const brand = "#93C01F"
const brandHover = "#7da91a"
const brandActive = "#6f9417"
const brandSoft = "rgba(147, 192, 31, 0.10)"
const brandSoftHover = "rgba(147, 192, 31, 0.16)"
const teal = "#23AEAA"

const theme = {
  token: {
    colorPrimary: brand,
    colorLink: brand,
    colorLinkHover: brandHover,
    colorInfo: teal,
    borderRadius: 8,
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
  },
  components: {
    Layout: {
      headerBg: "#ffffff",
      bodyBg: "#f6f8f1",
      siderBg: "#ffffff"
    },
    Button: {
      colorPrimary: brand,
      colorPrimaryHover: brandHover,
      colorPrimaryActive: brandActive,
      primaryShadow: "0 2px 6px rgba(147, 192, 31, 0.30)",
      algorithm: true
    },
    Menu: {
      colorPrimary: brand,
      itemSelectedBg: brandSoft,
      itemSelectedColor: brandActive,
      itemHoverBg: brandSoftHover,
      itemHoverColor: brandActive,
      itemActiveBg: brandSoftHover,
      itemBorderRadius: 10,
      itemMarginInline: 8,
      iconSize: 18
    },
    Table: {
      headerBg: "#f6f8f1",
      headerColor: "#1f2937",
      rowHoverBg: brandSoft
    },
    Card: {
      headerBg: "#ffffff",
      borderRadiusLG: 14,
      boxShadowTertiary: "0 2px 10px rgba(20, 40, 0, 0.05)"
    },
    Input: {
      activeBorderColor: brand,
      hoverBorderColor: brand,
      activeShadow: "0 0 0 2px rgba(147, 192, 31, 0.15)"
    },
    Select: {
      optionSelectedBg: brandSoft,
      optionActiveBg: brandSoftHover
    },
    DatePicker: {
      activeBorderColor: brand
    },
    Tabs: {
      inkBarColor: brand,
      itemSelectedColor: brandActive,
      itemHoverColor: brandHover
    },
    Badge: {
      colorPrimary: brand
    },
    Timeline: {
      dotBg: brand,
      tailColor: "rgba(147, 192, 31, 0.25)"
    },
    Switch: {
      colorPrimary: brand,
      colorPrimaryHover: brandHover
    },
    Radio: {
      colorPrimary: brand
    },
    Pagination: {
      colorPrimary: brand,
      colorPrimaryHover: brandHover
    },
    Steps: {
      colorPrimary: brand
    },
    Progress: {
      defaultColor: brand
    }
  }
}

export default theme

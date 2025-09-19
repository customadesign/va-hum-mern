import { theme } from 'antd';

// Custom theme configuration for Linkage VA Hub Admin Panel
export const customTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    // Primary colors - Modern gradient theme
    colorPrimary: '#667eea',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#667eea',
    
    // Layout colors
    colorBgBase: '#ffffff',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f8fafc',
    
    // Text colors
    colorTextBase: '#1e293b',
    colorText: '#1e293b',
    colorTextSecondary: '#64748b',
    colorTextTertiary: '#94a3b8',
    colorTextQuaternary: '#cbd5e1',
    
    // Border colors
    colorBorder: '#e2e8f0',
    colorBorderSecondary: '#f1f5f9',
    
    // Font
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    
    // Border radius
    borderRadius: 10,
    borderRadiusLG: 16,
    borderRadiusSM: 6,
    
    // Box shadow
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.05)',
    boxShadowSecondary: '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
    
    // Layout
    layoutHeaderHeight: 64,
    layoutSiderWidth: 256,
    layoutSiderCollapsedWidth: 80,
    
    // Component specific
    controlHeight: 44,
    controlHeightLG: 52,
    controlHeightSM: 36,
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#ffffff',
      bodyBg: '#f8fafc',
      headerPadding: '0 24px',
      headerHeight: 64,
    },
    Menu: {
      itemBg: '#ffffff',
      itemSelectedBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      itemHoverBg: '#f8fafc',
      itemActiveBg: '#f1f5f9',
      itemColor: '#64748b',
      itemSelectedColor: '#ffffff',
      itemHoverColor: '#667eea',
      itemPadding: '8px 16px',
      itemMarginBlock: 4,
      itemMarginInline: 8,
      itemBorderRadius: 10,
    },
    Card: {
      headerBg: '#ffffff',
      bodyPadding: 24,
      borderRadiusLG: 16,
      boxShadowTertiary: '0 4px 20px rgba(0, 0, 0, 0.08)',
      headerPadding: '20px 24px',
    },
    Table: {
      headerBg: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      headerColor: '#374151',
      rowHoverBg: '#f8fafc',
      borderRadiusLG: 12,
      cellPaddingBlock: 16,
      cellPaddingInline: 16,
    },
    Button: {
      borderRadius: 10,
      controlHeight: 44,
      fontWeight: 500,
      paddingInline: 24,
      primaryShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
    },
    Input: {
      borderRadius: 10,
      controlHeight: 44,
      paddingInline: 16,
      borderWidth: 2,
      activeBorderColor: '#667eea',
      hoverBorderColor: '#a5b4fc',
    },
    Select: {
      borderRadius: 10,
      controlHeight: 44,
      borderWidth: 2,
      activeBorderColor: '#667eea',
      hoverBorderColor: '#a5b4fc',
    },
    DatePicker: {
      borderRadius: 10,
      controlHeight: 44,
      borderWidth: 2,
      activeBorderColor: '#667eea',
      hoverBorderColor: '#a5b4fc',
    },
    Modal: {
      borderRadiusLG: 16,
      headerBg: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      contentBg: '#ffffff',
      titleFontSize: 18,
      titleFontWeight: 600,
      titleColor: '#1e293b',
    },
    Statistic: {
      titleFontSize: 14,
      titleFontWeight: 500,
      contentFontSize: 24,
      contentFontWeight: 700,
    },
    Notification: {
      borderRadiusLG: 12,
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    },
    Badge: {
      indicatorHeight: 16,
      indicatorHeightSM: 14,
      dotSize: 6,
      textFontSize: 10,
      textFontSizeSM: 10,
    },
  },
};

// Dark theme variant
export const darkTheme = {
  ...customTheme,
  algorithm: theme.darkAlgorithm,
  token: {
    ...customTheme.token,
    // Base colors - match CSS variables for consistency
    colorBgBase: '#0f0f0f',
    colorBgContainer: '#1a1a1a',
    colorBgElevated: '#1f1f1f', 
    colorBgLayout: '#0f0f0f',
    colorBgSpotlight: '#1a1a1a',

    // Text colors - improved contrast and readability
    colorTextBase: '#ffffff',
    colorText: '#ffffff',
    colorTextSecondary: '#b8b8b8',
    colorTextTertiary: '#8c8c8c',
    colorTextQuaternary: '#666666',
    colorTextDescription: '#a0a0a0',

    // Border colors - subtle but visible
    colorBorder: '#333333',
    colorBorderSecondary: '#404040',
    colorBorderBg: '#262626',
    colorSplit: '#333333',

    // Fill colors for various states
    colorFill: '#262626',
    colorFillSecondary: '#333333',
    colorFillTertiary: '#404040',
    colorFillQuaternary: '#4a4a4a',

    // Interactive colors
    colorPrimaryBg: '#1a1a1a',
    colorPrimaryBgHover: '#262626',
    colorPrimaryBorder: '#40a9ff',
    colorPrimaryBorderHover: '#69c0ff',
    colorPrimaryHover: '#40a9ff',
    colorPrimaryActive: '#096dd9',

    // Success, warning, error colors (slightly adjusted for dark theme)
    colorSuccessBg: '#162312',
    colorSuccessBorder: '#52c41a',
    colorWarningBg: '#2b2111',
    colorWarningBorder: '#faad14',
    colorErrorBg: '#2a1215',
    colorErrorBorder: '#ff4d4f',
    colorInfoBg: '#111a2c',
    colorInfoBorder: '#13c2c2',

    // Component specific colors
    colorIcon: '#b8b8b8',
    colorIconHover: '#ffffff',

    // Shadow colors
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)',
    boxShadowSecondary: '0 8px 24px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.25)',
  },
  components: {
    ...customTheme.components,

    // Layout components - match CSS variables
    Layout: {
      headerBg: '#1a1a1a', // --bg-primary
      siderBg: '#1a1a1a',  // --bg-primary
      bodyBg: '#0f0f0f',   // --bg-layout
      headerPadding: '0 24px',
      headerHeight: 64,
      siderWidth: 256,
      siderCollapsedWidth: 80,
    },

    // Menu - comprehensive dark theming
    Menu: {
      darkItemBg: '#1a1a1a',
      darkItemColor: '#b8b8b8',
      darkItemSelectedBg: '#40a9ff',
      darkItemSelectedColor: '#ffffff',
      darkItemHoverBg: '#262626',
      darkItemHoverColor: '#ffffff',
      darkItemActiveBg: '#333333',
      darkSubMenuItemBg: '#1a1a1a',
      darkGroupTitleColor: '#8c8c8c',
      itemBg: '#1a1a1a',
      itemColor: '#b8b8b8',
      itemSelectedBg: '#40a9ff',
      itemSelectedColor: '#ffffff',
      itemHoverBg: '#262626',
      itemHoverColor: '#ffffff',
      itemPadding: '8px 16px',
      itemMarginBlock: 4,
      itemMarginInline: 8,
      itemBorderRadius: 10,
    },

    // Card - dark theme optimized
    Card: {
      headerBg: '#262626',
      bodyBg: '#1a1a1a',
      bodyPadding: 24,
      borderRadiusLG: 16,
      boxShadowTertiary: '0 4px 20px rgba(0, 0, 0, 0.3)',
      headerPadding: '20px 24px',
      colorBorderSecondary: '#333333',
    },

    // Table - comprehensive dark theming
    Table: {
      headerBg: '#262626',
      headerColor: '#ffffff',
      headerSplitColor: '#404040',
      rowHoverBg: '#262626',
      borderRadiusLG: 12,
      cellPaddingBlock: 16,
      cellPaddingInline: 16,
      colorBorderSecondary: '#333333',
      bodySortBg: '#1a1a1a',
      filterDropdownBg: '#1a1a1a',
      filterDropdownMenuBg: '#262626',
      expandIconBg: '#1a1a1a',
    },

    // Button - dark theme variants
    Button: {
      borderRadius: 10,
      controlHeight: 44,
      fontWeight: 500,
      paddingInline: 24,
      primaryShadow: '0 4px 12px rgba(64, 169, 255, 0.3)',
      colorPrimary: '#40a9ff',
      colorPrimaryHover: '#69c0ff',
      colorPrimaryActive: '#096dd9',
      colorBgContainer: '#1a1a1a',
      colorBorder: '#404040',
      colorText: '#b8b8b8',
      defaultBg: '#262626',
      defaultBorderColor: '#404040',
      defaultColor: '#b8b8b8',
      defaultHoverBg: '#333333',
      defaultHoverBorderColor: '#555555',
      defaultHoverColor: '#ffffff',
    },

    // Input - dark theme optimized
    Input: {
      borderRadius: 10,
      controlHeight: 44,
      paddingInline: 16,
      borderWidth: 2,
      activeBorderColor: '#40a9ff',
      hoverBorderColor: '#69c0ff',
      colorBgContainer: '#1a1a1a',
      colorBorder: '#404040',
      colorText: '#ffffff',
      colorTextPlaceholder: '#8c8c8c',
      colorBgContainerDisabled: '#262626',
    },

    // Select - dark theme optimized
    Select: {
      borderRadius: 10,
      controlHeight: 44,
      borderWidth: 2,
      activeBorderColor: '#40a9ff',
      hoverBorderColor: '#69c0ff',
      colorBgContainer: '#1a1a1a',
      colorBgElevated: '#262626',
      colorBorder: '#404040',
      colorText: '#ffffff',
      colorTextPlaceholder: '#8c8c8c',
      optionSelectedBg: '#40a9ff',
      optionSelectedColor: '#ffffff',
      optionActiveBg: '#333333',
    },

    // DatePicker - dark theme optimized
    DatePicker: {
      borderRadius: 10,
      controlHeight: 44,
      borderWidth: 2,
      activeBorderColor: '#40a9ff',
      hoverBorderColor: '#69c0ff',
      colorBgContainer: '#1a1a1a',
      colorBgElevated: '#262626',
      colorBorder: '#404040',
      colorText: '#ffffff',
      cellHoverBg: '#333333',
      cellActiveWithRangeBg: '#40a9ff',
      cellRangeBorderColor: '#69c0ff',
    },

    // Modal - dark theme optimized
    Modal: {
      borderRadiusLG: 16,
      headerBg: '#262626',
      contentBg: '#1a1a1a',
      titleFontSize: 18,
      titleFontWeight: 600,
      titleColor: '#ffffff',
      colorText: '#b8b8b8',
      colorTextDescription: '#a0a0a0',
    },

    // Statistic - dark theme optimized
    Statistic: {
      titleFontSize: 14,
      titleFontWeight: 500,
      contentFontSize: 24,
      contentFontWeight: 700,
      titleColor: '#b8b8b8',
      colorText: '#ffffff',
      colorTextDescription: '#a0a0a0',
    },

    // Notification - dark theme optimized
    Notification: {
      borderRadiusLG: 12,
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
      colorBgElevated: '#1a1a1a',
      colorText: '#ffffff',
      colorTextHeading: '#ffffff',
      colorIcon: '#b8b8b8',
    },

    // Badge - dark theme optimized with alignment fixes
    Badge: {
      colorBgContainer: '#40a9ff',
      colorText: '#ffffff',
      indicatorHeight: 16,
      indicatorHeightSM: 14,
      dotSize: 6,
      textFontSize: 10,
      textFontSizeSM: 10,
    },

    // Tag - dark theme optimized
    Tag: {
      colorBgContainer: '#262626',
      colorBorder: '#404040',
      colorText: '#b8b8b8',
      defaultBg: '#262626',
      defaultColor: '#b8b8b8',
    },

    // Tabs - dark theme optimized
    Tabs: {
      colorBgContainer: '#1a1a1a',
      colorBorderSecondary: '#333333',
      itemColor: '#b8b8b8',
      itemSelectedColor: '#ffffff',
      itemHoverColor: '#ffffff',
      inkBarColor: '#40a9ff',
      cardBg: '#262626',
    },

    // Pagination - dark theme optimized
    Pagination: {
      colorBgContainer: '#1a1a1a',
      colorBgTextHover: '#333333',
      colorBgTextActive: '#40a9ff',
      colorText: '#b8b8b8',
      colorPrimary: '#40a9ff',
      colorPrimaryHover: '#69c0ff',
    },

    // Dropdown - dark theme optimized
    Dropdown: {
      colorBgElevated: '#1a1a1a',
      colorText: '#b8b8b8',
      controlItemBgHover: '#262626',
    },

    // Tooltip - dark theme optimized
    Tooltip: {
      colorBgSpotlight: '#1a1a1a',
      colorTextLightSolid: '#ffffff',
      colorBgDefault: '#262626',
    },

    // Popover - dark theme optimized
    Popover: {
      colorBgElevated: '#1a1a1a',
      colorText: '#b8b8b8',
    },

    // Drawer - dark theme optimized
    Drawer: {
      colorBgElevated: '#1a1a1a',
      colorText: '#b8b8b8',
      colorBgMask: 'rgba(0, 0, 0, 0.6)',
    },

    // Form - dark theme optimized
    Form: {
      labelColor: '#b8b8b8',
      colorText: '#ffffff',
      colorTextSecondary: '#a0a0a0',
    },

    // Checkbox - dark theme optimized
    Checkbox: {
      colorBgContainer: '#1a1a1a',
      colorBorder: '#404040',
      colorPrimary: '#40a9ff',
      colorPrimaryHover: '#69c0ff',
      colorText: '#b8b8b8',
    },

    // Radio - dark theme optimized
    Radio: {
      colorBgContainer: '#1a1a1a',
      colorBorder: '#404040',
      colorPrimary: '#40a9ff',
      colorPrimaryHover: '#69c0ff',
      colorText: '#b8b8b8',
      buttonBg: '#262626',
      buttonColor: '#b8b8b8',
      buttonCheckedBg: '#40a9ff',
      buttonCheckedColor: '#ffffff',
    },

    // Switch - dark theme optimized
    Switch: {
      colorPrimary: '#40a9ff',
      colorPrimaryHover: '#69c0ff',
      colorTextQuaternary: '#8c8c8c',
      colorTextTertiary: '#a0a0a0',
      colorBgContainer: '#404040',
    },

    // Slider - dark theme optimized
    Slider: {
      colorPrimary: '#40a9ff',
      colorPrimaryBorder: '#69c0ff',
      colorBgElevated: '#1a1a1a',
      trackBg: '#404040',
      trackBgDisabled: '#262626',
      handleColor: '#40a9ff',
      handleShadow: '0 2px 8px rgba(64, 169, 255, 0.3)',
    },

    // Progress - dark theme optimized
    Progress: {
      colorBgContainer: '#262626',
      colorFillSecondary: '#40a9ff',
      colorText: '#b8b8b8',
    },

    // Spin - dark theme optimized
    Spin: {
      colorBgContainer: '#1a1a1a',
      colorPrimary: '#40a9ff',
    },

    // Skeleton - dark theme optimized
    Skeleton: {
      colorBgContainer: '#262626',
      colorBgBone: '#333333',
    },

    // Empty - dark theme optimized
    Empty: {
      colorText: '#8c8c8c',
      colorTextDescription: '#a0a0a0',
    },

    // Divider - dark theme optimized
    Divider: {
      colorSplit: '#333333',
      colorText: '#8c8c8c',
      colorTextHeading: '#b8b8b8',
    },

    // Breadcrumb - dark theme optimized
    Breadcrumb: {
      colorBgContainer: '#1a1a1a',
      colorText: '#b8b8b8',
      colorTextDescription: '#a0a0a0',
      separatorColor: '#666666',
    },

    // Avatar - dark theme optimized
    Avatar: {
      colorBgContainer: '#404040',
      colorText: '#ffffff',
    },

    // Upload - dark theme optimized
    Upload: {
      colorBgContainer: '#1a1a1a',
      colorBorder: '#404040',
      colorText: '#b8b8b8',
      colorTextDescription: '#a0a0a0',
      colorFill: '#262626',
    },

    // Steps - dark theme optimized
    Steps: {
      colorBgContainer: '#1a1a1a',
      colorText: '#b8b8b8',
      colorTextDescription: '#a0a0a0',
      colorPrimary: '#40a9ff',
      colorSplit: '#333333',
    },

    // Result - dark theme optimized
    Result: {
      colorBgContainer: '#1a1a1a',
      colorText: '#ffffff',
      colorTextDescription: '#a0a0a0',
    },

    // Descriptions - dark theme optimized
    Descriptions: {
      colorBgContainer: '#1a1a1a',
      colorText: '#b8b8b8',
      colorTextSecondary: '#a0a0a0',
      colorSplit: '#333333',
    },

    // Alert - dark theme optimized
    Alert: {
      colorBgContainer: '#2b2111',
      colorBorder: '#faad14',
      colorText: '#ffffff',
      colorTextDescription: '#d4b574',
      colorSuccessBg: '#162312',
      colorSuccessBorder: '#52c41a',
      colorSuccessText: '#ffffff',
      colorWarningBg: '#2b2111',
      colorWarningBorder: '#faad14',
      colorWarningText: '#ffffff',
      colorErrorBg: '#2a1215',
      colorErrorBorder: '#ff4d4f',
      colorErrorText: '#ffffff',
      colorInfoBg: '#111a2c',
      colorInfoBorder: '#13c2c2',
      colorInfoText: '#ffffff',
    },

    // Message - dark theme optimized
    Message: {
      colorBgElevated: '#1a1a1a',
      colorText: '#ffffff',
      colorTextDescription: '#a0a0a0',
      colorSuccess: '#52c41a',
      colorWarning: '#faad14',
      colorError: '#ff4d4f',
      colorInfo: '#13c2c2',
    },

    // Typography - dark theme optimized
    Typography: {
      colorText: '#ffffff',
      colorTextSecondary: '#b8b8b8',
      colorTextTertiary: '#8c8c8c',
      colorTextHeading: '#ffffff',
      colorLink: '#40a9ff',
      colorLinkHover: '#69c0ff',
      colorLinkActive: '#096dd9',
    },

    // List - dark theme optimized
    List: {
      colorBgContainer: '#1a1a1a',
      colorBorder: '#333333',
      colorText: '#ffffff',
      colorTextDescription: '#a0a0a0',
    },

    // Collapse - dark theme optimized
    Collapse: {
      colorBgContainer: '#1a1a1a',
      colorBorder: '#333333',
      colorText: '#ffffff',
      colorTextHeading: '#ffffff',
      colorTextDescription: '#a0a0a0',
      colorFill: '#262626',
    },

    // Anchor - dark theme optimized
    Anchor: {
      colorBgContainer: '#1a1a1a',
      colorText: '#b8b8b8',
      colorPrimary: '#40a9ff',
    },

    // BackTop - dark theme optimized
    BackTop: {
      colorBgContainer: '#1a1a1a',
      colorText: '#b8b8b8',
    },

    // ConfigProvider - dark theme optimized
    ConfigProvider: {
      colorBgContainer: '#1a1a1a',
      colorBgElevated: '#262626',
      colorBgLayout: '#0a0a0a',
      colorBgMask: 'rgba(0, 0, 0, 0.6)',
      colorBgSpotlight: '#1a1a1a',
      colorBorder: '#333333',
      colorBorderSecondary: '#404040',
      colorText: '#ffffff',
      colorTextSecondary: '#b8b8b8',
      colorTextTertiary: '#8c8c8c',
      colorTextQuaternary: '#666666',
    },
  },
};

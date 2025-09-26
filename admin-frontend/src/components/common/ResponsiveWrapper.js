import React from 'react';
import { useMediaQuery } from 'react-responsive';
import { Drawer, Button } from 'antd';
import { MenuOutlined } from '@ant-design/icons';

const ResponsiveWrapper = ({ children, mobileMenuItems, onMobileMenuClick }) => {
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const [mobileMenuVisible, setMobileMenuVisible] = React.useState(false);

  const showMobileMenu = () => {
    setMobileMenuVisible(true);
  };

  const hideMobileMenu = () => {
    setMobileMenuVisible(false);
  };

  const handleMobileMenuClick = (item) => {
    onMobileMenuClick(item);
    hideMobileMenu();
  };

  if (isMobile) {
    return (
      <>
        {/* Mobile Header */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 64,
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1890ff' }}>
            Linkage VA Hub
          </div>
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={showMobileMenu}
            style={{ fontSize: 16 }}
          />
        </div>

        {/* Mobile Content */}
        <div style={{ marginTop: 64, padding: '16px' }}>
          {children}
        </div>

        {/* Mobile Menu Drawer */}
        <Drawer
          title="Menu"
          placement="right"
          onClose={hideMobileMenu}
          open={mobileMenuVisible}
          width={280}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mobileMenuItems?.map((item) => (
              <Button
                key={item.key}
                type="text"
                block
                style={{
                  textAlign: 'left',
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                }}
                onClick={() => handleMobileMenuClick(item)}
              >
                {item.icon}
                <span style={{ marginLeft: 12 }}>{item.label}</span>
              </Button>
            ))}
          </div>
        </Drawer>
      </>
    );
  }

  return children;
};

export default ResponsiveWrapper;

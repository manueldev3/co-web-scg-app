import { ConfigProvider, Layout, theme } from "antd";

const SCGLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#9ED0FA",
          colorBgContainer: "#0a1929",
          colorBgElevated: "#0f2c3e",
          colorBgLayout: "#061220",
          colorBorder: "#1e4a6e",
          colorBorderSecondary: "#143a52",
          borderRadius: 4,
        },
        components: {
          Layout: {
            headerBg: "#0F2C3E",
            bodyBg: "transparent",
          },
          Menu: {
            darkItemBg: "#0F2C3E",
            colorPrimary: "#143A52",
            darkItemHoverBg: "#143A52",
          },
          Table: {
            headerBg: "#0f2c3e",
            headerColor: "#9ED0FA",
            rowHoverBg: "#143a52",
            borderColor: "#1e4a6e",
            colorBgContainer: "#0a1929",
          },
          Card: {
            colorBgContainer: "#0a1929",
            colorBorderSecondary: "#1e4a6e",
          },
          Input: {
            colorBgContainer: "#0a1929",
            colorBorder: "#1e4a6e",
            colorText: "#ffffff",
            colorTextPlaceholder: "#4a6a80",
            activeBorderColor: "#9ED0FA",
            hoverBorderColor: "#4a9eda",
          },
          Tag: {
            defaultBg: "#143a52",
            defaultColor: "#9ED0FA",
          },
          Pagination: {
            colorBgContainer: "#143a52",
            colorBorder: "#1e4a6e",
            colorText: "#9ED0FA",
            colorPrimary: "#9ED0FA",
            colorPrimaryHover: "#bde0ff",
          },
        },
      }}
    >
      <Layout>{children}</Layout>
    </ConfigProvider>
  );
};

export default SCGLayout;

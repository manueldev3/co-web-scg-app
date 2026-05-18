import { ConfigProvider, Layout } from "antd";

const SCGLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#9ED0FA",
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
        },
      }}
    >
      <Layout>{children}</Layout>
    </ConfigProvider>
  );
};

export default SCGLayout;

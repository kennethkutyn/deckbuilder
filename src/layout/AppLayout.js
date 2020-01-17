import React from "react";
import { withRouter } from "react-router-dom";
import logo from "../logo.svg";

import { Layout, Menu, Typography, Steps } from "antd";

const { Header, Content } = Layout;
const { Title } = Typography;
const { Step } = Steps;

class AppLayout extends React.Component {
  state = {
    step: 0
  };

  render() {
    const username = this.props.username || "";
    const folderName = this.props.folderName || "";
    const pathname = this.props.location.pathname;

    return (
      <Layout className="app">
        <Header>
          <img
            alt=""
            className="logo"
            src={logo}
            style={{ height: 31, margin: "16px 24px 16px 0", float: "left" }}
          />
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={["1"]}
            style={{ lineHeight: "64px" }}
          >
            <Menu.Item key="1">DeckBuilder</Menu.Item>
          </Menu>
        </Header>
        <Content style={{ padding: "50px" }}>
          <div style={{ background: "#fff", padding: 24 }}>
            <Title level={2} style={{ marginBottom: 25 }}>
              Optimizely Deck Builder
            </Title>

            <Steps
              size="small"
              current={this.getCurrentStep(pathname)}
              style={{ marginBottom: 25 }}
            >
              <Step title="Login to Google" description={username} />
              <Step
                title="Choose folder"
                description={folderName ? folderName : ""}
              />
              <Step title="Configure Slides" />
              <Step title="Finish" />
            </Steps>

            {this.props.children}
          </div>
        </Content>
      </Layout>
    );
  }

  getCurrentStep(pathname) {
    if (pathname === "/choose-folder") {
      return 1;
    }

    if (pathname === "/deck-builder") {
      return 2;
    }

    if (pathname === "/success") {
      return 3;
    }

    return 0;
  }
}

export default withRouter(AppLayout);

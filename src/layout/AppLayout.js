import React from 'react';
import logo  from '../logo.svg'

import {
  Layout,
  Menu, 
  Typography, 
  Steps
} from 'antd';

const {Header, Content} = Layout;
const {Title}     = Typography;
const {Step}            = Steps;

class AppLayout extends React.Component {
  
  render() {
    const username    = this.props.username || "";
    const folderName  = this.props.folderName || "";

    return (
      <Layout className="app">
        <Header>
          <img alt="" className="logo" src={logo} style={{height: 31, margin: '16px 24px 16px 0', float: 'left'}} />
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={['1']}
            style={{ lineHeight: '64px' }}
          >
            <Menu.Item key="1">DeckBuilder</Menu.Item>
          </Menu>
        </Header>
        <Content style={{ padding: '50px' }}>
          <div style={{ background: '#fff', padding: 24 }}>

            <Title 
              level={2}
              style={{marginBottom: 25}}
            >Optimizely SE Deck Builder</Title>

            <Steps size="small" current={0} style={{marginBottom: 25}}>
              <Step title="Login to Google" description={username} />
              <Step title="Choose folder" description={folderName ? folderName : ""} />
              <Step title="Configure Slides" />
            </Steps>
            
            {this.props.children}
            
          </div>
        </Content>
      </Layout>
    );
  }

}

export default AppLayout;
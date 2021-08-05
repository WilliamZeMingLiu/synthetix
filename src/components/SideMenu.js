import './SideMenu.css';

import {
  NetworkInfo,
  WalletProvider,
} from '@terra-money/wallet-provider';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
} from "@apollo/client";

import React, { useState, useEffect } from 'react';

import { Layout, Menu, Button } from 'antd';
import { IdcardOutlined, SwapOutlined, SendOutlined, LoginOutlined, LogoutOutlined } from '@ant-design/icons';


export default function SideMenu(props) {
  const { SubMenu } = Menu;
  const { Header, Content, Footer, Sider } = Layout;

  const [ currKey, setCurrKey ] = useState('0');

  const handleChange = (key) => {
    props.selectTab(key);
    setCurrKey(key);
  } 

  return (
    <Sider
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
      }}
    >
      <div className="logo-container">
        <h2 onClick={() => handleChange('0')}>Synthetix</h2>
      </div>

      <Menu theme="dark" mode="inline" defaultSelectedKeys={['0']} selectedKeys={[currKey]}>
        <Menu.Item onClick={() => handleChange('1')} className="menu-item" key="1" icon={<IdcardOutlined />}>
          My Wallet
        </Menu.Item>
        <Menu.Item onClick={() => handleChange('2')} className="menu-item" key="2" icon={<SendOutlined />}>
          Send Coins
        </Menu.Item>
        <Menu.Item disabled onClick={() => handleChange('3')} className="menu-item" key="3" icon={<SwapOutlined />}>
          Swap Coins
        </Menu.Item>
        <Menu.Item onClick={() => handleChange('4')} className="menu-item" key="4" icon={<LoginOutlined />}>
          Buy Tokens
        </Menu.Item>
        <Menu.Item onClick={() => handleChange('5')} className="menu-item" key="5" icon={<LogoutOutlined />}>
          Sell Tokens
        </Menu.Item>
      </Menu>
    </Sider>
  );
}
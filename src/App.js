import './App.css';
import MainContent from './layout/MainContent/MainContent.js';
import SideMenu from './components/SideMenu.js';
import AppBar from './layout/AppBar/AppBar.js';
import React, { useState } from 'react';


import {
  NetworkInfo,
  WalletProvider
} from '@terra-money/wallet-provider';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
} from "@apollo/client";

import 'bootstrap/dist/css/bootstrap.min.css';
import 'antd/dist/antd.css';

import { Layout, Menu } from 'antd';

export default function App() {
  const { SubMenu } = Menu;
  const { Header, Content, Footer, Sider } = Layout;

  const [ currTab, setCurrTab ] = useState('0');

  /*
  // Terra mainnet
  const network = {
    name: 'mainnet',
    chainID: 'columbus-4',
    lcd: 'https://lcd.terra.dev',
  };

   // Local test network
  const network: NetworkInfo = {
    name: 'localterra',
    chainID: 'localterra',
    lcd: 'http://localhost:1317'
  }

  // Terra testnet
  

  */

  // <SideMenu selectTab={selectTab} />

  // Gql obj
  const mainUri = 'https://graph.mirror.finance/graphql'
  const testUri = 'https://tequila-graph.mirror.finance/graphql'

  const network: NetworkInfo = {
    name: 'testnet',
    chainID: 'tequila-0004',
    lcd: 'https://tequila-lcd.terra.dev',
  };
  
  const client = new ApolloClient({
    uri: testUri,
    cache: new InMemoryCache()
  });


  const selectTab = (currTab) => {
    setCurrTab(currTab)
  }

  return (
    <div className="App">
      <WalletProvider defaultNetwork={network}>
        <ApolloProvider client={client}>
          <Layout className="layout">
            <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
              <AppBar selectTab={selectTab} />
              <MainContent currTab={currTab} />
              <Footer style={{ textAlign: 'center' }}>Powered by Terra</Footer>
            </div>
          </Layout>
        </ApolloProvider>
      </WalletProvider>
    </div>
  );
}
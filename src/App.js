import './App.css';
import SideMenu from './components/SideMenu.js';
import AppBar from './components/AppBar/AppBar.js';
import Dashboard from './page/Dashboard/Dashboard.js';
import MyWallet from './page/MyWallet/MyWallet.js';
import SendTokens from './page/SendTokens/SendTokens.js';
import BuyTokens from './page/BuyTokens/BuyTokens.js';
import SellTokens from './page/SellTokens/SellTokens.js';
import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import {
  NetworkInfo,
  WalletProvider
} from '@terra-money/wallet-provider';

import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
} from "@apollo/client";

import 'antd/dist/antd.css';
import 'bootstrap/dist/css/bootstrap.min.css';

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
      <Router>
        <WalletProvider defaultNetwork={network}>
          <ApolloProvider client={client}>
            <Layout className="layout">
              <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
                <AppBar selectTab={selectTab} />
                
                <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
                  <div className="container">
                    
                     <Switch>
                      <Route exact path="/">
                        <Dashboard />
                      </Route>
                      <Route path="/wallet">
                        <MyWallet />
                      </Route>
                      <Route path="/buy">
                        <BuyTokens />
                      </Route>
                      <Route path="/sell">
                        <SellTokens />
                      </Route>
                      <Route path="/send">
                        <SendTokens />
                      </Route>
                    </Switch>


                  </div>
                </Content>

                <Footer style={{ textAlign: 'center' }}>Powered by Terra</Footer>
              </div>
            </Layout>
          </ApolloProvider>
        </WalletProvider>
      </Router>
    </div>
    
  );
}
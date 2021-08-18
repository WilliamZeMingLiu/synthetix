import './App.css';
import AppBar from './components/AppBar/AppBar.js';
import Dashboard from './page/Dashboard/Dashboard.js';
import MyWallet from './page/MyWallet/MyWallet.js';
import SendTokens from './page/SendTokens/SendTokens.js';
import BuyTokens from './page/BuyTokens/BuyTokens.js';
import SellTokens from './page/SellTokens/SellTokens.js';
import SwapTokens from './page/SwapTokens/SwapTokens.js';
import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
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

import { Layout } from 'antd';

export default function App() {
  const { Content, Footer } = Layout;


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
  */

  // Gql obj
  // const mainUri = 'https://graph.mirror.finance/graphql'
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

  return (
    <div className="App">
      <Router>
        <WalletProvider defaultNetwork={network}>
          <ApolloProvider client={client}>
            <Layout className="layout">
              <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
                <AppBar />
                
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
                      <Route path="/swap">
                        <SwapTokens />
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
import './App.css';
import AppBar from './components/AppBar/AppBar.js';
import MainContent from './components/MainContent/MainContent.js';

import React from 'react';
import {
  BrowserRouter as Router,
} from "react-router-dom";

import {
  WalletProvider
} from '@terra-money/wallet-provider';

import 'antd/dist/antd.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import { Layout } from 'antd';

export default function App() {
  const { Content, Footer } = Layout;


  /*
   // Local test network
  const network: NetworkInfo = {
    name: 'localterra',
    chainID: 'localterra',
    lcd: 'http://localhost:1317'
  }
  */

  // Gql obj
  const mainnet = {
    name: 'mainnet',
    chainID: 'columbus-4',
    lcd: 'https://lcd.terra.dev',
  };

  const testnet = {
    name: 'testnet',
    chainID: 'tequila-0004',
    lcd: 'https://tequila-lcd.terra.dev',
  };

  const walletConnectChainIds: Record<number, NetworkInfo> = {
    0: testnet,
    1: mainnet,
  };

  return (
    <div className="App">
      <Router>
        <WalletProvider defaultNetwork={mainnet} walletConnectChainIds={walletConnectChainIds}>
            <Layout className="layout">
              <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
                <AppBar />
                
                <MainContent />

                <Footer style={{ textAlign: 'center' }}>Powered by Terra</Footer>
              </div>
            </Layout>
        </WalletProvider>
      </Router>
    </div>
    
  );
}
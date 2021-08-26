import './MainContent.css';

import React, { useMemo } from 'react';

import { LCDClient } from '@terra-money/terra.js';

import Dashboard from '../../page/Dashboard/Dashboard.js';
import MyWallet from '../../page/MyWallet/MyWallet.js';
import SendTokens from '../../page/SendTokens/SendTokens.js';
import BuyTokens from '../../page/BuyTokens/BuyTokens.js';
import SellTokens from '../../page/SellTokens/SellTokens.js';
import SwapTokens from '../../page/SwapTokens/SwapTokens.js';

import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";

import {
  useConnectedWallet
} from '@terra-money/wallet-provider';

import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
} from "@apollo/client";

import { Layout } from 'antd';

export default function MainContent() {
  const { Content } = Layout;

  // set lcd obj
  
  const connectedWallet = useConnectedWallet();
  const lcd = useMemo(() => {
    if (!connectedWallet) {
      return null;
    }

    return new LCDClient({
      URL: connectedWallet.network.lcd,
      chainID: connectedWallet.network.chainID,
    });
  }, [connectedWallet]);  

  /*
   // Local test network
  const network: NetworkInfo = {
    name: 'localterra',
    chainID: 'localterra',
    lcd: 'http://localhost:1317'
  }
  */

  const mainUri = 'https://graph.mirror.finance/graphql'
  const testUri = 'https://tequila-graph.mirror.finance/graphql'

  const client = new ApolloClient({
    uri: lcd && lcd.config.chainID === 'tequila-0004' ? testUri : mainUri ,
    cache: new InMemoryCache()
  });

  return (
    <>
      <ApolloProvider client={client}>
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
      </ApolloProvider>
    </>
    
  );
}
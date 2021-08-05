import './MainContent.css';
import Dashboard from '../../page/Dashboard/Dashboard.js';
import MyWallet from '../../page/MyWallet/MyWallet.js';
import SendTokens from '../../page/SendTokens/SendTokens.js';
import BuyTokens from '../../page/BuyTokens/BuyTokens.js';
import SellTokens from '../../page/SellTokens/SellTokens.js';
import { LCDClient } from '@terra-money/terra.js'
import React, { useState, useMemo, useEffect } from 'react';

import {
  useWallet,
  WalletStatus,
  useConnectedWallet,
  UserDenied,
} from '@terra-money/wallet-provider'

import {
  NetworkInfo,
  WalletProvider
} from '@terra-money/wallet-provider';


import { Layout, Menu, Button } from 'antd';

export default function MainContent(props) {
  const { Header, Content, Footer, Sider } = Layout;

  const [ currTab, setCurrTab ] = useState('0');

  useEffect(() => {
    setCurrTab(props.currTab)
  })

  const renderCurrPage = (currTab) => {
    if(currTab === '2') return <MyWallet />
    else if(currTab === '3') return <BuyTokens />
    else if(currTab === '4') return <SellTokens />
    else if(currTab === '5') return <SendTokens />
    // else if(currTab === '6') return <Swap />
    return <Dashboard />
  }

  return (
    <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
      <div className="container">
        {renderCurrPage(currTab)}
      </div>
    </Content>
  );
}
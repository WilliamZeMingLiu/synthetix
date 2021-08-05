import { LCDClient } from '@terra-money/terra.js'
import './AppBar.css';
import React, { useState, useMemo } from 'react';

import {
  WalletStatus,
  useWallet
} from '@terra-money/wallet-provider';

import { 
  Layout, 
  Button, 
  Modal, 
  Menu, 
  Typography, 
  Tooltip,
  Dropdown,
  Tag,
  Badge,
} from 'antd';

import { WalletOutlined, LogoutOutlined } from '@ant-design/icons';

import {
  useConnectedWallet,
} from '@terra-money/wallet-provider'

export default function AppBar(props) {
  const {
    status,
    availableConnectTypes,
    availableInstallTypes,
    connect,
    install,
    disconnect,
  } = useWallet();

  const [ isModalVisible, setIsModalVisible ] = useState(false);
  const [ currKey, setCurrKey ] = useState('1');

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

  function showModal() {
    setIsModalVisible(true);
  };

  function handleCancel() {
    setIsModalVisible(false);
  };

  function handleDisconnect() {
    handleCancel();
    disconnect();
  }

  const handleChange = (key) => {
    props.selectTab(key);
    setCurrKey(key);
  } 

  function renderConnectButton(connectType, installType) {
    if(connectType === 'READONLY') return;
    if(installType === 'install'){
      return <Button 
          className="connect-button-options" 
          key={'install-' + connectType}
          onClick={() => install(connectType)}
          size="large"
          type="primary"
          style={{margin: '10px 0'}}
          block="true"
        >Install {connectType}
      </Button>
    }
    return <Button 
        className="connect-button-options" 
        key={'connect-' + connectType}
        onClick={() => connect(connectType)}
        size="large"
        type="primary"
        style={{margin: '10px 0'}}
        block="true"
      >Connect {connectType}
    </Button>
  }

  const menu = (
    <Menu className="menu" selectedKeys={[currKey]} mode="horizontal">
      <Menu.Item onClick={() => handleChange('1')} key="1">
        Dashboard
      </Menu.Item>
      <Menu.Item onClick={() => handleChange('2')} key="2">
        Wallet
      </Menu.Item>
      <Menu.Item onClick={() => handleChange('3')} key="3">
        Buy
      </Menu.Item>
      <Menu.Item onClick={() => handleChange('4')} key="4">
        Sell
      </Menu.Item>
      <Menu.Item onClick={() => handleChange('5')} key="5">
        Send
      </Menu.Item>
      <Menu.Item disabled onClick={() => handleChange('6')} key="6">
        Swap
      </Menu.Item>
    </Menu>
  )

  return (
    <div className="header">
      <div className="logo">
        <h3>Synthetix</h3>
      </div>

      {(status === WalletStatus.WALLET_NOT_CONNECTED ||
        status === WalletStatus.WALLET_CONNECTED) && (
          <>
            <div className="menu-wrapper">
              <Menu className="menu" selectedKeys={[currKey]} mode="horizontal">
                <Menu.Item onClick={() => handleChange('1')} key="1">
                  Dashboard
                </Menu.Item>
                <Menu.Item onClick={() => handleChange('2')} key="2">
                  Wallet
                </Menu.Item>
                <Menu.Item onClick={() => handleChange('3')} key="3">
                  Buy
                </Menu.Item>
                <Menu.Item onClick={() => handleChange('4')} key="4">
                  Sell
                </Menu.Item>
                <Menu.Item onClick={() => handleChange('5')} key="5">
                  Send
                </Menu.Item>
                <Menu.Item disabled onClick={() => handleChange('6')} key="6">
                  Swap
                </Menu.Item>
              </Menu>
            </div>
          </>
        )
      }
      
      {status === WalletStatus.WALLET_NOT_CONNECTED && (
        <>
          <div className="connect-wallet-button-small">
            <Tooltip placement="bottom" title="Connect Wallet">
              <Button 
                className="connect-wallet-button" 
                onClick={() => showModal()}
                ghost 
                shape="round"
                icon={<WalletOutlined />}
              >
              </Button>
            </Tooltip>
          </div>

          <div className="connect-wallet-button">
            <Button 
              className="connect-wallet-button" 
              onClick={() => showModal()}
              ghost 
              shape="round"
              icon={<WalletOutlined />}
            >Connect Wallet
            </Button>
          </div>

          <Modal title="Connect to a wallet" visible={isModalVisible} footer={null} onCancel={handleCancel}>
            {availableInstallTypes.map(connectType => {
              return renderConnectButton(connectType, 'install');
            })}
            {availableConnectTypes.map(connectType => {
              return renderConnectButton(connectType, 'connect');
            })}
          </Modal>
        </>
      )}

      {status === WalletStatus.WALLET_CONNECTED && (
        <>
          <div className="connect-wallet-button">
            {lcd && lcd.config.name === ('columbus-4') ? 
              <Tag style={{height: '22px'}} color="#2db7f5">{lcd.config.chainID}</Tag> :
              <Tag style={{height: '22px'}} color="#f50">{lcd.config.chainID}</Tag>
            }
            <Button 
              className="connect-wallet-button" 
              onClick={() => handleDisconnect()}
              ghost 
              shape="round"
              icon={<LogoutOutlined />}
            >Disconnect
            </Button>
          </div>

          <div className="connect-wallet-button-small">
            {lcd && lcd.config.name === ('columbus-4') ? 
              <Badge status="processing" />:
              <Badge status="error" />
            }
            <Tooltip placement="bottom" title="Disconnect">
              <Button 
                className="connect-wallet-button" 
                onClick={() => handleDisconnect()}
                ghost 
                shape="round"
                icon={<LogoutOutlined />}
              >
              </Button>
            </Tooltip>
          </div>
        </>
      )}  
    </div>
  );
}
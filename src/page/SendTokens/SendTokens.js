import { LCDClient, Coin, Denom, MsgSend, StdFee, TxResult} from '@terra-money/terra.js'
import { WalletOutlined } from '@ant-design/icons';
import { Descriptions, Button, Form, Input, InputNumber, Select, Result } from 'antd';
import { Mirror } from '@mirror-protocol/mirror.js';
import axios from 'axios'; 

//import * as All from '@terra-money/terra.js';
import {
  CreateTxFailed,
  Timeout,
  TxFailed,
  TxUnspecifiedError,
  useConnectedWallet,
  UserDenied,
} from '@terra-money/wallet-provider'
//import { TxResult } from '@terra-money/terra.js';
import React, { useEffect, useMemo, useState, useCallback } from 'react'

import Box from '../../components/Box/Box.js';
import TxConfirm from '../../components/TxConfirm/TxConfirm.js';
import Loading from "../../components/Loading/Loading";

import './SendTokens.css';

export default function SendTokens() {

  const { Option } = Select;

  // Wallet connect variables
  const [bank, setBank] = useState({coins: [], assets: []});
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [denoms, setDenoms] = useState(null);

  // Tx state variables
  const [txResult, setTxResult] = useState(null);
  const [txError, setTxError] = useState(null);

  // Grabbing wallet info from Dashboard.js
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
  

  useEffect(() => {
    const asyncCalls = async(lcd) => {
      // Setting denoms
      const denoms = await lcd.oracle.activeDenoms();
      setDenoms(denoms);
      
    }


    if(connectedWallet){
      asyncCalls(lcd);
      lcd.bank.balance(connectedWallet.walletAddress).then((coins) => {
        let index = 1;
        if (connectedWallet && lcd) {
          for (var coin in coins._coins) {
            if (coins._coins.hasOwnProperty(coin)) {
              var tempObj = {};
              tempObj['key'] = index++;
              tempObj['coin'] = coin;
              tempObj['amount'] = parseInt(coins._coins[coin].amount);
              bank.coins.push(tempObj);
            }
          }
        }
      });
    }
    
  }, [])


  const handleSubmit = useCallback((values) => {
    
    const feeType = 'uusd';
  
    const sendAddress = values.address;
    const sendType = values.sendType;
    const sendAm = values.send;

    if (!connectedWallet) {
      return;
    }

    if (connectedWallet.network.chainID.startsWith('columnbus')) {
      alert(`This is a real transaction. Please dbl check code`);
      return;
    }

    setTxResult(null);

    connectedWallet
      .post({
        // fee: new StdFee(gasAmount*1.75, (gasAmount)+feeType),
        msgs: [
          new MsgSend(connectedWallet.walletAddress, sendAddress, {[sendType]: parseInt(sendAm*1000000)}),
        ],
      })
      .then((nextTxResult: TxResult) => {
        console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error: unknown) => {
        if (error instanceof UserDenied) {
          setTxError('User Denied');
        } else if (error instanceof CreateTxFailed) {
          setTxError('Create Tx Failed: ' + error.message);
        } else if (error instanceof TxFailed) {
          setTxError('Tx Failed: ' + error.message);
        } else if (error instanceof Timeout) {
          setTxError('Timeout');
        } else if (error instanceof TxUnspecifiedError) {
          setTxError('Unspecified Error: ' + error.message);
        } else {
          setTxError(
            'Unknown Error: ' +
              (error instanceof Error ? error.message : String(error)),
          );
        }
      });
  }, [connectedWallet]);

  const handleFail = useCallback((values) => { 
    // Empty function
  })

  const handleAmount = async(e) => {
    return;
  }

  return (
    <>
      <h1>Send Coins</h1>
      {connectedWallet?.availablePost && !txResult && !txError && (
        <Box content={
          <>
            <Form
              name="basic"
              wrapperCol={{ span: 16 }}
              initialValues={{ 
                address: "",
                feeType: "uusd",
                sendType: "uusd",
                send: ""
              }}
              layout="vertical"
              requiredMark={false}
              onFinish={handleSubmit}
              onFinishFailed={handleFail}
            >
              <p>Recipient Address</p>
              <Form.Item
                name="address"
                rules={[{ required: true }]}
              >
                <Input 
                  size="large" 
                  placeholder="Please enter the recipient's address" 
                  prefix={<WalletOutlined />}
                />
              </Form.Item>
              <p>Send</p>
              <Input.Group compact>
                <Form.Item
                  name="sendType"
                >
                  <Select 
                    size="large" 
                    style={{width: 80}} 
                  >
                    {denoms !== null && denoms.map(coin => {
                      return <Option key={coin} value={coin}>{coin}</Option>
                    })}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="send"
                  rules={[{ required: true }]}
                >
                  <Input 
                    onChange={e => handleAmount(e)}
                    size="large" 
                    className="site-input-left" 
                    style={{
                      width: 380,
                    }}
                    type="number"
                    placeholder="0.00" 
                    min="0"
                    step="0.000001"
                  />
                </Form.Item>
              </Input.Group>

              <Form.Item wrapperCol={{ span: 16 }}>
                <Button 
                  type="primary" 
                  htmlType="submit"
                >
                  Send
                </Button>
              </Form.Item>
            </Form>
          </>
        } />
        
      )}

      {txResult && (
        <TxConfirm
          status="success"
          title="Successful Transaction"
          txMsg={"Sent " + txResult.msgs[0].amount.toString() + " to " + txResult.msgs[0].to_address}
          txResult={"Transaction Hash: " + txResult.result.txhash}
          returnFunc={setTxResult}
        />
      )}

      {txError && (
        <TxConfirm
          status="error"
          title="Failed Transaction"
          txMsg=""
          txResult={txError}
          returnFunc={setTxError}
        />
      )}

      {!connectedWallet && <p>Wallet not connected!</p>}
      {connectedWallet && !connectedWallet.availablePost && (
        <p>Can not post Tx</p>
      )}
    </>
  );
}
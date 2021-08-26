import './SendTokens.css';
import React, { useEffect, useMemo, useState, useCallback } from 'react';

// terra.js
import { LCDClient, MsgSend, TxResult} from '@terra-money/terra.js'
// wallet provider
import {
  CreateTxFailed,
  Timeout,
  TxFailed,
  TxUnspecifiedError,
  useConnectedWallet,
  useWallet,
  UserDenied,
} from '@terra-money/wallet-provider'

// custom components
import Box from '../../components/Box/Box.js';
import TxConfirm from '../../components/TxConfirm/TxConfirm.js';
import NotConnected from '../../components/NotConnected/NotConnected.js';
import EmptyWallet from '../../components/EmptyWallet/EmptyWallet.js';
import Loading from "../../components/Loading/Loading";
//antd components
import { Button, Form, Input, Select } from 'antd';
import { WalletOutlined } from '@ant-design/icons';

const numeral = require('numeral');

export default function SendTokens() {
  const { Option } = Select;

  const {
    status,
  } = useWallet();

  // NOTE: APIs return either dec or int format for token amounts, 
  // to maintain consistency all states will be in dec format, with
  // 6 decimal places rounded
  const [bank, setBank] = useState({coins: [], assets: []});
  const [denoms, setDenoms] = useState(null);

  const [currToken, setCurrToken] = useState(null);
  const [coinAmount, setCoinAmount] = useState(null);

  const [currBalance, setCurrBalance] = useState(null);

  // Tx state variables
  const [txResult, setTxResult] = useState(null);
  const [txError, setTxError] = useState(null);

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
  

  useEffect(() => {
    /*
    const asyncCalls = async(lcd) => {
      // Setting denoms
      const denoms = await lcd.oracle.activeDenoms();
      console.log(denoms);
      setDenoms(denoms);
    }
    */

    if(connectedWallet && lcd){
      // asyncCalls(lcd);
      const tempArr = [];
      lcd.bank.balance(connectedWallet.walletAddress).then((coins) => {
        let index = 1;
        for (var coin in coins._coins) {
          if (coins._coins.hasOwnProperty(coin)) {
            tempArr.push(coin);
            var tempObj = {};
            tempObj['key'] = index++;
            tempObj['coin'] = coin;
            tempObj['amount'] = parseInt(coins._coins[coin].amount);
            bank.coins.push(tempObj);
          }
        }
        setDenoms(tempArr);
      });
    }
    
  }, [connectedWallet, lcd, bank, coinAmount])


  const handleSubmit = useCallback((values) => {  
    const sendAddress = values.address;
    const sendType = values.sendType;
    const sendAm = values.send;

    if (connectedWallet.network.chainID.startsWith('columnbus')) {
      alert(`This is a real transaction. Please dbl check code`);
      return;
    }

    setTxResult(null);
    setTxError(null);

    connectedWallet
      .post({
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

  /*
  const handleFail = useCallback((values) => { 
    // Empty function
  })
  */

  const resetState = () => {
    setCurrBalance(null);
    setCoinAmount(null);
    setCurrToken(null);
    setTxError(null);
    setTxResult(null);
    //console.log("resetState");
  }

  const handleAmount = (e) => {
    setCoinAmount(parseFloat(e.target.value));
  }

  const handleToken = (e) => {
    setCurrToken(e);
    if(bank){
      for(const coin of bank.coins){
        if(coin.coin === e){
          setCurrBalance(parseFloat((coin.amount/1000000).toFixed(6)));
        }
      }
    }
  }

  const renderPage = () => {
    if(status === 'WALLET_NOT_CONNECTED') return <NotConnected />;
    else if(status === 'INITIALIZING' || !lcd || !denoms) return <Loading css="loading-page" />;
    
    return <>
      {connectedWallet?.availablePost && !txResult && !txError && (
        <>
          {denoms && denoms.length > 0 ? null : <EmptyWallet />}
          <Box content={
            <>
              <Form
                name="basic"
                layout="vertical"
                onFinish={handleSubmit}
                // onFinishFailed={handleFail}
              >
                <h2 className="box-header">Send</h2>
                <Form.Item
                  name="address"
                  rules={[{ required: true, message: "Please input recipient's address" }]}
                >
                  <Input 
                    size="large" 
                    placeholder="Please enter the recipient's address..." 
                    prefix={<WalletOutlined />}
                  />
                </Form.Item>

                <Form.Item
                  name="sendType"
                  rules={[{ required: true, message: 'Please select desired coin' }]}
                >
                  <Select 
                    size="large" 
                    placeholder="Select token to send..."
                    onChange={(e) => handleToken(e)}
                  >
                    {denoms && denoms.map(coin => {
                      return <Option key={coin} value={coin}>{coin}</Option>
                    })}
                  </Select>
                </Form.Item>

                <p>Your Balance: {currBalance && currToken ? currBalance + " " + currToken : ""}</p>

                <Form.Item
                  name="send"
                  rules={[{ required: true, message: 'Please input desired amount' }]}
                >
                  <Input 
                    onChange={e => handleAmount(e)}
                    size="large" 
                    className="site-input-left" 
                    type="number"
                    placeholder="0.00" 
                    min="0"
                    max={currBalance ? currBalance : coinAmount}
                    suffix={currToken ? currToken : null}
                    step="0.000001"
                  />
                </Form.Item>

                <Form.Item  style={{textAlign: 'center'}}>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    disabled={denoms && denoms.length > 0 ? false : true}
                  >
                    Send
                  </Button>
                </Form.Item>
              </Form>
            </>
          } />
        </>
      )}

      {txResult && (
        <TxConfirm
          status="success"
          title="Successful Transaction"
          txMsg={"Sent " + numeral(coinAmount).format('0,0.000000') + " to " + txResult.msgs[0].to_address}
          txResult={"Transaction Hash: " + txResult.result.txhash}
          returnFunc={resetState}
        />
      )}

      {txError && (
        <TxConfirm
          status="error"
          title="Failed Transaction"
          txMsg=""
          txResult={txError}
          returnFunc={resetState}
        />
      )}
      {connectedWallet && !connectedWallet.availablePost && (
        <p>Can not post Tx</p>
      )}
    </>
  }

  return (
    <>
      <h1>Send Coins</h1>
      {renderPage()}
    </>
  );
}
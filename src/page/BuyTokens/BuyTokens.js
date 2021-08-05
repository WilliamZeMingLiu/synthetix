import './BuyTokens.css';
import { LCDClient, Coin, Denom, MsgSend, StdFee, TxResult, Key, PublicKey, Coins, MsgExecuteContract } from '@terra-money/terra.js'
import { Mirror } from '@mirror-protocol/mirror.js';
//import * as All from '@terra-money/terra.js';
import { GET_ASSET_ADDRESSES } from '../../mirApiEndpoints.js';
import { useQuery } from "@apollo/client";

import Box from '../../components/Box/Box.js';
import Loading from "../../components/Loading/Loading";

import { Select, Input, Button, Form, Result } from 'antd';



import {
  CreateTxFailed,
  Timeout,
  TxFailed,
  TxUnspecifiedError,
  UserDenied,
  useWallet,
  WalletStatus,
  useConnectedWallet,
} from '@terra-money/wallet-provider'

import React, { useEffect, useMemo, useState, useCallback } from 'react'

const numeral = require('numeral');

export default function BuyTokens() {

  const { Option } = Select;

  const {
    status,
    network,
    wallets,
    availableConnectTypes,
    availableInstallTypes,
    connect,
    install,
    disconnect,
  } = useWallet();

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

  // const mirror = new Mirror({lcd: lcd});

  const {loading, error, data} = useQuery(GET_ASSET_ADDRESSES());
  const [tokens, setTokens] = useState([]);
  const [currToken, setCurrToken] = useState(null);
  const [tokenAmount, setTokenAmount] = useState(null);
  const [ustAmount, setUstAmount] = useState(null);

  const [gasAmount, setGasAmount] = useState(null);
  const [gasLimit, setGasLimit] = useState(null);
  const [taxAmount, setTaxAmount] = useState(0);

  useEffect(() => {
      if(!loading && data){
        const arr = [];
        for(const obj of data.assets){
          if(obj.prices.price) arr.push(obj);
          if(obj.symbol === 'MIR' ) setCurrToken(obj);
        }
        setTokens(arr);
      }

  }, [data, taxAmount, gasLimit, gasAmount])

  const handleSubmit = useCallback((values) => {
    const finalAmount = (ustAmount*1000000).toString();

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
        msgs: [
          new MsgExecuteContract(connectedWallet.walletAddress, currToken.pair, {
            "swap": {
              "belief_price": (currToken.prices.price).toString(),
              "max_spread": "0.01",
              "offer_asset": {
                "amount": finalAmount,
                "info": {
                  "native_token": {
                    "denom": "uusd"
                  }
                }
              }
            }
          }, {uusd: finalAmount})
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
      // setTaxAmount(0);
  }, [connectedWallet, gasLimit, gasAmount, taxAmount, ustAmount]);

  const handleFail = useCallback((values) => { 
    // Empty function
  })

  const handleSelect = (val) => {
    for(const obj of tokens){
      if(obj.symbol === val) {
        setCurrToken(obj);
        setUstAmount((tokenAmount*obj.prices.price).toFixed(6))
        console.log(obj);
      } 
    }
  }

  const getTax = async(val) => {
    const rawE = val * 1000000;
    const result = await lcd.utils.calculateTax(new Coin('uusd', rawE));
    const parseResult = parseInt(result.amount.toString())/1000000;
    return parseResult;
  }

  const handleAmount = (e) => {
    // const tax = await getTax(e.target.value);
    // setTaxAmount(tax);
    console.log(currToken);

    setTokenAmount(e.target.value);
    setUstAmount((e.target.value*currToken.prices.price).toFixed(6))
  }

  function renderPage(status) {
    if(status === 'INITIALIZING') return <Loading />

    else if(status === 'WALLET_CONNECTED'){
      return <div>
        {connectedWallet?.availablePost && !txResult && !txError && (
          <Box content={
            <>
              <h2 className="box-header">Select Token to Buy</h2>
              <Form
                name="basic"
                wrapperCol={{ span: 16 }}
                initialValues={{ 
                  type: "MIR",
                  amount: "",
                }}
                layout="vertical"
                requiredMark={false}
                onFinish={handleSubmit}
                onFinishFailed={handleFail}
              >

              <div className="input-group">
                <Form.Item
                  name="type"
                  noStyle
                >
                  <Select
                    size="large"
                    style={{width: '120px'}}
                    onSelect={e => handleSelect(e)}
                    showSearch
                    placeholder="Token"
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                    filterSort={(optionA, optionB) =>
                      optionA.children.toLowerCase().localeCompare(optionB.children.toLowerCase())
                    }
                  >
                  {tokens.map(token => {
                    return <Option value={token.symbol}>{token.symbol}</Option>
                  })}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="amount"
                  noStyle
                  rules={[{ required: true }]}
                >
                  <Input 
                    onChange={e => handleAmount(e)}
                    size="large" 
                    type="number"
                    placeholder="0.00"
                    min={0}
                    max={1000000000}
                    style={{width: '60%'}}
                    step="0.000001" />
                </Form.Item>
              </div>

                <p>Token Price: {currToken !== null && numeral(currToken.prices.price).format('0,0.000000') + ' UST'}</p>
                <p>Total Price: {ustAmount !== null && numeral(ustAmount + ' UST').format('0,0.000000') + ' UST'}</p>

                <Form.Item wrapperCol={{ span: 16 }}>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                  >
                    Buy
                  </Button>
                </Form.Item>
              </Form>
            </>
          } />
           
        )}
        {txResult && (
          <Box content={
            <Result
              status="success"
              title="Successful Transaction"
              subTitle={
                <div className="result-container">
                  <p>
                    Transaction Hash: {txResult.result.txhash}
                  </p>
                </div>
              }
              extra={[
                <Button 
                  type="primary" 
                  key="console"
                  onClick={() => setTxResult(null)}
                >
                  Back
                </Button>
              ]}
            />
          } />
        )}
        {txError && (
          <Box content={
            <Result
                status="error"
                title="Failed Transaction"
                subTitle={
                  <div className="result-container">
                    <p>
                      {txError}
                    </p>
                  </div>
                }
                extra={[
                  <Button 
                    type="primary" 
                    key="console"
                    onClick={() => setTxError(null)}
                  >
                    Back
                  </Button>
                ]}
              />
            } />
        )}
        {!connectedWallet && <p>Wallet not connected!</p>}
        {connectedWallet && !connectedWallet.availablePost && (
          <p>Can not post Tx</p>
        )}
      </div>
    }

    return (
      <p>Wallet not connected!</p>
    ) 
  }  

  return (
    <div className="container">
        <h1>Buy Tokens</h1>
        {renderPage(status)}
    </div>
  );
}
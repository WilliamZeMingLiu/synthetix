import { Coin, TxResult, MsgExecuteContract } from '@terra-money/terra.js'
//import { Mirror } from '@mirror-protocol/mirror.js';
//import * as All from '@terra-money/terra.js';
import { GET_BALANCES, GET_ASSET_ADDRESSES } from '../../mirApiEndpoints.js';
import { useQuery } from "@apollo/client";

import { Select, Input, Button, Form, Result } from 'antd';

import {
  CreateTxFailed,
  Timeout,
  TxFailed,
  TxUnspecifiedError,
  UserDenied,
  useWallet,
  useConnectedWallet,
} from '@terra-money/wallet-provider'

import Box from '../../components/Box/Box.js';
import Loading from "../../components/Loading/Loading";

//import { TxResult } from '@terra-money/terra.js';
import React, { useEffect, useMemo, useState, useCallback } from 'react'

import './SellTokens.css';

export default function SellTokens() {

  const { Option } = Select;

  const {
    status,
  } = useWallet();

  const [txResult, setTxResult] = useState(null);
  const [txError, setTxError] = useState(null);

  const [tokens, setTokens] = useState([]);
  const [allTokens, setAllTokens] = useState(null);
  const [currToken, setCurrToken] = useState(null);
  const [ustAmount, setUstAmount] = useState(null);
  const [tokenAmount, setTokenAmount] = useState(null);

  // const [currPrice, setCurrPrice] = useState(null);

  // Grabbing wallet info from Dashboard.js
  const connectedWallet = useConnectedWallet();

  // const mirror = new Mirror({lcd: lcd});

  let address = "";
  if(connectedWallet){
    address = connectedWallet.walletAddress;
  }

  const {loading: loadingBalance, error: errorBalance, data: dataBalance} = useQuery(GET_BALANCES(), {
    variables: { address },
  });

  const {loading: loadingAssets, error: errorAssets, data: dataAssets} = useQuery(GET_ASSET_ADDRESSES());

  useEffect(() => {
      const obj = {};
      if(!loadingAssets && dataAssets){
        for(const asset of dataAssets.assets){
          if(asset.prices.price) obj[asset.token] = asset;
        }
        console.log(obj);
        setAllTokens(obj);
      }

      if(!loadingBalance && dataBalance){
        const arr = [];
        for(const asset of dataBalance.balances){
          if(obj.hasOwnProperty(asset.token)){
            const tempObj = {...obj[asset.token], balance: asset.balance}
            arr.push(tempObj)
          }
        }
        setTokens(arr);
      }
  }, [dataBalance, dataAssets])

  const handleSubmit = useCallback((values) => {
    const amount = values.amount * 1000000;
    const type = values.type;

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
        // fee: new StdFee(gasLimit*gasAmount*1000000, (gasAmount*1000000)+'uusd'),
        msgs: [
          new MsgExecuteContract(connectedWallet.walletAddress, currToken.token, {
            "send": {
              "amount": amount.toString(),
              "contract": currToken.pair,
              "msg": "eyJzd2FwIjp7ImJlbGllZl9wcmljZSI6IjAuMjgxOTE4NjE0MDQyOTg2Mzg2IiwibWF4X3NwcmVhZCI6IjAuMDEifX0="
            }
          }, {})
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
      
  }, [connectedWallet, tokens, allTokens, currToken]);

  const handleFail = useCallback((values) => { 
    // Empty function
  })

  const handleAmount = useCallback((e) => { 
    setTokenAmount(e.target.value);
    if(currToken){
      setUstAmount((e.target.value*currToken.prices.price).toFixed(6));
    }
    
  })

  const handleSelect = useCallback((val) => { 
    for(const token of tokens){
      if(token.token === val) setCurrToken(token)
    }
    if(tokenAmount){
      setUstAmount((tokenAmount*allTokens[val].prices.price).toFixed(6))
    }
  })

  function renderPage(status) {
    if(status === 'INITIALIZING') return <p>Loading...</p>

    else if(status === 'WALLET_CONNECTED'){
      return <div>
      {connectedWallet?.availablePost && !txResult && !txError && (
        <Box content={
          <>
            <h2 className="box-header">Select Token to Sell</h2>
            <Form
              name="basic"
              wrapperCol={{ span: 16 }}
              initialValues={{ 
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
                  rules={[{ required: true }]}
                  noStyle
                >
                  <Select
                    size="large"
                    style={{width: '100px'}}
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
                    return <Option value={token.token}>{token.symbol}</Option>
                  })}

                  </Select>
                </Form.Item>

                <Form.Item
                  name="amount"
                  rules={[{ required: true }]}
                  noStyle
                >
                  <Input 
                    suffix={currToken ? currToken.symbol : null}
                    onChange={e => handleAmount(e)}
                    size="large" 
                    type="number"
                    className="site-input" 
                    style={{width: '300px'}} 
                    placeholder="0.00"
                    min={0}
                    max={1000000000}
                    style={{width: '60%'}}
                    step="0.000001" />
                </Form.Item>
                
              </div>
              <p>Token Price: {currToken !== null && (currToken.prices.price + ' UST')}</p>
              <p>Total Price: {ustAmount !== null && (ustAmount + ' UST')}</p>
              <p>Your Balance: {currToken !== null && ((currToken.balance/1000000).toFixed(6) + ' ' + currToken.symbol)}</p>

              <Form.Item wrapperCol={{ span: 16 }}>
                <Button 
                  type="primary" 
                  htmlType="submit"
                >
                  Sell
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
        <h1>Sell Tokens</h1>
        {renderPage(status)}
    </div>
  );
}
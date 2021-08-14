import './BuyTokens.css';
import { LCDClient, Coin, Denom, MsgSend, StdFee, TxResult, Key, PublicKey, Coins, MsgExecuteContract } from '@terra-money/terra.js'
import { Mirror } from '@mirror-protocol/mirror.js';
//import * as All from '@terra-money/terra.js';
import { GET_ASSET_ADDRESSES } from '../../mirApiEndpoints.js';
import { useQuery } from "@apollo/client";

import Box from '../../components/Box/Box.js';
import TxConfirm from '../../components/TxConfirm/TxConfirm.js';
import Loading from "../../components/Loading/Loading";

import { Select, Input, Button, Form } from 'antd';

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

  useEffect(() => {
      if(!loading && data){
        const arr = [];
        for(const obj of data.assets){
          if(obj.prices.price && obj.prices.price != '0.000000') arr.push(obj);
          if(obj.symbol === 'MIR' ) setCurrToken(obj);
        }
        setTokens(arr);
      }

  }, [data])

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
  }, [connectedWallet, ustAmount]);

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

  const handleAmount = (e) => {
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
              <Form
                name="basic"
                initialValues={{ 
                  type: "MIR",
                  amount: "",
                }}
                layout="vertical"
                requiredMark={false}
                onFinish={handleSubmit}
                onFinishFailed={handleFail}
              >
                <div>
                  <h2 className="box-header">Buy</h2>
                  <Form.Item
                    name="type"
                  >
                    <Select
                      size="large"
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
                    rules={[{ required: true }]}
                  >
                    <Input 
                      onChange={e => handleAmount(e)}
                      size="large" 
                      type="number"
                      placeholder="0.00"
                      min={0}
                      max={1000000000}
                      step="0.000001" />
                  </Form.Item>

                  <p>Token Price: {currToken !== null && numeral(currToken.prices.price).format('0,0.000000') + ' UST'}</p>
                  <p>Total: {ustAmount !== null && numeral(ustAmount + ' UST').format('0,0.000000') + ' UST'}</p>
                </div>

                <Form.Item>
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
          <TxConfirm
            status="success"
            title="Successful Transaction"
            txMsg={"Transaction Hash: " + txResult.result.txhash}
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
      </div>
    }

    return (
      <p>Wallet not connected!</p>
    ) 
  }  

  return (
    <>
      <h1>Buy Tokens</h1>
      {renderPage(status)}
    </>
  );
}
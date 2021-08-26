import './BuyTokens.css';
import React, { useEffect, useMemo, useState, useCallback } from 'react';

// terra.js
import { LCDClient, TxResult, MsgExecuteContract } from '@terra-money/terra.js';
// apollo
import { GET_ASSET_ADDRESSES, GET_ASSET } from '../../mirApiEndpoints.js';
import { useQuery, useLazyQuery } from "@apollo/client";
// wallet-provider
import {
  CreateTxFailed,
  Timeout,
  TxFailed,
  TxUnspecifiedError,
  UserDenied,
  useWallet,
  useConnectedWallet,
} from '@terra-money/wallet-provider';
// custom components
import Box from '../../components/Box/Box.js';
import TxConfirm from '../../components/TxConfirm/TxConfirm.js';
import NotConnected from '../../components/NotConnected/NotConnected.js';
import EmptyWallet from '../../components/EmptyWallet/EmptyWallet.js';
import Loading from "../../components/Loading/Loading";
import Graph from '../../components/Graph/Graph.js';
import { basicLineGraph } from '../../components/Graph/graphStyles.js';
// antd components
import { Select, Input, Button, Form } from 'antd';

const numeral = require('numeral');

export default function BuyTokens() {
  // antd
  const { Option } = Select;
  // wallet-provider
  const {
    status,
  } = useWallet();

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

  // NOTE: APIs return either dec or int format for token amounts, 
  // to maintain consistency all states will be in dec format, with
  // 6 decimal places rounded

  // loaded states
  const [tokens, setTokens] = useState([]);
  const [ustBalance, setUstBalance] = useState(null);

  // user input states
  const [currToken, setCurrToken] = useState(null);
  const [tokenAmount, setTokenAmount] = useState(null);
  const [ustAmount, setUstAmount] = useState(null);
  
  // terra trade results
  const [txResult, setTxResult] = useState(null);
  const [txError, setTxError] = useState(null);

  const {loading: loadingTokens, error: errorTokens, data: dataTokens} = useQuery(GET_ASSET_ADDRESSES());
  if (errorTokens) console.log(`Error! ${errorTokens.message}`);

  // for price graph of currToken
  const today = new Date();
  const dateNow = new Date(today);
  dateNow.setDate(dateNow.getDate());
  dateNow.setUTCHours(0,0,0,0);
  const dateStart = new Date(today);
  dateStart.setDate(dateStart.getDate() - 30);
  dateStart.setUTCHours(0,0,0,0);

  const [getGraph, {
    loading: loadingAsset, 
    data: dataAsset }] = useLazyQuery(GET_ASSET());

  useEffect(() => {
    if(!loadingTokens && dataTokens){
      const arr = [];
      for(const obj of dataTokens.assets){
        if(obj.prices.price && obj.prices.price !== '0.000000'){
          arr.push(obj);
        } 
      }
      setTokens(arr);
      if(arr.length > 0 && !currToken){
        setCurrToken(arr[0]);
        getGraph({
          variables: {
            token: arr[0].token,
            startDate: dateStart.getTime(),
            endDate: dateNow.getTime(),
          }
        });
      } 
    }

    if(lcd){
      lcd.bank.balance(connectedWallet.walletAddress).then((coins) => {
        if(coins._coins.hasOwnProperty('uusd')){
          setUstBalance(coins._coins['uusd'].amount.toString()/1000000);
        }
        else{
          setUstBalance('0');
        }
      });
    }

  }, [connectedWallet, lcd, loadingTokens, dataTokens])

  // creating tx in terra
  const handleSubmit = useCallback(() => {
    const finalAmount = (ustAmount*1000000).toFixed(0).toString();
    const tokenPrice = (currToken.prices.price*1000000).toFixed(0).toString();

    if (connectedWallet.network.chainID.startsWith('columnbus')) {
      alert(`This is a real transaction. Please dbl check code`);
      return;
    }

    setTxResult(null);
    setTxError(null);

    connectedWallet
      .post({
        msgs: [
          new MsgExecuteContract(connectedWallet.walletAddress, currToken.pair, {
            "swap": {
              "belief_price": tokenPrice,
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
        //console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error: unknown) => {
        //console.log(error);
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
  }, [connectedWallet, ustAmount, currToken]);

  /*const handleFail = useCallback(() => { 
    // Empty function
  })
  */

  const renderGraph = () => {
    if(loadingAsset){
      return (
        <Loading css="loading-page" />
      )
    }

    const data = [];
    const columns = [];

    if(dataAsset){
      for(const obj of dataAsset.asset.prices.history){
        data.push(obj.price);
        columns.push(obj.timestamp);
      }
    }

    const style = basicLineGraph(data, columns, "Price");

    return (
      <div style={{width: '90%', margin: '0 auto'}}>
        <h2 className="box-header">{currToken && currToken.symbol} Price (last 30 UTC days)</h2>
        <Graph
          options={style.options}
          series={style.series}
          type="area"
          height="300px"
        />
      </div>
    )
  }

  const resetState = () => {
    setUstAmount(null);
    setTokenAmount(null);
    // currToken will always have coin as initial value unless user has 0 balance
    setCurrToken(tokens ? tokens[0] : null);
    setTxError(null);
    setTxResult(null);
  }

  const handleSelect = (val) => {
    for(const obj of tokens){
      if(obj.symbol === val) {
        setCurrToken(obj);
        if(tokenAmount){
          setUstAmount(parseFloat((tokenAmount*obj.prices.price).toFixed(6)));
        }
        getGraph({
          variables: {
            token: obj.token,
            startDate: dateStart.getTime(),
            endDate: dateNow.getTime(),
          }
        });
      } 
    }
  }

  const handleAmount = (e) => {
    setTokenAmount(parseFloat(e.target.value));
    if(currToken){
      setUstAmount(parseFloat((e.target.value*currToken.prices.price).toFixed(6)))
    }
  }

  const renderPage = () => {
    if(status === 'WALLET_NOT_CONNECTED') return <NotConnected />;
    if(status === 'INITIALIZING' || !ustBalance || loadingTokens) return <Loading css="loading-page" />;
    
    return <>
      {connectedWallet?.availablePost && !txResult && !txError && (
        <>
          {ustBalance && ustBalance !== '0' ? null : <EmptyWallet />}
          <Box content={
            <div style={{display: 'flex'}}>
              <div style={{width: '50%', height: '340px'}}>
                <Form
                  name="basic"
                  layout="vertical"
                  onFinish={handleSubmit}
                  initialValues={{
                    type : currToken ? currToken.symbol : null
                  }}
                  // onFinishFailed={handleFail}
                >
                  <div>
                    <h2 className="box-header">Buy</h2>
                    <Form.Item
                      name="type"
                      rules={[{ required: true, message: 'Please select desired MIR token' }]}
                    >
                      <Select
                        size="large"
                        style={{width: '100%'}}
                        onSelect={e => handleSelect(e)}
                        placeholder="Select token to buy..."
                        showSearch
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

                    <p>Price: {currToken && '1 ' + currToken.symbol + ' = ' + numeral(currToken.prices.price).format('0,0.000000') + ' UST'}</p>

                    <Form.Item
                      name="amount"
                      rules={[{ required: true, message: 'Please input desired amount' }]}
                    >
                      <Input 
                        onChange={e => handleAmount(e)}
                        size="large" 
                        type="number"
                        placeholder="0.00"
                        min={0}
                        max={currToken && ustBalance ? ((ustBalance)/currToken.prices.price).toFixed(6) : tokenAmount}
                        suffix={currToken ? currToken.symbol : ""}
                        step="0.000001" />
                    </Form.Item>
                    <p>Your Balance: {ustBalance && numeral(ustBalance).format('0,0.000000') + ' UST'}</p>
                    <p>Total: {ustAmount && numeral(ustAmount + ' UST').format('0,0.000000') + ' UST'}</p>
                  </div>

                  <Form.Item style={{textAlign: 'center'}}>
                    <Button 
                      type="primary" 
                      htmlType="submit"
                      disabled={ustBalance && ustBalance !== '0' ? false : true}
                    >
                      Buy
                    </Button>
                  </Form.Item>
                </Form>
              </div>
              <div style={{width: '50%', position: 'relative', height: '340px'}}>
                {renderGraph()}
              </div>
            </div>
          } />
        </>   
      )}

      {txResult && (
        <TxConfirm
          status="success"
          title="Successful Transaction"
          txMsg={"Purchased " + numeral(tokenAmount).format('0,0.000000') + " " + currToken.symbol + " for " + numeral(ustAmount).format('0,0.000000') + ' uusd'}
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
      <h1>Buy Tokens</h1>
      {renderPage()}
    </>
  );
}
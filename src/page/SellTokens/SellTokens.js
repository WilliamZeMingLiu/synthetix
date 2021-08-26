import './SellTokens.css';
import React, { useEffect, useState, useCallback } from 'react';

// terra.js
import { TxResult, MsgExecuteContract } from '@terra-money/terra.js';
// apollo
import { GET_BALANCES, GET_ASSET_ADDRESSES, GET_ASSET } from '../../mirApiEndpoints.js';
import { useQuery, useLazyQuery } from "@apollo/client";
// wallet provider
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

export default function SellTokens() {
  // antd 
  const { Option } = Select;
  // wallet provider
  const {
    status,
  } = useWallet();
  const connectedWallet = useConnectedWallet();

  let address = "";
  if(connectedWallet){
    address = connectedWallet.walletAddress;
  }

  // NOTE: APIs return either dec or int format for token amounts, 
  // to maintain consistency all states will be in dec format, with
  // 6 decimal places rounded

  // loaded states
  const [tokens, setTokens] = useState(null);
  const [allTokens, setAllTokens] = useState(null);

  const [currToken, setCurrToken] = useState(null);
  const [ustAmount, setUstAmount] = useState(null);
  const [tokenAmount, setTokenAmount] = useState(null);

  const [txResult, setTxResult] = useState(null);
  const [txError, setTxError] = useState(null);

  const {loading: loadingBalance, error: errorBalance, data: dataBalance} = useQuery(GET_BALANCES(), {
    variables: { address },
  });
  if (errorBalance) console.log(`Error! ${errorBalance.message}`);

  const {loading: loadingAssets, error: errorAssets, data: dataAssets} = useQuery(GET_ASSET_ADDRESSES());
  if (errorAssets) console.log(`Error! ${errorAssets.message}`);

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
    const obj = {};
    if(!loadingAssets && dataAssets){
      for(const asset of dataAssets.assets){
        if(asset.prices.price && asset.prices.price !== '0.000000') obj[asset.token] = asset;
      }
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
      if(!currToken){
        if(arr.length > 0){
          setCurrToken(arr[0]);
          getGraph({
            variables: {
              token: arr[0].token,
              startDate: dateStart.getTime(),
              endDate: dateNow.getTime(),
            }
          });
        } 
        else {
          setCurrToken("empty");
        }
      }
    }
  }, [loadingAssets, loadingBalance, dataBalance, dataAssets])

  const handleSubmit = useCallback(() => {
    // const amount = (values.amount * 1000000).toString();
    const amount = (tokenAmount*1000000).toFixed(0).toString();

    if (!connectedWallet) { 
      return;
    }

    if (connectedWallet.network.chainID.startsWith('columnbus')) {
      alert(`This is a real transaction. Please dbl check code`);
      return;
    }

    setTxResult(null);
    setTxError(null);
    
    connectedWallet
      .post({
        // fee: new StdFee(gasLimit*gasAmount*1000000, (gasAmount*1000000)+'uusd'),
        msgs: [
          new MsgExecuteContract(connectedWallet.walletAddress, currToken.token, {
            "send": {
              "amount": amount,
              "contract": currToken.pair,
              "msg": "eyJzd2FwIjp7ImJlbGllZl9wcmljZSI6IjAuMzM4NzkyIiwibWF4X3NwcmVhZCI6IjAuMDEifX0=",
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
      
  }, [connectedWallet, currToken, tokenAmount]);

  /*
  const handleFail = useCallback(() => { 
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
    setCurrToken(tokens ? tokens[0] : null);
    setTxError(null);
    setTxResult(null);
    //console.log("resetState");
  }

  const handleAmount = (e) => { 
    setTokenAmount(parseFloat(e.target.value));
    if(currToken && currToken !== 'empty'){
      setUstAmount(parseFloat((e.target.value*currToken.prices.price).toFixed(6)));
    }
  }

  const handleSelect = (val) => { 
    for(const token of tokens){
      if(token.token === val){
        setCurrToken(token);
        getGraph({
          variables: {
            token: token.token,
            startDate: dateStart.getTime(),
            endDate: dateNow.getTime(),
          }
        });
      } 
    }
    if(tokenAmount){
      setUstAmount(parseFloat((tokenAmount*allTokens[val].prices.price).toFixed(6)));
    }
  }

  const renderPage = () => {
    if(status === 'WALLET_NOT_CONNECTED') return <NotConnected />;

    if(status === 'INITIALIZING' || loadingAssets || loadingBalance || !currToken) return <Loading css="loading-page" />;
    
    return <>
      {connectedWallet?.availablePost && !txResult && !txError && (
        <>
          {currToken && currToken !== 'empty' ? null : <EmptyWallet />}
          <Box content={
            <div style={{display: 'flex'}}>
              <div style={{width: '50%', height: '340px'}}>
                <Form
                  name="basic"
                  layout="vertical"
                  onFinish={handleSubmit}
                  initialValues = {{
                    type : currToken && currToken !== 'empty' ? currToken.symbol : null
                  }}
                  
                  // onFinishFailed={handleFail}
                >
                  <div>
                    <h2 className="box-header">Sell</h2>
                    <Form.Item
                      name="type"
                      rules={[{ required: true, message: 'Please select desired MIR token' }]}
                    >
                      <Select
                        size="large"
                        style={{width: '100%'}}
                        onSelect={e => handleSelect(e)}
                        showSearch
                        placeholder="Select token to sell..."
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                        filterSort={(optionA, optionB) =>
                          optionA.children.toLowerCase().localeCompare(optionB.children.toLowerCase())
                        }
                      >
                      {tokens && tokens.map(token => {
                        return <Option value={token.token}>{token.symbol}</Option>
                      })}

                      </Select>
                    </Form.Item>

                    <p>Price: {currToken && currToken !== 'empty' && '1 ' + currToken.symbol + ' = ' + numeral(currToken.prices.price).format('0,0.000000') + ' UST'}</p>

                    <Form.Item
                      name="amount"
                      rules={[{ required: true, message: 'Please input desired amount' }]}
                    >
                      <Input 
                        onChange={e => handleAmount(e)}
                        size="large" 
                        type="number"
                        className="site-input" 
                        placeholder="0.00"
                        min={0}
                        max={currToken  && currToken !== 'empty' ? (currToken.balance/1000000).toFixed(6) : tokenAmount}
                        suffix={currToken  && currToken !== 'empty' ? currToken.symbol : ""}
                        step="0.000001" />
                    </Form.Item>
                    
                  </div>
                  
                  <p>Your Balance: {currToken && currToken !== 'empty' && (numeral((currToken.balance/1000000).toFixed(6)).format('0,0.000000') + ' ' + currToken.symbol)}</p>
                  <p>Total: {ustAmount && (numeral(ustAmount).format('0,0.000000') + ' UST')}</p>

                  <Form.Item style={{textAlign: 'center'}}>
                    <Button 
                      type="primary" 
                      htmlType="submit"
                      disabled={currToken && currToken !== 'empty' ? false : true}
                    >
                      Sell
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
          txMsg={"Sold " + numeral(tokenAmount).format('0,0.000000') + " " + currToken.symbol + " for " + numeral(ustAmount).format('0,0.000000') + ' uusd'}
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
      <h1>Sell Tokens</h1>
      {renderPage()}
    </>
  );
}
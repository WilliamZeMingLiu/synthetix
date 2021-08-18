import './SwapTokens.css';
import React, { useEffect, useMemo, useState, useCallback } from 'react'

// terra.js
import { LCDClient, Coin, MsgSwap, MsgExecuteContract, TxResult} from '@terra-money/terra.js';
// wallet provider
import {
  CreateTxFailed,
  Timeout,
  TxFailed,
  TxUnspecifiedError,
  useConnectedWallet,
  UserDenied,
  useWallet,
} from '@terra-money/wallet-provider';

// custom components
import Box from '../../components/Box/Box.js';
import TxConfirm from '../../components/TxConfirm/TxConfirm.js';
import NotConnected from '../../components/NotConnected/NotConnected.js';
import Loading from "../../components/Loading/Loading";
// antd components
import { Button, Form, Input, Select } from 'antd';
import { SwapOutlined } from '@ant-design/icons';

const numeral = require('numeral');

export default function SwapTokens() {
  // antd
  const { Option } = Select;

  const {
    status,
  } = useWallet();

  // NOTE: unlike previous pages, coin amount is either in 
  // dec format or int format in state
  const [allDenoms, setAllDenoms] = useState(null);
  const [userCoins, setUserCoins] = useState(null);

  const [currCoin, setCurrCoin] = useState(null);
  const [currCoinAmount, setCurrCoinAmount] = useState(null);
  const [currCoinBalance, setCurrCoinBalance] = useState(null);

  const [exCoin, setExCoin] = useState(null);
  const [unitRate, setUnitRate] = useState(null);
  const [totalRate, setTotalRate] = useState(null);

  const [allExRates, setAllExRates] = useState(null);

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

    const asyncCalls = async(lcd) => {
      // setting denoms
      const denoms = await lcd.oracle.activeDenoms();
      denoms.splice(11, 0, "uluna");
      setAllDenoms(denoms);
    }

    if(connectedWallet){
      asyncCalls(lcd);

      const tempArr = [];
      lcd.bank.balance(connectedWallet.walletAddress).then((coins) => {
        let index = 1;
        if (connectedWallet && lcd) {
          for (var coin in coins._coins) {
            if (coins._coins.hasOwnProperty(coin)) {
              var tempObj = {};
              tempObj['key'] = index++;
              tempObj['coin'] = coin;
              tempObj['amount'] = parseInt(coins._coins[coin].amount);
              tempArr.push(tempObj);
            }
          }
          setUserCoins(tempArr);
        }
      });

      lcd.oracle.exchangeRates().then((result) => {
        const obj = result._coins;
        const uusdRate = parseFloat(obj['uusd'].amount.toString()).toFixed(6);
        for(const [key, value] of Object.entries(obj)) {
          const updatedValue = parseFloat(value.amount.toString()).toFixed(6);
          obj[key] = parseFloat(updatedValue / uusdRate).toFixed(6);
        }
        setAllExRates(obj);
      });

      if(exCoin && currCoinAmount && currCoin){
        const tempEx = parseFloat((currCoinAmount / allExRates[currCoin]) * allExRates[exCoin]).toFixed(6);
        setTotalRate(tempEx);
      }
      if(exCoin && currCoin){
        const unitEx = parseFloat(allExRates[exCoin] / allExRates[currCoin]);
        setUnitRate(unitEx);
      }

    }
  }, [connectedWallet, lcd, exCoin, currCoinAmount, currCoin, allExRates])


  const handleSubmit = useCallback((values) => {
    const sendAddress = 'terra1z3sf42ywpuhxdh78rr5vyqxpaxa0dx657x5trs';
    const receiveCoin = values.receiveCoin;
    const sendAmount = values.sendAmount;
    const sendCoin = values.sendCoin;

    const coinObj = new Coin(sendCoin, sendAmount*1000000);

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
        msgs: [
          new MsgExecuteContract(connectedWallet.walletAddress, sendAddress, {
            "assert_limit_order": {
                "offer_coin": {
                  "denom": sendCoin,
                  "amount": (sendAmount*1000000).toString()
                },
                "ask_denom": receiveCoin,
                "minimum_receive": (parseFloat(totalRate*0.99).toFixed(6) * 1000000).toString()
              }
          }),
          new MsgSwap(connectedWallet.walletAddress, coinObj, receiveCoin),
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
  }, [connectedWallet, totalRate]);

  /*
  const handleFail = useCallback((values) => { 
    // Empty function
  })
  */

  const resetState = () => {
    setCurrCoin(null);
    setCurrCoinAmount(null);
    setCurrCoinBalance(null);

    setExCoin(null);
    setUnitRate(null);
    setTotalRate(null);

    setTxError(null);
    setTxResult(null);
    //console.log("resetState");
  }

  const handleUserCoin = (e) => {
    setCurrCoin(e);
    for(const coin of userCoins){
      if(coin.coin === e){
        setCurrCoinBalance(parseFloat(coin.amount/1000000));
      } 
    }
  }

  const handleUserAmount = (e) => {
    setCurrCoinAmount(e.target.value);
  }

  const handleExCoin = (e) => {
    setExCoin(e);
  }

  const renderPage = () => {
    if(status === 'WALLET_NOT_CONNECTED') return <NotConnected />;
    if(status === 'INITIALIZING' || !userCoins || !allDenoms) return <Loading />;

    return <>
      {connectedWallet?.availablePost && !txResult && !txError && (
        <Box content={
          <>
            <Form
              name="basic"
              layout="vertical"
              onFinish={handleSubmit}
              // onFinishFailed={handleFail}
            >
              <div className="form-container">
                <div className="form-input">
                  <h2 className="box-header">Send</h2>
                  <Form.Item
                    name="sendCoin"
                    rules={[{ required: true, message: 'Please select desired coin' }]}
                  >
                    <Select 
                      size="large" 
                      placeholder="Select your coin..."
                      onSelect={e => handleUserCoin(e)}
                    >
                      {userCoins && userCoins.map(coin => {
                        return <Option key={coin.coin} value={coin.coin}>{coin.coin}</Option>
                      })}
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name="sendAmount"
                    rules={[{ required: true, message: 'Please input desired amount' }]}
                  >
                    <Input 
                      onChange={e => handleUserAmount(e)}
                      size="large" 
                      type="number"
                      placeholder="0.00" 
                      min="0"
                      max={currCoinBalance ? currCoinBalance : null}
                      suffix={currCoin ? currCoin : null}
                      step="0.000001"

                    />
                  </Form.Item>
                  <p>Balance: {currCoinBalance && numeral(currCoinBalance).format('0,0.000000') + ' ' + currCoin}</p>

                </div>

                <SwapOutlined style={{fontSize: '30px', color: '#8c8c8c'}} />

                <div className="form-input">
                  <h2 className="box-header">Receive</h2>
                  <Form.Item
                    name="receiveCoin" 
                    rules={[{ required: true, message: 'Please select desired coin' }]}
                  >

                    <Select 
                      size="large"
                      placeholder="Select a currency..."
                      onSelect={e => handleExCoin(e)}
                    >
                      {allDenoms && allDenoms.map(coin => {
                        return <Option key={coin} value={coin}>{coin}</Option>
                      })}
                    </Select>

                  </Form.Item>
                  <p>Exchange Rate: {unitRate && "1 " + currCoin + " = " + numeral(unitRate).format('0,0.000000') + " " + exCoin}</p>
                  <p>Total: {totalRate && currCoinAmount && numeral(totalRate).format('0,0.000000') + " " + exCoin}</p>
                </div>
              </div>

              <Form.Item style={{textAlign: 'center'}}>
                <Button 
                  type="primary" 
                  htmlType="submit"
                >
                  Swap
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
          txMsg={"Swapped " + numeral(currCoinAmount).format('0,0.000000') + " " + txResult.msgs[1].offer_coin.denom + " for " + numeral(totalRate).format('0,0.000000') + " " + txResult.msgs[1].ask_denom}
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
      <h1>Swap Coins</h1>
      {renderPage()}
    </>
  );
}
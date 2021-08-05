import { LCDClient } from '@terra-money/terra.js'
import './MyWallet.css';
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from "@apollo/client";
import { GET_BALANCES, GET_ASSET_ADDRESSES } from '../../mirApiEndpoints.js';
import Chart from "react-apexcharts";
import Box from '../../components/Box/Box.js';
import Loading from '../../components/Loading/Loading.js';


import {
  useWallet,
  useConnectedWallet,
} from '@terra-money/wallet-provider'

import { Table, Statistic } from 'antd';

const numeral = require('numeral');


export default function MyWallet() {

  // Connecting to wallet via browser extension
  const {
    status,
    wallets,
  } = useWallet();

  // Wallet connect variables
  const [coins, setCoins] = useState(null);
  // const [coinPrices, setCoinPrices] = useState(null);
  const [coinBalance, setCoinBalance] = useState(null);

  const [tokens, setTokens] = useState(null);
  const [allTokens, setAllTokens] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(null);

  const [loadingBalance, setLoadingBalance] = useState(true);  

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

  const address = connectedWallet ? connectedWallet.walletAddress : "";
  const {loading: loadingMBalance, error: errorMBalance, data: dataMBalance} = useQuery(GET_BALANCES(), {
    variables: { address },
  });
  if (errorMBalance) console.log(`Error! ${errorMBalance.message}`);

  const {loading: loadingAssets, error: errorAssets, data: dataAssets} = useQuery(GET_ASSET_ADDRESSES());
  if (errorAssets) console.log(`Error! ${errorAssets.message}`);


  
  
  // Send TX to specified wallet
  useEffect(() => {
    setLoadingBalance(true);
    if(!lcd) return;
    lcd.oracle.exchangeRates().then((result) => {
      // setCoinPrices(result);
      if(connectedWallet) {
        lcd.bank.balance(connectedWallet.walletAddress).then((coins) => {
          let index = 1;
          let totalCoinBalance = 0;

          const tempArr = [];
            for (var coin in coins._coins) {
            if (coins._coins.hasOwnProperty(coin)) {
              var tempObj = {};

              tempObj['key'] = index++;
              tempObj['coin'] = coin;
              tempObj['amount'] = parseInt(coins._coins[coin].amount);
              tempObj['display'] = numeral(parseInt(coins._coins[coin].amount)/1000000).format('0,0.000000');

              // convert for uluna coins
              if(coin === 'uluna'){
                const lunaAmount = tempObj['amount']/1000000;
                tempObj['uusdPrice'] = parseFloat(lunaAmount * result._coins['uusd'].amount).toFixed(6);
              }

              // convert for rest and uusd
              if(result._coins.hasOwnProperty(coin)){
                const rawAmount = result._coins[coin].amount;
                const lunaAmount = ((tempObj['amount']/1000000)/rawAmount).toFixed(6);
                const uusdAmount = lunaAmount * result._coins['uusd'].amount;
                // makes uusdPrice for uusd its own amount
                if(coin === 'uusd'){
                  tempObj['uusdPrice'] = (tempObj['amount']/1000000).toFixed(6);
                }
                else {
                  tempObj['uusdPrice'] = uusdAmount.toFixed(6);
                }
              }
              tempObj['uusdPrice'] = parseFloat(tempObj['uusdPrice']);
              totalCoinBalance += tempObj['uusdPrice'];

              tempObj['uusdPricePretty'] = numeral(tempObj['uusdPrice']).format('0,0.000000') + ' UST';
              tempArr.push(tempObj);
            }
          }
          tempArr.sort((a, b) => (a.uusdPrice < b.uusdPrice) ? 1 : -1);
          console.log(tempArr);
          setCoins(tempArr);
          setCoinBalance(totalCoinBalance.toFixed(6));
        });
      }

      // obj object is used in MBalance for loop
      const obj = {};
      if(!loadingAssets && dataAssets){
        for(const asset of dataAssets.assets){
          if(asset.prices.price) obj[asset.token] = asset;
        }
        setAllTokens(obj);
      }

      if(!loadingMBalance && dataMBalance){
        const arr = [];
        let totalTokenBalance = 0;
        for(const asset of dataMBalance.balances){
          if(obj.hasOwnProperty(asset.token)){
            const tempObj = {...obj[asset.token], 
              balance: asset.balance, 
            }
            tempObj['value'] = (tempObj.prices.price * tempObj['balance']/1000000).toFixed(6);
            totalTokenBalance += parseFloat(tempObj['value']);
            arr.push(tempObj)
          }
        }
        setTokenBalance(totalTokenBalance.toFixed(6))
        setTokens(arr);
      }
    });

    setLoadingBalance(false);

  }, [connectedWallet, lcd, dataAssets, dataMBalance]);


  // Render balance table
  function renderBalanceRows() {
    if(!coins) return;
    return coins.map( obj => {
      return <tr key={obj.currency}>
        <td>{obj.currency}</td>
        <td>{obj.value}</td>
      </tr>
    })
  }


  function renderBalanceTable() {
    const columns = [
      {title: 'Coin', dataIndex: 'coin', key: 'coin'},
      {title: 'Amount', dataIndex: 'display', key: 'display', align: 'right',
        sorter: (a, b) => a.amount - b.amount,
        sortDirections: ['descend'],
      },
      {title: 'Value (UST)', dataIndex: 'uusdPricePretty', key: 'uusdPrice', align: 'right'},
    ];

    const mirColumns = [
      {title: 'Tokens', dataIndex: 'symbol', key: 'symbol'},
      {title: 'Amount', dataIndex: 'balance', key: 'balance', align: 'right',
        sorter: (a, b) => a.balance - b.balance,
        sortDirections: ['descend'],
      },
      {title: 'Value (UST)', dataIndex: 'valuePretty', key: 'value', align: 'right'},
    ]

    const mirData = [];
    if(tokens){
      for(const obj of tokens) {
        mirData.push({
          symbol: obj.symbol, 
          balance: numeral(obj.balance/1000000).format('0,0.000000'),
          value: obj.value, 
          valuePretty: numeral(obj.value).format('0,0.000000') + ' UST'
        });
        
      }
    }
    
    mirData.sort((a, b) => (parseFloat(a.value) < parseFloat(b.value)) ? 1 : -1);

    const mirGraphData = [];
    const mirGraphHeaders = []
    for(const b of mirData){
      mirGraphData.push(parseFloat(b.value));
      mirGraphHeaders.push(b.symbol)
    }

    const coinGraphData = [];
    const coinGraphHeaders = [];
    if(coins){
      for(const c of coins){
        coinGraphData.push(c.uusdPrice);
        coinGraphHeaders.push(c.coin);
      }
    }

    if(mirGraphData.length === 0 || mirGraphData.length === 0){
      return;
    }
    

    const graphOptions = {
      series1: mirGraphData,
      options1: {
        chart: {
          type: 'donut',

        },
        labels: mirGraphHeaders,
        theme: {
          palette: 'palette10'
        },
        legend: {
          show: false
        },
        plotOptions: {
          pie: {
            donut: {
              labels: {
                show: true,
                total: {
                  label: 'Total',
                  show: true,
                  formatter: function(w){
                    let total = 0;
                    for(const val of w.globals.seriesTotals){
                      total += val;
                    }
                    return numeral(total).format('0,0.00a') + ' UST';
                  }
                },
                value: {
                  formatter: function(val){
                    return numeral(val).format('0,0.00a') + ' UST';
                  }
                }
              }
            }
          }
        },
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: 'bottom'
            },
            
          }
        }]
      },


      series2: coinGraphData,
      options2: {
        chart: {
          type: 'donut',

        },
        labels: coinGraphHeaders,
        theme: {
          palette: 'palette10'
        },
        legend: {
          show: false
        },
        plotOptions: {
          pie: {
            donut: {
              labels: {
                show: true,
                total: {
                  label: 'Total',
                  show: true,
                  formatter: function(w){
                    let total = 0;
                    for(const val of w.globals.seriesTotals){
                      total += val;
                    }
                    return numeral(total).format('0,0.00a') + ' UST';
                  }
                },
                value: {
                  formatter: function(val){
                    return numeral(val).format('0,0.00a') + ' UST';
                  }
                }
              }
            }
          }
        },
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              width: 500
            },
            legend: {
              position: 'bottom'
            },
            
          }
        }]
      },
    }
    return <>
      <div className="box-half-container">
        <Box content={
          <div className="box-1">
            <h2 className="box-header">MIR Tokens</h2>
            <Statistic 
              title="Balance" 
              value={tokenBalance} 
              valueStyle={{fontSize: '28px'}}
              suffix="UST" 
            />
            <div className="pie-container">
              <h2 className="box-header">Token Allocation</h2>
              <Chart
                options={graphOptions.options1}
                series={graphOptions.series1}
                type="donut"
                height="300px"
              />
            </div>
          </div>
        } />

        <Box content={
          <div className="box-1">
            <h2 className="box-header">Coins</h2>
            <Statistic 
              title="Balance" 
              value={coinBalance} 
              valueStyle={{fontSize: '28px'}}
              suffix="UST" 
            />
            <div className="pie-container">
              <h2 className="box-header">Coin Allocation</h2>
              <Chart
                options={graphOptions.options2}
                series={graphOptions.series2}
                type="donut"
                height="300px"
              />
            </div>
          </div>
        } />
      </div>

      <Box content={
        <>
          <h2 className="box-header">Coins</h2>
            <Table size="small" style={{width: '100%'}} pagination={false} columns={columns} dataSource={coins ? coins : []} />
        </>
      } />

      <Box content={
        <>
          <h2 className="box-header">MIR Tokens</h2>
            <Table size="small" style={{width: '100%'}} pagination={false} columns={mirColumns} dataSource={mirData} />
        </>
      } />
    </>
  }

  function renderWalletInfo(status) {
    if(status === 'WALLET_CONNECTED'){
      return <>
          <Box content={
            <div className="wallet-address">
              <p style={{color: '#1890ff'}}><span style={{color: '#000000'}}>Your Wallet Address: </span>{wallets[0].terraAddress}</p>
            </div>
          } />
          {renderBalanceTable()}
        </>
    }

    return (
      <p>Wallet not connected!</p>
    ) 
  }  

  if(status === 'WALLET_NOT_CONNECTED') {
    return (
      <div className="container">
        <h1>Wallet</h1>
        {renderWalletInfo(status)}
      </div>
    ); 
  }

  if(status === 'INITIALIZING' 
    || loadingBalance 
    || loadingAssets 
    || loadingMBalance
    || !coinBalance
    || !tokenBalance
    || !coins
    || !allTokens 
    || !tokens
    || !dataAssets
    || !dataMBalance
  ) return <Loading />;

  else {
    return (
      <div className="container">
        <h1>Wallet</h1>
        {renderWalletInfo(status)}
      </div>
    );
  }

}
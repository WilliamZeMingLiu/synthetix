import { useQuery } from "@apollo/client";
import Loading from '../../components/Loading/Loading.js';
import Graph from '../../components/Graph/Graph.js';
import Box from '../../components/Box/Box.js';
import { GET_ASSETS, GET_ALL_STATS } from '../../mirApiEndpoints.js';
import { sparklineLineGraph, basicLineGraph, basicBarGraph } from '../../components/Graph/graphStyles.js';
import './Dashboard.css';
import React, { useState, useEffect } from 'react';

import { Table, Statistic } from 'antd';
import { CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons';

const numeral = require('numeral');


export default function Dashboard() {
  const [tokenArr, setTokenArr] = useState([]);
  const [volumeHistoryArr, setVolumeHistoryArr] = useState([]);

  // Basic stats of mirror tokens
  const [activeUsers, setActiveUsers] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [volume, setVolume] = useState(null);
  const [liquidity, setLiquidity] = useState(null);
  const [marketCap, setMarketCap] = useState(null);

  // token array gets updated every 1 sec (5000 milisec)

  const today = new Date();
  const dateNow = new Date(today);
  dateNow.setDate(dateNow.getDate());
  dateNow.setUTCHours(0,0,0,0);

  const dateStart = new Date(today);
  dateStart.setDate(dateStart.getDate() - 30);
  dateStart.setUTCHours(0,0,0,0);

  const {
    loading: loadingTokenArr, 
    error: errorTokenArr, 
    data: dataTokenArr
  } = useQuery(GET_ASSETS(), {
    pollInterval: 5000,
    variables: {
      startDate: dateStart.getTime(),
      endDate: dateNow.getTime(),
    },
  });
  if (errorTokenArr) console.log(`Error! ${errorTokenArr.message}`);

  const {
    loading: loadingStat, 
    error: errorStat, 
    data: dataStat
  } = useQuery(GET_ALL_STATS(), {
    pollInterval: 5000,
    variables: {
      startDate: dateStart.getTime(),
      endDate: dateNow.getTime(),
    }
  });
  if (errorStat) console.log(`Error! ${errorStat.message}`);

  useEffect(() => {
    if(!loadingTokenArr && dataTokenArr){
      const tempArr = [];
      let i = 1;
      dataTokenArr.assets.forEach((e) => {
        if(e.prices.price){
          const tempObj = {};
          tempObj['key'] = String(i++);
          tempObj['tickerHtml'] = <p><b>{e.symbol}</b><br/>{e.name}</p>;
          tempObj['ticker'] = e.symbol;

          tempObj['marketCap'] = parseFloat(e.statistic.marketCap/1000000);
          tempObj['marketCapPretty'] = numeral(tempObj['marketCap']).format('0,0.00a') + " UST";

          tempObj['price'] = parseFloat(e.prices.price);
          tempObj['pricePretty'] = numeral(tempObj['price']).format('0,0.00') + " UST";

          tempObj['priceHistory'] = e.prices.history;
          
          const todayPrice = parseFloat(e.prices.history[e.prices.history.length-1].price);
          const yesterdayPrice = parseFloat(e.prices.history[e.prices.history.length-2].price);

          tempObj['priceChange'] = ((todayPrice - yesterdayPrice)/yesterdayPrice).toFixed(4);
          tempObj['priceChangePretty'] = <p>{(tempObj['priceChange']*100).toFixed(2) + '%'}</p>;
          if(tempObj['priceChange'] > 0){
            tempObj['priceChangePretty'] = <p className="perPositive"><CaretUpOutlined />{(tempObj['priceChange']*100).toFixed(2) + '%'}</p>;
          }
          else if(tempObj['priceChange'] < 0){
            tempObj['priceChangePretty'] = <p className="perNegative"><CaretDownOutlined />{(tempObj['priceChange']*100).toFixed(2) + '%'}</p>;
          }

          const timeColumns = [];
          const priceData = [];

          for(const obj of e.prices.history) {
            timeColumns.push(obj.timestamp);
            priceData.push(parseFloat(obj.price));
          }

          const priceChangeGraphStyle = sparklineLineGraph(priceData, timeColumns, "Price");
          tempObj['priceChangeGraph'] = (
            <Graph
              options={priceChangeGraphStyle.options}
              series={priceChangeGraphStyle.series}
              type="area"
              height="50px"
            />
          )

          const volume = e.statistic.volume/1000000;
          tempObj['volume'] = parseFloat(volume);
          tempObj['volumePretty'] = numeral(tempObj['volume']).format('0,0.00') + " UST";

          const liquidity = e.statistic.liquidity/1000000;
          tempObj['liquidity'] = parseFloat(liquidity);
          tempObj['liquidityPretty'] = numeral(tempObj['liquidity']).format('0,0.00a') + " UST";

          tempArr.push(tempObj);
        }
      });
      setTokenArr(tempArr);
    }
    if(!loadingStat && dataStat){
      setActiveUsers(dataStat.statistic.today.activeUsers);
      setTransactions(dataStat.statistic.today.transactions);
      setMarketCap(numeral(dataStat.statistic.assetMarketCap/1000000).format('0,0.00a'));
      setVolume(numeral(dataStat.statistic.today.volume/1000000).format('0,0.00a'));
      setLiquidity(numeral(dataStat.statistic.totalValueLocked.liquidity/1000000).format('0,0.00a'));
      
      const tempArr = [];
      for(const obj of dataStat.statistic.tradingVolumeHistory){
        tempArr.push({timestamp: obj.timestamp, value: obj.value})
      }
      setVolumeHistoryArr(tempArr);
      
    }
  }, [dataTokenArr, dataStat, loadingStat, loadingTokenArr])
  
  function renderAssetTable() {
    const columns = [
      {title: 'Ticker', dataIndex: 'tickerHtml', key: 'ticker'},
      {title: 'Price', dataIndex: 'pricePretty', key: 'price', align: 'right'},
      {title: 'Liquidity', dataIndex: 'liquidityPretty', key: 'liquidity', align: 'right'},
      {title: 'Change', dataIndex: 'priceChangePretty', key: 'priceChange', align: 'right',
        sorter: (a, b) => a.priceChange - b.priceChange,
        sortDirections: ['descend'],
      },
      {title: 'Last 30 days', dataIndex: 'priceChangeGraph', key: 'priceChangeGraph', align: 'right'},

    ];

    return <Table 
        columns={columns} 
        dataSource={tokenArr}
        pagination={false}
        sticky
      />
  }

  // Liquidity table
  const liqData = [];
  for(const obj of tokenArr){
    const tempObj = {
      ticker: obj.ticker, 
      liquidity: obj.liquidity,
      liquidityPretty: obj.liquidityPretty}
    liqData.push(tempObj)
  }
  liqData.sort((a, b) => (a.liquidity < b.liquidity) ? 1 : -1);
  
  const liqColumns = [
    {title: 'Ticker', dataIndex: 'ticker', key: 'ticker'},
    {title: 'Liquidity', dataIndex: 'liquidityPretty', key: 'liquidity', align: 'right'},
  ]

  // market cap table
  const marketCapData = [];
  for(const obj of tokenArr){
    const tempObj = {
      ticker: obj.ticker, 
      marketCap: obj.marketCap,
      marketCapPretty: obj.marketCapPretty}
    marketCapData.push(tempObj)
  }
  marketCapData.sort((a, b) => (a.marketCap < b.marketCap) ? 1 : -1);

  const marketCapColumns = [
    {title: 'Ticker', dataIndex: 'ticker', key: 'ticker'},
    {title: 'Market Cap', dataIndex: 'marketCapPretty', key: 'marketCap', align: 'right'},
  ]


  // volume trading history
  const volumeHistoryData = [];
  const volumeHistoryColumns = [];
  for(const obj of volumeHistoryArr){
    volumeHistoryColumns.push(obj.timestamp);
    volumeHistoryData.push(obj.value/1000000);
  }

  tokenArr.sort((a, b) => (a.marketCap < b.marketCap) ? 1 : -1);
  const priceHistoryColumns = [];
  const priceHistoryData = [];
  // const priceHistoryNames = {};
  for(const obj of tokenArr) {
    if(obj.ticker === 'MIR'){
      for(const x of obj.priceHistory){
        priceHistoryData.push(parseFloat(x.price));
        priceHistoryColumns.push(x.timestamp);
      }
    }
    break;
  }
  
  const volumeLeaderData = [];
  const volumeLeaderColumns = [];
  if(tokenArr.length > 0){
    tokenArr.sort((a, b) => (a.volume < b.volume) ? 1 : -1);
    for(const obj of tokenArr){
      volumeLeaderData.push(obj.volume);
      volumeLeaderColumns.push(obj.ticker);
    }
    tokenArr.sort((a, b) => (a.liquidity < b.liquidity) ? 1 : -1);
  }
  
  const volumeHistoryStyle = basicLineGraph(volumeHistoryData, volumeHistoryColumns, "Volume");
  const volumeLeaderStyle = basicBarGraph(volumeLeaderData.slice(0,10), volumeLeaderColumns.slice(0,10), "Volume");

  if(loadingTokenArr || loadingStat) {
    return (
      <Loading />
    )
  }

  return (
    <>
      <h1>Dashboard</h1>
      <Box content={
        <div className="half-inside-box">
          <div className="inner-1">
            <h2 className="box-header">Volume (UTC)</h2>
            <Statistic 
              title="Total" 
              value={volume} 
              valueStyle={{fontSize: '28px'}}
              suffix="UST" 
            />
            <Statistic 
              title="Transactions" 
              value={transactions}
              valueStyle={{fontSize: '28px'}}
            />
            <Statistic 
              title="Active Users" 
              value={activeUsers}
              valueStyle={{fontSize: '28px'}}
            />
          </div>
          <div className="inner-2">
            <h2 className="box-header">Volume Leaders</h2>
            <Graph
              options={volumeLeaderStyle.options}
              series={volumeLeaderStyle.series}
              type="bar"
              height="200px"
            />
          </div>
        </div>
      } />

      <Box content={
        <div className="inner-4">
          <h2 className="box-header">Volume History (last 30 UTC days)</h2>
          <Graph
            options={volumeHistoryStyle.options}
            series={volumeHistoryStyle.series}
            type="area"
            height="200px"
          />
        </div>
      } />


      <div className="box-half-container">
        <div className="inner-3">
          <Box content={
            <>
              <h2 className="box-header">Market Cap</h2>
              <div className="stat">
                <Statistic 
                  value={marketCap} 
                  valueStyle={{fontSize: '28px'}}
                  suffix="UST" 
                />
                <div className="small-table">
                  <Table 
                    columns={marketCapColumns} 
                    dataSource={marketCapData}
                    size="small"
                    scroll={{ y: 160 }}
                    pagination={false}
                  />
                </div>
              </div>
            </>
          } />
        </div>
        <div className="inner-3">
          <Box content={
            <>
              <h2 className="box-header">Liquidity</h2>
              <div className="stat">
                <Statistic 
                  value={liquidity} 
                  valueStyle={{fontSize: '28px'}}
                  suffix="UST" 
                />
                <div className="small-table">
                  <Table 
                    columns={liqColumns} 
                    dataSource={liqData}
                    size="small"
                    scroll={{ y: 160 }}
                    pagination={false}
                  />
                </div>
              </div>
            </>
          } />
        </div>
      </div>

      <Box content={
        <>
          <h2 className="box-header">MIR Tokens</h2>
          {renderAssetTable()}
        </>
      } />

    </>
  );
}
import { gql } from "@apollo/client";

export const GET_ASSETS = () => {
  return gql`
    query Assets($startDate: Float!, $endDate: Float!)  {
      assets {
        symbol,
        name,
        description,
        token,
        pair, 
        prices {
          price,
          history(interval: 1440, to: $endDate, from: $startDate) {
            timestamp,
            price
          }
        },
        statistic {
          liquidity(network:COMBINE),
          volume(network:COMBINE),
          marketCap(network:COMBINE),
        },
        news {
          datetime,
          headline,
          source,
          url,
          summary
        }
      }
    }
  `
}

export const GET_ASSET_ADDRESSES = () => {
  return gql `
    query {
      assets{
        symbol,
        name,
        token,
        pair,
        prices {
          price,
        },
      }
    }
  `
}

export const GET_ALL_STATS = () => {

  return gql`
    query Stat($startDate: Float!, $endDate: Float!) {
      statistic {
        network,
        assetMarketCap,
        totalValueLocked{
          liquidity,
        },
        today{
          transactions,
          volume,
          activeUsers
        },
        liquidityHistory(to: $endDate, from: $startDate){
          timestamp,
          value
        },
        tradingVolumeHistory(to: $endDate, from: $startDate){
          timestamp,
          value
        }
      }
    }
  `
}


export const GET_BALANCES = () => {
  return gql `
    query Balance($address: String!) {
      balances(address: $address) {
        token,
        balance,
        averagePrice
      }
    }
  `
}






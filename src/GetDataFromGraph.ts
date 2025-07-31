import { gql, request } from 'graphql-request'

// 这个数据是用在展示用户的行为操作
///eventName: Transfer or Approve
/// 这里演示是0x9C126aa4Eb6D110D646139969774F2c5b64dD279地址的转账和接收数据
/// 可以去掉eventName这个条件，那获取的就是包含approve的数据。
/// 去掉toAddress这个条件，就是改地址作为发起人的交易
const query = gql`
{
  userActivities(
    where: {
      or: [
        {
          eventName: "Transfer"
          fromAddress: "0x9C126aa4Eb6D110D646139969774F2c5b64dD279"
        }
        {
          eventName: "Transfer"
          toAddress: "0x9C126aa4Eb6D110D646139969774F2c5b64dD279"
        }
      ]
    }
    orderBy: blockTimestamp
    orderDirection: desc
  ) {
    fromAddress
    eventName
    blockNumber
    blockTimestamp
    counterparty
    logIndex
    status
    toAddress
    token {
      address
      symbol
      name
    }
    value
    transactionHash
    activityType
  }
}`

/// 加入了一个where条件，筛选出特定token的记录
const query2 = gql`
{
  userActivities(
    where: {
      and:[
        {
          or: [
            {
                eventName: "Transfer"
                fromAddress: "0x9C126aa4Eb6D110D646139969774F2c5b64dD279"
            }
            {
                eventName: "Transfer"
                toAddress: "0x9C126aa4Eb6D110D646139969774F2c5b64dD279"
            }
          ]
        }
        {
            token: "0xe3f8d5c7ab656594e1cb6fbf70be66089bfb87b3"
        }
      ]
      
    }
    orderBy: blockTimestamp
    orderDirection: desc
  ) {
    fromAddress
    eventName
    blockNumber
    blockTimestamp
    counterparty
    logIndex
    status
    toAddress
    token {
      address
      symbol
      name
    }
    value
    transactionHash
    activityType
  }
}`

const url = 'https://api.studio.thegraph.com/query/103887/yi/version/latest'
const headers = { Authorization: `Bearer ${process.env['GRAPH_API_KEY']}` }

async function fetchSubgraphData() {
  return await request(url, query, {}, headers)
}
fetchSubgraphData().then((data) => console.log(JSON.stringify(data, null, 2))).catch(console.error)
      
async function fetchSubgraphData2() {
  return await request(url, query2, {}, headers)
}
fetchSubgraphData2().then((data) => console.log(JSON.stringify(data, null, 2))).catch(console.error)
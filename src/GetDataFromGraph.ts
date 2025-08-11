import { gql, request } from 'graphql-request'

// 这个数据是用在展示用户的行为操作
///eventName: Transfer or Approve
/// 这里演示是0x9C126aa4Eb6D110D646139969774F2c5b64dD279地址的转账和接收数据
/// 可以去掉eventName这个条件，那获取的就是包含approve的数据。
/// 去掉toAddress这个条件，就是改地址作为发起人的交易
/// 地址要小写
const query = gql`
{
  userActivities(where: {user: "0xcb7a8c5364c7f06b7f77052fda4b23582acd3879"}) {
    id
    value
    transactionHash
    toAddress
    status
    logIndex
    fromAddress
    eventName
    counterparty
    blockTimestamp
    blockNumber
    activityType
  }
}`

/// 加入了一个where条件，筛选出特定token的记录
const query2 = gql`
{
  userActivities(
    where: {user: "0xcb7a8c5364c7f06b7f77052fda4b23582acd3879", token: "0xc6c98285ae278b94627f0a3754f2f2944f0db1c2"}
  ) {
    id
    value
    transactionHash
    toAddress
    status
    logIndex
    fromAddress
    eventName
    counterparty
    blockTimestamp
    blockNumber
    activityType
    token {
      address
      symbol
      name
    }
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
import * as dotenv from 'dotenv';
import { SafeUtils } from './utils/SafeUtils';

dotenv.config();

/////这个脚本演示了怎么修改多签钱包的配置
/// 包含了一下示例
// 1. 增加一个owner
// 2. 删除一个owner
// 3. 修改多签的需要的签名数量

let safeUtil: SafeUtils
let safeUtil2: SafeUtils
const safeAddress = "0xB7c479d52C7e0ca201B017A7C070927E4d2BA516"

async function init(): Promise<void> {
    safeUtil = new SafeUtils(process.env['PRIVATE_KEY']!, safeAddress)
    await safeUtil.initSafe()
    safeUtil2 = new SafeUtils(process.env['PRIVATE_KEY_USER2']!, safeAddress)
    await safeUtil2.initSafe()
}

async function addOwner(): Promise<void> {
    try {
        //用户1构造交易并签名提交到服务器
        const safeTransaction = await safeUtil.protocolKit.createAddOwnerTx({
            ownerAddress: '0xfBf75C9EEE56432aD1F12D6d3816EB027610f675',
        })
        const safeTransactionHash = await safeUtil.protocolKit.getTransactionHash(safeTransaction)
        //用户1提交交易到服务器
        await safeUtil.executeTransactionFlow(safeTransaction.data, safeTransactionHash)


        //用户2查询pending交易,并签名提交到服务器
        const pendingTxs = await safeUtil2.apiKit.getPendingTransactions(safeUtil.safeAddress)
        console.log('pendingTxs:', pendingTxs)
        let pendingSafeTxHash = (pendingTxs as any).results[0].safeTxHash
        let tx = await safeUtil2.apiKit.getTransaction(pendingSafeTxHash)
        // 用pending中的数据重新构造交易数据，模拟用户2客户端
        const pendingData = {
            to: tx.to,
            value: tx.value,
            data: tx.data,
            operation: tx.operation,
            baseGas: tx.baseGas,
            gasPrice: tx.gasPrice,
            gasToken: tx.gasToken,
            refundReceiver: tx.refundReceiver,
            nonce: tx.nonce,
            safeTxGas: tx.safeTxGas,
        }
        //pendingSafeTxHash 和 safeTransactionHash 是同一个交易，比较一下
        if (pendingSafeTxHash !== safeTransactionHash) {
            throw new Error('pendingSafeTxHash 和 safeTransactionHash 不是同一个交易')
        }
        await safeUtil2.executeTransactionFlow(pendingData, pendingSafeTxHash)
        //用户2上链
        await safeUtil2.waitAndExecuteTransaction(pendingSafeTxHash)
    } catch (error) {
        throw error;
    }
}

async function removeOwner(): Promise<void> {
    try {
        //用户1构造交易并签名提交到服务器
        const safeTransaction = await safeUtil.protocolKit.createRemoveOwnerTx({
            ownerAddress: '0xfBf75C9EEE56432aD1F12D6d3816EB027610f675',
        })
        const safeTransactionHash = await safeUtil.protocolKit.getTransactionHash(safeTransaction)
        //用户1提交交易到服务器
        await safeUtil.executeTransactionFlow(safeTransaction.data, safeTransactionHash)



        //用户2查询pending交易,并签名提交到服务器
        const pendingTxs = await safeUtil2.apiKit.getPendingTransactions(safeUtil.safeAddress)
        console.log('pendingTxs:', pendingTxs)
        let pendingSafeTxHash = (pendingTxs as any).results[0].safeTxHash
        let tx = await safeUtil2.apiKit.getTransaction(pendingSafeTxHash)
        // 用pending中的数据重新构造交易数据，模拟用户2客户端
        const pendingData = {
            to: tx.to,
            value: tx.value,
            data: tx.data,
            operation: tx.operation,
            baseGas: tx.baseGas,
            gasPrice: tx.gasPrice,
            gasToken: tx.gasToken,
            refundReceiver: tx.refundReceiver,
            nonce: tx.nonce,
            safeTxGas: tx.safeTxGas,
        }
        //pendingSafeTxHash 和 safeTransactionHash 是同一个交易，比较一下
        if (pendingSafeTxHash !== safeTransactionHash) {
            throw new Error('pendingSafeTxHash 和 safeTransactionHash 不是同一个交易')
        }
        await safeUtil2.executeTransactionFlow(pendingData, pendingSafeTxHash)
        //用户2上链
        await safeUtil2.waitAndExecuteTransaction(pendingSafeTxHash) 
    } catch (error) {
        throw error;
    }
}

async function changeThreshold(): Promise<void> {
    try {
        //用户1构造交易并签名提交到服务器
        const safeTransaction = await safeUtil.protocolKit.createChangeThresholdTx(2)
        const safeTransactionHash = await safeUtil.protocolKit.getTransactionHash(safeTransaction)
        //用户1提交交易到服务器
        await safeUtil.executeTransactionFlow(safeTransaction.data, safeTransactionHash)
        


        //用户2查询pending交易,并签名提交到服务器
        const pendingTxs = await safeUtil2.apiKit.getPendingTransactions(safeUtil.safeAddress)
        console.log('pendingTxs:', pendingTxs)
        let pendingSafeTxHash = (pendingTxs as any).results[0].safeTxHash
        let tx = await safeUtil2.apiKit.getTransaction(pendingSafeTxHash)
        // 用pending中的数据重新构造交易数据，模拟用户2客户端
        const pendingData = {
            to: tx.to,
            value: tx.value,
            data: tx.data,
            operation: tx.operation,
            baseGas: tx.baseGas,
            gasPrice: tx.gasPrice,
            gasToken: tx.gasToken,
            refundReceiver: tx.refundReceiver,
            nonce: tx.nonce,
            safeTxGas: tx.safeTxGas,
        }
        //pendingSafeTxHash 和 safeTransactionHash 是同一个交易，比较一下
        if (pendingSafeTxHash !== safeTransactionHash) {
            throw new Error('pendingSafeTxHash 和 safeTransactionHash 不是同一个交易')
        }
        await safeUtil2.executeTransactionFlow(pendingData, pendingSafeTxHash)
        //用户2上链
        await safeUtil2.waitAndExecuteTransaction(pendingSafeTxHash)        
    } catch (error) {
        throw error;
    }
}




async function main(): Promise<void> {
    try {
        console.log('================================================\n');
        await init()
        // await addOwner();
        // await removeOwner();
        await changeThreshold();
        
    } catch (error) {
        console.error('失败:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export {
    addOwner,
    removeOwner,
    changeThreshold,
}; 
import * as dotenv from 'dotenv';
import {RECIPIENT_ADDRESS, SafeUtils } from './utils/SafeUtils';

dotenv.config();

/////这个脚本演示了如何使用查询多签钱包的配置
/// 包含了一下示例
// 1. 查询某个地址参与的多签
// 2. 获取多签钱包的owners
// 3. 获取多签需要多少个签名才能执行交易
// 4. 获取多签钱包的incomingTxs（收token的交易）
// 5. 获取多签钱包的pendingTxs （待签名的交易）
// 6. 获取多签钱包的allTxs （所有交易）
// 7. 通过safeTxHash获取交易签名详情, safeTxHash在sendTx的例子中可以找到
// 8. 通过safeTxHash获取交易已经有那些人签名了

async function get(): Promise<void> {
    try {
        const safeAddress = "0xB7c479d52C7e0ca201B017A7C070927E4d2BA516"
        const safeUtil = new SafeUtils(process.env['PRIVATE_KEY']!, safeAddress)
        await safeUtil.initSafe()

        // 查询某个地址参与的多签
        const decodeData = await safeUtil.apiKit.getSafesByOwner(RECIPIENT_ADDRESS)
        console.log('参与的多签:', decodeData)

        //获取多签钱包的owners
        const owners = await safeUtil.protocolKit.getOwners()
        console.log('多签钱包所有者:', owners)
        //获取多签需要多少个签名才能执行交易
        const threshold = await safeUtil.protocolKit.getThreshold()
        console.log('多签需要多少个签名才能执行交易:', threshold)

        //获取多签钱包的incomingTxs
        const incomingTxs = await safeUtil.apiKit.getIncomingTransactions(safeAddress)
        console.log('多签钱包的incomingTxs:', incomingTxs)

        //获取多签钱包的pendingTxs
        const pendingTxs = await safeUtil.apiKit.getPendingTransactions(safeAddress)
        console.log('多签钱包的pendingTxs:', pendingTxs)

        //获取多签钱包的allTxs
        const config = {
            executed: true,
            queued: true,
            trusted: true
        }
        const allTxs = await safeUtil.apiKit.getAllTransactions(safeAddress, config as any)
        console.log('多签钱包的allTxs:', allTxs)


        //通过safeTxHash获取交易签名详情, safeTxHash在sendTx的例子中可以找到
        const tx = await safeUtil.apiKit.getTransaction("0x9e4e36fab845e19dbd048dc3c4c598ee426d6373afae45d9030371b508b7eb5a")
        console.log('交易详情:', tx)
        //通过safeTxHash获取交易已经有那些人签名了
        const confirmations = await safeUtil.apiKit.getTransactionConfirmations("0x9e4e36fab845e19dbd048dc3c4c598ee426d6373afae45d9030371b508b7eb5a")
        console.log('交易签名情况:', confirmations)
    } catch (error) {
        throw error;
    }
}




async function main(): Promise<void> {
    try {
        console.log('================================================\n');

        await get();
        
    } catch (error) {
        console.error('失败:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export {
    get,
}; 
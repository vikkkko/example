import * as dotenv from 'dotenv';
import { SafeUtils, TOKEN_ADDRESS as USDT, RECIPIENT_ADDRESS, ERC20_ABI} from './utils/SafeUtils';
import { ethers } from 'ethers';

dotenv.config();

/////这个脚本演示了如何使用Safe SDK发送ERC20代币转账交易
///// 创建出来的多签钱包是没有eth和usdt的，需要先给多签钱包转账eth和usdt
let safeUtil: SafeUtils
let safeUtil2: SafeUtils
const safeAddress = "0xB7c479d52C7e0ca201B017A7C070927E4d2BA516"
const TRANSFER_AMOUNT = "1.0"

async function init(): Promise<void> {
    safeUtil = new SafeUtils(process.env['PRIVATE_KEY']!, safeAddress)
    await safeUtil.initSafe()
    safeUtil2 = new SafeUtils(process.env['PRIVATE_KEY_USER2']!, safeAddress)
    await safeUtil2.initSafe()
}

async function sendTx(): Promise<void> {
    try {
        // 创建ERC20代币合约实例
        const tokenContract = safeUtil.createTokenContract(USDT)
        
        // 获取代币信息
        const {tokenSymbol, tokenDecimals, } = await safeUtil.getTokenInfo(USDT)

        // 检查Safe钱包中的代币余额
        const safeTokenBalance = await tokenContract.balanceOf(safeAddress);
        console.log('Safe钱包代币余额:', safeTokenBalance)

        // 计算转账数量（考虑代币精度）
        const transferAmount = ethers.parseUnits(TRANSFER_AMOUNT, tokenDecimals);
        console.log(`准备转账: ${TRANSFER_AMOUNT} ${tokenSymbol} 到 ${RECIPIENT_ADDRESS}`);

        // 检查余额是否足够
        if (safeTokenBalance < transferAmount) {
            throw new Error(`Safe钱包代币余额不足: ${ethers.formatUnits(safeTokenBalance, tokenDecimals)} ${tokenSymbol}`);
        }


        // 创建ERC20转账交易数据
        const tokenInterface = new ethers.Interface(ERC20_ABI);
        const transferData = tokenInterface.encodeFunctionData('transfer', [RECIPIENT_ADDRESS, transferAmount]);

        console.log('创建ERC20转账交易...');
        const safeTransactionData = await safeUtil.protocolKit.createTransaction({
            transactions: [
                {
                    to: USDT, // 代币合约地址
                    value: '0', // ERC20转账不需要发送ETH
                    data: transferData, // 编码后的transfer函数调用
                    operation: 0,
                }
            ]
        });
        const safeTransactionHash = await safeUtil.protocolKit.getTransactionHash(safeTransactionData)
        await safeUtil.executeTransactionFlow(safeTransactionData.data, safeTransactionHash)




        // 用户2查询pending交易,并签名提交到服务器
        const pendingTxs = await safeUtil2.apiKit.getPendingTransactions(safeAddress)
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
        await safeUtil2.executeTransactionFlow(pendingData, pendingSafeTxHash)
        await safeUtil2.waitAndExecuteTransaction(pendingSafeTxHash)
    } catch (error) {
        console.error('ERC20转账失败:', error instanceof Error ? error.message : String(error));
        if (error instanceof Error && 'code' in error && error.code === 'INSUFFICIENT_FUNDS') {
            console.log('请确保账户有足够的ETH支付gas费用');
        }
        throw error;
    }
}

async function main(): Promise<void> {
    try {
        console.log('================================================\n');
        await init()
        await sendTx();
        
        console.log('交易发送完成!');
        
    } catch (error) {
        console.error('失败:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export {
    sendTx,
}; 
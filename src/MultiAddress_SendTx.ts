import Safe from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'
import { sepolia } from 'viem/chains'
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

/////这个脚本演示了如何使用Safe SDK发送ERC20代币转账交易
///// 创建出来的多签钱包是没有eth和usdt的，需要先给多签钱包转账eth和usdt

// ERC20代币ABI
const ERC20_ABI = [
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)",
    "function name() external view returns (string)"
];

// Sepolia测试网配置
const SEPOLIA_RPC_URL = `https://sepolia.infura.io/v3/${process.env['INFURA_PROJECT_ID']}`; // 请替换为您的Infura项目ID

// ERC20代币配置
const TOKEN_ADDRESS = '0xEDC9b422dC055939F63e9Dc808ACEc05B515C28e'; // usdt
const RECIPIENT_ADDRESS = '0x9C126aa4Eb6D110D646139969774F2c5b64dD279'; // 接收地址
const TRANSFER_AMOUNT = '1.0'; // 转账数量
// 多签钱包地址，这个是通过createMultiAddress.ts脚本创建的
const safeAddress = '0xB7c479d52C7e0ca201B017A7C070927E4d2BA516';


async function sendTx(): Promise<void> {
    try {
        // 检查环境变量
        if (!process.env['PRIVATE_KEY']) {
            throw new Error('请添加.env文件并设置环境变量 PRIVATE_KEY');
        }

        // 创建provider和signer
        const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
        const signer = new ethers.Wallet(process.env['PRIVATE_KEY'], provider);

        console.log('使用地址:', signer.address);
        const network = await provider.getNetwork();
        console.log('当前ChainID:', network.chainId.toString());

        // 检查账户余额
        const balance = await provider.getBalance(signer.address);
        console.log('账户余额:', ethers.formatEther(balance), 'ETH');

        // 创建ERC20代币合约实例
        const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, provider) as any;
        
        // 获取代币信息
        const tokenSymbol = await tokenContract.symbol();
        const tokenDecimals = await tokenContract.decimals();
        const tokenName = await tokenContract.name();
        
        console.log(`代币信息: ${tokenName} (${tokenSymbol})`);
        console.log(`代币地址: ${TOKEN_ADDRESS}`);
        console.log(`代币精度: ${tokenDecimals}`);

        // 检查Safe钱包中的代币余额
        const safeTokenBalance = await tokenContract.balanceOf(safeAddress);
        console.log(`Safe钱包代币余额: ${ethers.formatUnits(safeTokenBalance, tokenDecimals)} ${tokenSymbol}`);

        // 计算转账数量（考虑代币精度）
        const transferAmount = ethers.parseUnits(TRANSFER_AMOUNT, tokenDecimals);
        console.log(`准备转账: ${TRANSFER_AMOUNT} ${tokenSymbol} 到 ${RECIPIENT_ADDRESS}`);

        // 检查余额是否足够
        if (safeTokenBalance < transferAmount) {
            throw new Error(`Safe钱包代币余额不足: ${ethers.formatUnits(safeTokenBalance, tokenDecimals)} ${tokenSymbol}`);
        }

        console.log('初始化Safe SDK...');
        const protocolKit = await Safe.init({
            provider: sepolia.rpcUrls.default.http[0],
            signer: process.env['PRIVATE_KEY'],
            safeAddress: safeAddress,
        });

        // 创建ERC20转账交易数据
        const tokenInterface = new ethers.Interface(ERC20_ABI);
        const transferData = tokenInterface.encodeFunctionData('transfer', [RECIPIENT_ADDRESS, transferAmount]);

        console.log('创建ERC20转账交易...');
        const safeTransactionData = await protocolKit.createTransaction({
            transactions: [
                {
                    to: TOKEN_ADDRESS, // 代币合约地址
                    value: '0', // ERC20转账不需要发送ETH
                    data: transferData, // 编码后的transfer函数调用
                    operation: 0,
                }
            ]
        });

        console.log('交易数据创建成功!');
        console.log('交易详情:', {
            to: TOKEN_ADDRESS,
            value: '0',
            data: transferData
        });

        // 签名交易
        console.log('签名交易...');
        await protocolKit.signTransaction(safeTransactionData);
        console.log('交易签名完成!');

        // 执行交易 会失败，是因为这里只有一个人的签名，需要其他人的签名
        // console.log('执行交易...');
        // const txResponse = await protocolKit.executeTransaction(safeTransactionData);
        // console.log('交易已提交!');
        // console.log('交易哈希:', (txResponse as any).transactionHash);

        // 正确的流程是先提交给安全服务器
        console.log('初始化Safe API Kit...');
        const apiKit = new SafeApiKit({
            chainId: BigInt(sepolia.id),
        });
        
        console.log('提交交易到Safe服务器...');
        console.log('注意：这里只是提交交易，需要其他签名者确认后才能执行');
        console.log('Safe交易哈希:', (safeTransactionData as any).safeTxHash);

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
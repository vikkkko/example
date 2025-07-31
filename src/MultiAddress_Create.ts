import Safe, {
    PredictedSafeProps
  } from '@safe-global/protocol-kit'
  import { sepolia } from 'viem/chains'
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

/////这个脚本演示了如何使用Safe SDK创建多签钱包

// Sepolia测试网配置
const SEPOLIA_RPC_URL = `https://sepolia.infura.io/v3/${process.env['INFURA_PROJECT_ID']}`; // 请替换为您的Infura项目ID

// 多签钱包配置
const OWNERS = [
    '0x9C126aa4Eb6D110D646139969774F2c5b64dD279', // 请替换为实际的钱包地址
    '0xeB7E951F2D1A38188762dF12E0703aE16F76Ab73',
    '0x74f4EFFb0B538BAec703346b03B6d9292f53A4CD'
];
const THRESHOLD = 2; // 需要2个签名才能执行交易


async function createMultiAddress(): Promise<string> {
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

        // 创建Safe配置
        const safeAccountConfig = {
            owners: OWNERS,
            threshold: THRESHOLD,
        };

        //离线创建多签钱包，此时还没有部署到链上
        console.log('离线创建多签钱包...')
        const predictedSafe: PredictedSafeProps = {
            safeAccountConfig
        }
        const protocolKit = await Safe.init({
            provider: sepolia.rpcUrls.default.http[0],
            signer: process.env['PRIVATE_KEY'],
            predictedSafe,
          })
        const safeAddress = await protocolKit.getAddress();
        console.log('多签钱包地址:', safeAddress)

        const owners = await protocolKit.getOwners()
        console.log('多签钱包所有者:', owners)

        // 部署多签钱包到链上
        console.log('开始部署多签钱包...')
        const deploymentTransaction = await protocolKit.createSafeDeploymentTransaction()
        const client = await protocolKit.getSafeProvider().getExternalSigner()
        
        if (!client) {
            throw new Error('无法获取外部签名者');
        }
        
        const txHash = await client.sendTransaction({
            to: deploymentTransaction.to,
            value: BigInt(deploymentTransaction.value),
            data: deploymentTransaction.data as `0x${string}`,
            chain: sepolia
        })
        const transactionReceipt = await provider.waitForTransaction(txHash)
        console.log('交易哈希:', txHash)
        console.log('交易收据:', transactionReceipt)

        return safeAddress;

    } catch (error) {
        console.error('创建多签钱包失败:', error instanceof Error ? error.message : String(error));
        if (error instanceof Error && 'code' in error && error.code === 'INSUFFICIENT_FUNDS') {
            console.log('请确保账户有足够的ETH支付gas费用');
        }
        throw error;
    }
}




async function main(): Promise<void> {
    try {
        console.log('================================================\n');

        // 创建多签钱包
        const walletAddress = await createMultiAddress();
        
        console.log('多签钱包创建完成!');
        console.log('钱包地址:', walletAddress);
        
    } catch (error) {
        console.error('失败:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export {
    createMultiAddress,
}; 
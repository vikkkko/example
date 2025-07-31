import Safe from '@safe-global/protocol-kit'
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

/////这个脚本演示了如何使用查询多签钱包的配置

// Sepolia测试网配置
const SEPOLIA_RPC_URL = `https://sepolia.infura.io/v3/${process.env['INFURA_PROJECT_ID']}`; // 请替换为您的Infura项目ID

const safeAddress = '0xB7c479d52C7e0ca201B017A7C070927E4d2BA516';

async function get(): Promise<void> {
    try {
        // 检查环境变量
        if (!process.env['PRIVATE_KEY']) {
            throw new Error('请添加.env文件并设置环境变量 PRIVATE_KEY');
        }

        // 创建provider和signer
        const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
        const signer = new ethers.Wallet(process.env['PRIVATE_KEY'], provider);

        const protocolKit = await Safe.init({
            provider: SEPOLIA_RPC_URL,
            signer: signer.address,
            safeAddress: safeAddress
          })

        //获取多签钱包的owners
        const owners = await protocolKit.getOwners()
        console.log('多签钱包所有者:', owners)
        //获取多签需要多少个签名才能执行交易
        const threshold = await protocolKit.getThreshold()
        console.log('多签需要多少个签名才能执行交易:', threshold)

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
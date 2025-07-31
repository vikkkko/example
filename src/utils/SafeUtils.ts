import Safe from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

// 通用配置
export const SEPOLIA_RPC_URL = `https://sepolia.infura.io/v3/${process.env['INFURA_PROJECT_ID']}`;
export const SAFE_ADDRESS = '0xB7c479d52C7e0ca201B017A7C070927E4d2BA516'; //默认测试的多签钱包地址，按需修改

// ERC20代币配置
export const TOKEN_ADDRESS = '0xEDC9b422dC055939F63e9Dc808ACEc05B515C28e'; // USDT
export const RECIPIENT_ADDRESS = '0x9C126aa4Eb6D110D646139969774F2c5b64dD279'; //接收地址，按需修改

// ERC20代币ABI
export const ERC20_ABI = [
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)",
    "function name() external view returns (string)"
];

// 多签钱包配置
export const OWNERS = [
    '0x9C126aa4Eb6D110D646139969774F2c5b64dD279',
    '0xeB7E951F2D1A38188762dF12E0703aE16F76Ab73',
    '0x74f4EFFb0B538BAec703346b03B6d9292f53A4CD'
]; //多签钱包的owners，按需修改
export const THRESHOLD = 2; //多签钱包的阈值，按需修改

// Safe工具类
export class SafeUtils {
    public provider!: ethers.JsonRpcProvider;
    public signer!: ethers.Wallet;
    public protocolKit!: Safe;
    public apiKit!: SafeApiKit;
    public safeAddress: string;
    public privateKey: string;

    constructor(privateKey: string, safeAddress: string = SAFE_ADDRESS) {
        this.privateKey = privateKey;
        this.safeAddress = safeAddress;
    }

    // 检查环境变量
    static checkEnvironment() {
        if (!process.env['PRIVATE_KEY']) {
            throw new Error('请添加.env文件并设置环境变量 PRIVATE_KEY');
        }
        if (!process.env['INFURA_PROJECT_ID']) {
            throw new Error('请添加.env文件并设置环境变量 INFURA_PROJECT_ID');
        }
    }

    // 初始化Safe SDK
    async initSafe() {
        SafeUtils.checkEnvironment();
        
        this.provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
        this.signer = new ethers.Wallet(this.privateKey, this.provider);
        
        console.log('使用地址:', this.signer.address);
        
        this.protocolKit = await Safe.init({
            provider: SEPOLIA_RPC_URL,
            signer: this.privateKey,
            safeAddress: this.safeAddress
        });

        this.apiKit = new SafeApiKit({
            chainId: 11155111n, // Sepolia
            apiKey: process.env['SAFE_API_KEY']!
        });

        console.log('Safe SDK初始化完成');
        return this.protocolKit;
    }

    // 获取网络信息
    async getNetworkInfo() {
        const network = await this.provider.getNetwork();
        console.log('当前ChainID:', network.chainId.toString());
        
        const balance = await this.provider.getBalance(this.signer.address);
        console.log('账户余额:', ethers.formatEther(balance), 'ETH');
    }

    // 创建ERC20代币合约实例
    createTokenContract(tokenAddress: string = TOKEN_ADDRESS) {
        return new ethers.Contract(tokenAddress, ERC20_ABI, this.provider) as any;
    }

    // 获取代币信息
    async getTokenInfo(tokenAddress: string = TOKEN_ADDRESS) {
        const tokenContract = this.createTokenContract(tokenAddress);
        
        const tokenSymbol = await tokenContract.symbol();
        const tokenDecimals = await tokenContract.decimals();
        const tokenName = await tokenContract.name();
        
        console.log(`代币信息: ${tokenName} (${tokenSymbol})`);
        console.log(`代币地址: ${tokenAddress}`);
        console.log(`代币精度: ${tokenDecimals}`);
        
        return { tokenSymbol, tokenDecimals, tokenName };
    }

    // 检查Safe钱包中的代币余额
    async checkSafeTokenBalance(safeAddress: string = this.safeAddress, tokenAddress: string = TOKEN_ADDRESS) {
        const tokenContract = this.createTokenContract(tokenAddress);
        const { tokenSymbol, tokenDecimals } = await this.getTokenInfo(tokenAddress);
        
        const safeTokenBalance = await tokenContract.balanceOf(safeAddress);
        console.log(`Safe钱包代币余额: ${ethers.formatUnits(safeTokenBalance, tokenDecimals)} ${tokenSymbol}`);
        
        return { safeTokenBalance, tokenDecimals, tokenSymbol };
    }

    // 通用交易流程
    async executeTransactionFlow(safeTransactionData: any, safeTransactionHash: string, safeAddress: string = this.safeAddress) {
        console.log('开始执行交易流程...');
        // 签名交易
        const senderSignature = await this.protocolKit.signHash(safeTransactionHash);
        console.log('交易签名完成');
        
        // 提交到Safe服务器
        await this.apiKit.proposeTransaction({
            safeAddress: safeAddress,
            safeTransactionData: safeTransactionData,
            safeTxHash: safeTransactionHash,
            senderAddress: this.signer.address,
            senderSignature: senderSignature.data,
        } as any);
        
        console.log('交易已提交到Safe服务器');
        
        // 等待服务器处理
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // 查询pending交易
        const pendingTxs = await this.apiKit.getPendingTransactions(safeAddress);
        console.log('Pending交易数量:', (pendingTxs as any).results?.length || 0);
        
        return { safeTransactionHash, senderSignature, pendingTxs };
    }

    // 等待并执行交易
    async waitAndExecuteTransaction(safeTransactionHash: string) {
        console.log('等待其他签名者确认...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        const pendingTxs = await this.apiKit.getPendingTransactions(this.safeAddress);
        const pendingSafeTxHash = (pendingTxs as any).results?.[0]?.safeTxHash;
        
        if (pendingSafeTxHash === safeTransactionHash) {
            console.log('交易已获得足够签名，准备执行...');
            const tx = await this.apiKit.getTransaction(pendingSafeTxHash);
            const executeResponse = await this.protocolKit.executeTransaction(tx);
            console.log('交易执行成功:', executeResponse);
            return executeResponse;
        } else {
            console.log('交易尚未获得足够签名');
            return null;
        }
    }
}

export default SafeUtils; 
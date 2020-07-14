import { action, observable, ObservableMap } from 'mobx';
import RootStore from 'stores/Root';
import UncheckedJsonRpcSigner from 'provider/UncheckedJsonRpcSigner';
import { ethers } from 'ethers';
import { backupUrls, supportedChainId } from 'provider/connectors';

export enum ContractTypes {
    BPool = 'BPool',
    BFactory = 'BFactory',
    TestToken = 'TestToken',
    ExchangeProxy = 'ExchangeProxy',
    Multicall = 'Multicall',
    TestTokenBytes = 'TestTokenBytes',
}

export const schema = {
    BPool: require('../abi/BPool').abi,
    BFactory: require('../abi/BFactory').abi,
    TestToken: require('../abi/TestToken').abi,
    ExchangeProxy: require('../abi/ExchangeProxy').abi,
    Multicall: require('../abi/Multicall').abi,
    TestTokenBytes: require('../abi/BTokenBytes32').abi,
};

export interface ChainData {
    currentBlockNumber: number;
}

enum ERRORS {
    UntrackedChainId = 'Attempting to access data for untracked chainId',
    ContextNotFound = 'Specified context name note stored',
    BlockchainActionNoAccount = 'Attempting to do blockchain transaction with no account',
    BlockchainActionNoChainId = 'Attempting to do blockchain transaction with no chainId',
    BlockchainActionNoResponse = 'No error or response received from blockchain action',
    NoWeb3 = 'Error Loading Web3',
}

type ChainDataMap = ObservableMap<number, ChainData>;

export interface ProviderStatus {
    activeChainId: number;
    library: any;
    active: boolean;
    backUpLoaded: boolean;
    activeProvider: any;
    error: Error;
}

type Transaction = {
    data: string,
    to: string,
    value: number
}


export default class ProviderStore {
    @observable chainData: ChainData;
    @observable providerStatus: ProviderStatus;
    rootStore: RootStore;

    constructor(rootStore) {
        this.rootStore = rootStore;
        this.chainData = { currentBlockNumber: -1 } as ChainData;
        this.providerStatus = {} as ProviderStatus;
        this.providerStatus.active = false;
        this.providerStatus.backUpLoaded = false;
        this.providerStatus.activeProvider = null;

        this.handleNetworkChanged = this.handleNetworkChanged.bind(this);
        this.handleClose = this.handleClose.bind(this);
    }

    getCurrentBlockNumber(): number {
        return this.chainData.currentBlockNumber;
    }

    @action setCurrentBlockNumber(blockNumber): void {
        this.chainData.currentBlockNumber = blockNumber;
    }

    @action fetchUserBlockchainData = async (account: string) => {
        const {
            transactionStore,
            tokenStore,
            contractMetadataStore,
            swapFormStore,
        } = this.rootStore;

        console.debug('[Provider] fetchUserBlockchainData', {
            account,
        });

        transactionStore.checkPendingTransactions(account);
        await tokenStore.fetchBalancerTokenData(
            account,
            contractMetadataStore.getTrackedTokenAddresses()
        );

        // Makes sure the Input/Output token data is up to date
        swapFormStore.loadTokens(account);
    };

    // account is optional
    getProviderOrSigner(library, account) {
        console.debug('[getProviderOrSigner', {
            library,
            account,
            signer: library.getSigner(account),
        });

        return account
            ? new UncheckedJsonRpcSigner(library.getSigner(account))
            : library;
    }

    getContract(
        type: ContractTypes,
        address: string,
        signerAccount?: string
    ): ethers.Contract {
        const library = this.providerStatus.library;

        if (signerAccount) {
            return new ethers.Contract(
                address,
                schema[type],
                this.getProviderOrSigner(
                    this.providerStatus.library,
                    signerAccount
                )
            );
        }

        return new ethers.Contract(address, schema[type], library);
    }

    @action async handleNetworkChanged(
        networkId: string | number
    ): Promise<void> {
        console.log(
            `[Provider] Network change: ${networkId} ${this.providerStatus.active}`
        );
        // network change could mean switching from injected to backup or vice-versa
        if (this.providerStatus.active) {
            await this.loadWeb3();
            const { blockchainFetchStore } = this.rootStore;
            blockchainFetchStore.blockchainFetch(true);
        }
    }

    @action async handleClose(): Promise<void> {
        console.log(`[Provider] HandleClose() ${this.providerStatus.active}`);
        if (this.providerStatus.active) await this.loadWeb3();
    }

    @action async loadProvider(provider) {
        try {
            // remove any old listeners
            if (
                this.providerStatus.activeProvider &&
                this.providerStatus.activeProvider.on
            ) {
                console.log(`[Provider] Removing Old Listeners`);
                this.providerStatus.activeProvider.removeListener(
                    'chainChanged',
                    this.handleNetworkChanged
                );
                this.providerStatus.activeProvider.removeListener(
                    'close',
                    this.handleClose
                );
                this.providerStatus.activeProvider.removeListener(
                    'networkChanged',
                    this.handleNetworkChanged
                );
            }

            if (
                this.providerStatus.library &&
                this.providerStatus.library.close
            ) {
                console.log(`[Provider] Closing Old Library.`);
                await this.providerStatus.library.close();
            }

            if ((provider as any).isMetaMask) {
                console.log(`[Provider] MetaMask Auto Refresh Off`);
                (provider as any).autoRefreshOnNetworkChange = false;
            }

            if (provider.on) {
                console.log(`[Provider] Subscribing Listeners`);
                provider.on('chainChanged', this.handleNetworkChanged); // For now assume network/chain ids are same thing as only rare case when they don't match
                provider.on('close', this.handleClose);
                provider.on('networkChanged', this.handleNetworkChanged);
            }

            this.providerStatus.activeProvider = provider;
            console.log(`[Provider] Injected provider loaded.`);
        } catch (err) {
            console.error(`[Provider] Injected Error`, err);
            this.providerStatus.library = null;
            this.providerStatus.active = false;
            this.providerStatus.activeProvider = null;
        }
    }

    @action async loadWeb3(provider = null) {
        /*
        Handles loading web3 provider.
        Injected web3 loaded and active if chain Id matches.
        Backup web3 loaded and active if no injected or injected chain Id not correct.
        */

        // If no injected provider or inject provider is wrong chain fall back to Infura
        try {
            let web3 = new ethers.providers.JsonRpcProvider(
                backupUrls[supportedChainId]
            );
            let network = await web3.getNetwork();
            this.providerStatus.backUpLoaded = true;
            this.providerStatus.activeChainId = network.chainId;
            this.providerStatus.library = web3;
            this.providerStatus.activeProvider = 'backup'; //backupUrls[supportedChainId];
            console.log(`[Provider] BackUp Provider Loaded & Active`);
        } catch (err) {
            console.error(`[Provider] loadWeb3 BackUp Error`, err);
            this.providerStatus.backUpLoaded = false;
            this.providerStatus.activeChainId = null;
            this.providerStatus.library = null;
            this.providerStatus.active = false;
            this.providerStatus.error = new Error(ERRORS.NoWeb3);
            this.providerStatus.activeProvider = null;
            return;
        }

        this.providerStatus.active = true;
        console.log(`[Provider] Provider Active.`, this.providerStatus);
    }
}

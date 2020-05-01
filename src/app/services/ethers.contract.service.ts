import { Injectable } from '@angular/core';
import * as ethers from 'ethers'
import { environment } from '../../environments/environment';
import * as Identity from '../../../build/contracts/Identity.json';

declare let window: any;
declare let ethereum: any;

@Injectable()
export class EthersContractService {
    private provider: any;
    private contractInstance: any;

    constructor() {
        this.initEthers();
    }

    private initEthers() {
        if (!environment.contractAddress)
            throw new Error('invalid contract address!');

        if (!Identity || !Identity.abi)
            throw new Error('invalid contract json, try to run truffle compile!');

        if (window.ethereum) {
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            window.ethereum.enable().then(() => {
                const signer = this.provider.getSigner();

                const deploymentKey = Object.keys(Identity.networks)[0];
                const contractAddress = Identity
                    .networks[deploymentKey]
                    .address;

                this.contractInstance = new ethers.Contract(
                    contractAddress,
                    Identity.abi,
                    signer
                );

                ethereum.on('accountsChanged', this.callbackAccountChanged);
            });

        } else {
            console.warn('try to use Metamask!');
            this.provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
        }
    }

    private callbackAccountChanged() {
        this.initEthers;
    }

    public async set(value: string) {
        this.contractInstance.set(value);
    }

    public async get() {
        return this.contractInstance.get();
    }
}
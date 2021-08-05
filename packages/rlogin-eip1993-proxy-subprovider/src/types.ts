import { Transaction } from "@ethereumjs/tx";

export interface IRLoginEIP1993Provider {
    selectedAddress: string | null;
    connect(): Promise<IRLoginEIP1993Provider>;
    request(args: { method: 'eth_accounts' }): Promise<string[]>
    request(args: { method: 'personal_sign', params: [data: string, account: string] }): Promise<string>
    request(args: { method: 'net_version' }): Promise<string>
    request(args: { method: 'eth_getBalance'}): Promise<string>
    request(args: { method: 'eth_getTransactionReceipt', params: [transactionHash: string]  }): Promise<any | null>
    request(args: { method: 'personal_sign', params: [message: string]  }): Promise<string>
    request(args: { method: 'eth_sendTransaction', params: [transaction:Transaction, blockNumber: string]  }): Promise<any | null>
    request(args: { method: 'eth_estimateGas', params: [transaction:Transaction]  }): Promise<number>
    request(args: { method: string, params?: any[] }): Promise<any> //default
    sendAsync(request: { method: string; params?: any;}, cb: any): void;
    enable(): Promise<unknown>;
    on(method: string): void;
    removeAllListeners(): void;
}
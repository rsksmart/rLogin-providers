import { IRLoginEIP1993Provider, RLoginEIP1993Provider } from '@rsksmart/rlogin-eip1193-proxy-subprovider'

export class DCentProvider extends RLoginEIP1993Provider {
  connect(): Promise<IRLoginEIP1993Provider> {
    throw new Error('Method not implemented.');
  }
  ethSendTransaction(to: string, value: string | number, data: string): Promise<string> {
    throw new Error('Method not implemented.');
  }
  personalSign(message: string): Promise<string> {
    throw new Error('Method not implemented.');
  }
}

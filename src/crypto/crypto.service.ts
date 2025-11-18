import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface PriceData {
  id: string;
  currency: string;
  price: number;
  change_24h: number | null;
  market_cap: number | null;
}

@Injectable()
export class CryptoService {
  private readonly apiUrl = 'https://api.coingecko.com/api/v3';

  constructor(private readonly httpService: HttpService) {}

  async getPrice(coinId: string, currency: string = 'usd'): Promise<PriceData> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/simple/price`, {
          params: {
            ids: coinId,
            vs_currencies: currency.toLowerCase(),
            include_24hr_change: true,
            include_market_cap: true,
          },
        }),
      );

      if (!response.data[coinId]) {
        throw new HttpException(
          `Coin with id "${coinId}" not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      const data = response.data[coinId];
      const currencyLower = currency.toLowerCase();

      return {
        id: coinId,
        currency: currency.toUpperCase(),
        price: data[currencyLower] || 0,
        change_24h: data[`${currencyLower}_24h_change`] || null,
        market_cap: data[`${currencyLower}_market_cap`] || null,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch crypto price',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getMultiplePrices(
    coinIds: string[],
    currency: string = 'usd',
  ): Promise<PriceData[]> {
    try {
      const ids = coinIds.join(',');
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/simple/price`, {
          params: {
            ids,
            vs_currencies: currency.toLowerCase(),
            include_24hr_change: true,
            include_market_cap: true,
          },
        }),
      );

      const currencyLower = currency.toLowerCase();
      return Object.keys(response.data).map((coinId) => {
        const data = response.data[coinId];
        return {
          id: coinId,
          currency: currency.toUpperCase(),
          price: data[currencyLower] || 0,
          change_24h: data[`${currencyLower}_24h_change`] || null,
          market_cap: data[`${currencyLower}_market_cap`] || null,
        };
      });
    } catch (error) {
      throw new HttpException(
        'Failed to fetch crypto prices',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

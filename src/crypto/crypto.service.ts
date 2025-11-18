import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

export interface PriceData {
  id: string;
  currency: string;
  price: number;
  change_24h: number | null;
  market_cap: number | null;
}

@Injectable()
export class CryptoService {
  private readonly coingeckoApiUrl = 'https://api.coingecko.com/api/v3';

  constructor(private readonly httpService: HttpService) {}

  async getPrice(coinId: string, currency: string = 'usd'): Promise<PriceData> {
    const prices = await this.fetchPrices([coinId], currency);

    if (!prices.length || !prices[0]) {
      throw new HttpException(
        `Coin with id "${coinId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return prices[0];
  }

  async getMultiplePrices(
    coinIds: string[],
    currency: string = 'usd',
  ): Promise<PriceData[]> {
    if (!coinIds.length) {
      throw new HttpException(
        'At least one coin ID is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.fetchPrices(coinIds, currency);
  }

  private async fetchPrices(
    coinIds: string[],
    currency: string,
  ): Promise<PriceData[]> {
    try {
      const ids = coinIds.join(',');
      const response = await firstValueFrom(
        this.httpService.get(`${this.coingeckoApiUrl}/simple/price`, {
          params: {
            ids,
            vs_currencies: currency.toLowerCase(),
            include_24hr_change: true,
            include_market_cap: true,
          },
        }),
      );

      return Object.keys(response.data).map((coinId) =>
        this.formatPriceData(coinId, currency, response.data[coinId]),
      );
    } catch (error) {
      this.handleError(error, 'Failed to fetch crypto prices');
    }
  }

  private formatPriceData(
    coinId: string,
    currency: string,
    data: any,
  ): PriceData {
    return {
      id: coinId,
      currency: currency.toUpperCase(),
      price: data[currency.toLowerCase()] || 0,
      change_24h: data[`${currency.toLowerCase()}_24h_change`] || null,
      market_cap: data[`${currency.toLowerCase()}_market_cap`] || null,
    };
  }

  private handleError(error: unknown, defaultMessage: string): never {
    if (this.isAxiosError(error)) {
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const errorData = error.response?.data as { error?: string } | undefined;
      const message = errorData?.error || error.message || defaultMessage;
      throw new HttpException(message, status);
    }

    if (error instanceof HttpException) {
      throw error;
    }

    throw new HttpException(defaultMessage, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  private isAxiosError(error: unknown): error is AxiosError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      'isAxiosError' in error
    );
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CryptoService } from './crypto.service';

@ApiTags('crypto')
@Controller('crypto')
export class CryptoController {
  constructor(private readonly cryptoService: CryptoService) {}

  @Get('prices')
  @ApiOperation({
    summary: 'Get cryptocurrency prices',
    description:
      'Get prices for one or more cryptocurrencies. Provide comma-separated coin IDs for multiple coins.',
  })
  @ApiQuery({
    name: 'coinIds',
    description:
      'Comma-separated coin IDs (e.g., bitcoin or bitcoin,ethereum,binancecoin)',
    example: 'bitcoin',
  })
  @ApiQuery({
    name: 'currency',
    description: 'Currency to get prices in (default: usd)',
    example: 'usd',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched crypto prices',
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'bitcoin' },
            currency: { type: 'string', example: 'USD' },
            price: { type: 'number', example: 45000.5 },
            change_24h: { type: 'number', example: 2.5 },
            market_cap: { type: 'number', example: 850000000000 },
          },
        },
        {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'bitcoin' },
              currency: { type: 'string', example: 'USD' },
              price: { type: 'number', example: 45000.5 },
              change_24h: { type: 'number', example: 2.5 },
              market_cap: { type: 'number', example: 850000000000 },
            },
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 404, description: 'Coin not found' })
  async getPrices(
    @Query('coinIds') coinIds: string,
    @Query('currency') currency?: string,
  ) {
    const coinIdsArray = coinIds
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    // If single coin, return single object; if multiple, return array
    if (coinIdsArray.length === 1) {
      return this.cryptoService.getPrice(coinIdsArray[0], currency);
    }

    return this.cryptoService.getMultiplePrices(
      coinIdsArray,
      currency || 'usd',
    );
  }
}

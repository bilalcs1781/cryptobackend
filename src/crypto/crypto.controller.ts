import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CryptoService } from './crypto.service';

@ApiTags('crypto')
@Controller('crypto')
export class CryptoController {
  constructor(private readonly cryptoService: CryptoService) {}

  @Get('prices')
  @ApiOperation({ summary: 'Get cryptocurrency prices' })
  @ApiQuery({ name: 'coinIds', example: 'bitcoin' })
  @ApiQuery({ name: 'currency', required: false, example: 'usd' })
  async getPrices(
    @Query('coinIds') coinIds: string,
    @Query('currency') currency?: string,
  ) {
    const coinIdsArray = coinIds
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (coinIdsArray.length === 1) {
      return this.cryptoService.getPrice(coinIdsArray[0], currency);
    }

    return this.cryptoService.getMultiplePrices(
      coinIdsArray,
      currency || 'usd',
    );
  }
}

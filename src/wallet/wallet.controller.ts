import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { ConnectWalletDto } from './dto/connect-wallet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { GetUserId } from '../auth/decorators/get-user-id.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@ApiTags('wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('connect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Connect MetaMask wallet address' })
  @ApiResponse({
    status: 201,
    description: 'Wallet connected successfully.',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        userId: { type: 'string' },
        address: { type: 'string' },
        isActive: { type: 'boolean' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 409,
    description: 'Wallet address already connected.',
  })
  async connectWallet(
    @Body() connectWalletDto: ConnectWalletDto,
    @GetUserId() userId: string,
  ) {
    return this.walletService.connectWallet(userId, connectWalletDto);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all connected wallets (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Return paginated list of all connected wallets.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              userId: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
              address: { type: 'string' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        total: { type: 'number', example: 50 },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Admin access required.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getAllWallets(@Query() paginationQuery: PaginationQueryDto) {
    return this.walletService.getAllWallets(paginationQuery);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user own connected wallets' })
  @ApiResponse({
    status: 200,
    description: 'Return user connected wallets.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getUserWallets(@GetUserId() userId: string) {
    return this.walletService.getUserWallets(userId);
  }
}

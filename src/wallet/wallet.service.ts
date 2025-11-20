import { Injectable, ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallet, WalletDocument } from '../schemas/wallet.schema';
import { ConnectWalletDto } from './dto/connect-wallet.dto';
import { PaginationQueryDto, PaginatedResponse } from '../common/dto/pagination-query.dto';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
  ) {}

  async connectWallet(userId: string, connectWalletDto: ConnectWalletDto) {
    const { address } = connectWalletDto;

    // Check if wallet address already exists
    const existingWallet = await this.walletModel.findOne({ address }).exec();
    if (existingWallet) {
      // If wallet belongs to same user, just return it
      if (existingWallet.userId.toString() === userId) {
        return existingWallet;
      }
      throw new ConflictException('This wallet address is already connected to another user');
    }

    // Check if user already has this wallet connected
    const userWallet = await this.walletModel
      .findOne({ userId: new Types.ObjectId(userId), address })
      .exec();
    
    if (userWallet) {
      return userWallet;
    }

    // Create new wallet connection
    const wallet = new this.walletModel({
      userId: new Types.ObjectId(userId),
      address: address.toLowerCase(), // Normalize to lowercase
      isActive: true,
    });

    await wallet.save();
    return wallet;
  }

  async getAllWallets(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponse<WalletDocument>> {
    const page = paginationQuery.page || 1;
    const limit = paginationQuery.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.walletModel
        .find()
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.walletModel.countDocuments().exec(),
    ]);

    return {
      data,
      page,
      limit,
      total,
    };
  }

  async getUserWallets(userId: string) {
    return this.walletModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }
}


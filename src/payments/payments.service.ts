import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  Transaction,
  TransactionDocument,
  TransactionStatus,
} from '../schemas/transaction.schema';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    private configService: ConfigService,
  ) {
    const stripeSecretKey =
      process.env.STRIPE_SECRET_KEY ||
      this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      console.warn(
        '⚠️  STRIPE_SECRET_KEY is not configured. Payment features will not work.',
      );
      this.stripe = null as any;
    } else {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-11-17.clover',
      });
    }
  }

  async createPaymentIntent(
    userId: string,
    createPaymentIntentDto: CreatePaymentIntentDto,
  ) {
    if (!this.stripe) {
      throw new HttpException(
        'Stripe is not configured. Please set STRIPE_SECRET_KEY.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      const metadata: Record<string, string> = {
        userId: String(userId),
      };

      if (createPaymentIntentDto.metadata) {
        Object.entries(createPaymentIntentDto.metadata).forEach(
          ([key, value]) => {
            metadata[key] =
              typeof value === 'string' ? value : JSON.stringify(value);
          },
        );
      }

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: createPaymentIntentDto.amount,
        currency: createPaymentIntentDto.currency.toLowerCase(),
        description: createPaymentIntentDto.description,
        metadata,
      });

      const transaction = new this.transactionModel({
        userId: new Types.ObjectId(userId),
        stripePaymentIntentId: paymentIntent.id,
        amount: createPaymentIntentDto.amount,
        currency: createPaymentIntentDto.currency.toLowerCase(),
        status: TransactionStatus.PENDING,
        description: createPaymentIntentDto.description,
        metadata: createPaymentIntentDto.metadata,
      });

      await transaction.save();

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        transactionId: transaction._id,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create payment intent: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async handleWebhook(signature: string, payload: Buffer) {
    if (!this.stripe) {
      throw new HttpException(
        'Stripe is not configured. Please set STRIPE_SECRET_KEY.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const webhookSecret =
      process.env.STRIPE_WEBHOOK_SECRET ||
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new HttpException(
        'STRIPE_WEBHOOK_SECRET is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );

      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.transactionModel.findOneAndUpdate(
            { stripePaymentIntentId: paymentIntent.id },
            { status: TransactionStatus.SUCCEEDED },
          );
          break;
        case 'payment_intent.payment_failed':
          await this.transactionModel.findOneAndUpdate(
            { stripePaymentIntentId: paymentIntent.id },
            { status: TransactionStatus.FAILED },
          );
          break;
        case 'payment_intent.canceled':
          await this.transactionModel.findOneAndUpdate(
            { stripePaymentIntentId: paymentIntent.id },
            { status: TransactionStatus.CANCELED },
          );
          break;
      }

      return { received: true };
    } catch (error) {
      throw new HttpException(
        `Webhook error: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getUserTransactions(userId: string) {
    const transactions = await this.transactionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();

    return transactions;
  }
}

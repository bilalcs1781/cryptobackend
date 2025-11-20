import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WalletDocument = Wallet & Document;

@Schema({
  timestamps: true,
})
export class Wallet {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  address: string; // MetaMask wallet address

  @Prop({ default: true })
  isActive: boolean;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);


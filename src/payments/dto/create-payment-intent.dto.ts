import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty({
    description: 'Amount in cents (e.g., 1000 = $10.00)',
    example: 1000,
    minimum: 50,
  })
  @IsNumber()
  @Min(50)
  amount: number;

  @ApiProperty({
    description: 'Currency code (e.g., usd, eur)',
    example: 'usd',
    default: 'usd',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Payment description',
    example: 'Premium subscription',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Additional metadata (all values will be converted to strings)',
    required: false,
    example: {
      orderId: '12345',
      productName: 'Premium Subscription',
      customerEmail: 'customer@example.com',
    },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}


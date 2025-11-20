import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CryptoModule } from './crypto/crypto.module';
import { PaymentsModule } from './payments/payments.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      ignoreEnvFile: process.env.VERCEL === '1',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri =
          process.env.MONGODB_URI ||
          configService.get<string>('MONGODB_URI') ||
          'mongodb://localhost:27017/demo-backend';

        if (process.env.VERCEL) {
          console.log('Connecting to MongoDB...');
          console.log('URI configured:', uri ? 'Yes' : 'No');
        }

        return {
          uri,
          retryWrites: true,
          w: 'majority',
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          connectTimeoutMS: 10000,
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    CryptoModule,
    PaymentsModule,
    WalletModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

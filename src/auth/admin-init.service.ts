import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from '../schemas/user.schema';

@Injectable()
export class AdminInitService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.initializeAdmin();
  }

  private async initializeAdmin() {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');
    const adminName = this.configService.get<string>('ADMIN_NAME') || 'Admin';

    if (!adminEmail || !adminPassword) {
      console.log(
        '⚠️  ADMIN_EMAIL and ADMIN_PASSWORD not set. Admin user will not be created.',
      );
      return;
    }

    try {
      const existingAdmin = await this.userModel
        .findOne({ email: adminEmail })
        .exec();

      if (existingAdmin) {
        // Update existing admin if needed
        if (existingAdmin.role !== UserRole.ADMIN) {
          existingAdmin.role = UserRole.ADMIN;
          await existingAdmin.save();
          console.log(`✅ Updated user ${adminEmail} to admin role`);
        } else {
          console.log(`ℹ️  Admin user ${adminEmail} already exists`);
        }
        return;
      }

      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const admin = new this.userModel({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: UserRole.ADMIN,
      });

      await admin.save();
      console.log(`✅ Admin user created: ${adminEmail}`);
    } catch (error) {
      console.error('❌ Failed to initialize admin user:', error.message);
    }
  }
}

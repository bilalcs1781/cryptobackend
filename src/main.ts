import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import { INestApplication } from '@nestjs/common';
import { Express } from 'express';

let app: INestApplication;
let cachedApp: Express;

async function bootstrap() {
  if (cachedApp) {
    return cachedApp;
  }

  app = await NestFactory.create(AppModule, new ExpressAdapter());

  // Enable CORS
  app.enableCors({
    origin: [
      'https://cryptobackend-8xgf-cs6lja0iu-bilalcs1781s-projects.vercel.app',
      'https://cryptobackend-8xgf.vercel.app',
      /^https:\/\/cryptobackend-8xgf.*\.vercel\.app$/,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:5174',
      /^https?:\/\/localhost(:\d+)?$/,
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
    ],
    exposedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Enable validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      stopAtFirstError: false,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Demo Backend API')
    .setDescription('API documentation for Demo Backend')
    .setVersion('1.0')
    .addServer(
      'https://cryptobackend-8xgf-cs6lja0iu-bilalcs1781s-projects.vercel.app',
    )
    .addServer('http://localhost:3002', 'Local development')
    .addTag('users')
    .addTag('auth')
    .addTag('crypto')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);

  // Configure Swagger for serverless (Vercel) - use CDN for static assets
  const isServerless =
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NETLIFY;

  const swaggerOptions: any = {
    customCss: `
      .swagger-ui .topbar { display: none; }
    `,
    customSiteTitle: 'Demo Backend API',
    customfavIcon: 'https://swagger.io/favicon-32x32.png',
    swaggerOptions: {
      persistAuthorization: true,
    },
  };

  // Use CDN for static assets in serverless environments
  if (isServerless) {
    swaggerOptions.customCssUrl =
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.5/swagger-ui.css';
    swaggerOptions.customJs = [
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.5/swagger-ui-bundle.js',
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js',
    ];
  }

  SwaggerModule.setup('api', app, document, swaggerOptions);

  await app.init();
  cachedApp = app.getHttpAdapter().getInstance() as Express;
  return cachedApp;
}

// For serverless (Vercel) - default export must be a function
const handler = async (req: any, res: any) => {
  const expressApp = await bootstrap();
  return expressApp(req, res);
};

// Only start server if not in serverless environment
if (
  !process.env.VERCEL &&
  !process.env.AWS_LAMBDA_FUNCTION_NAME &&
  !process.env.NETLIFY
) {
  bootstrap().then(async () => {
    const port = process.env.PORT ?? 3002;
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
    console.log(`Swagger documentation: http://localhost:${port}/api`);
  });
}

// Default export for Vercel serverless functions
export default handler;

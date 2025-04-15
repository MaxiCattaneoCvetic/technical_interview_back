import { NestFactory } from '@nestjs/core';
import { onRequest } from 'firebase-functions/v2/https';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';

import { AppModule } from './app.module';

const expressServer = express();
let app: NestExpressApplication;

const initializeNestApp = async (): Promise<NestExpressApplication> => {
  if (!app) {
    app = await NestFactory.create<NestExpressApplication>(
      AppModule,
      new ExpressAdapter(expressServer),
    );

    app.enableCors();



    await app.init();
    console.log(`Server initialized`);
  }
  return app;
}

export const api = onRequest(async (request, response) => {
  await initializeNestApp();
  expressServer(request, response);
});

async function bootstrap() {
  const app = await initializeNestApp();
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

if (process.env.NODE_ENV !== 'production') {
  bootstrap();
}



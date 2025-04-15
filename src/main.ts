import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import * as functions from 'firebase-functions';
import { AppModule } from './app.module';

const expressServer = express();

const createNestApp = async (expressInstance?) => {
  const app = await NestFactory.create(
    AppModule,
    expressInstance ?? new ExpressAdapter(expressInstance),
  );
  app.enableCors();
  await app.init();
  return app;
};

// 🔥 Firebase Export
export const api = functions.https.onRequest(async (request, response) => {
  await createNestApp(expressServer);
  expressServer(request, response);
});

// 🚀 Local Development
if (process.env.IS_LOCAL === 'true') {
  createNestApp().then(app => {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`🚀 App is running locally on http://localhost:${PORT}`);
    });
  });
}

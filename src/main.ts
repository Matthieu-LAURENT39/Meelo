import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import AppModule from './app.module';
import AllExceptionsFilter from 'src/exceptions/all-exceptions.filter'
import MeeloExceptionFilter from './exceptions/meelo-exception.filter';
import NotFoundExceptionFilter from './exceptions/not-found.exception';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import mime from 'mime';

async function bootstrapSwagger(app: INestApplication) {
	const config = new DocumentBuilder()
		.setTitle('Meelo Swagger')
		.setDescription('The Meelo API Documentation')
		.setVersion('1.0')
		.addServer("/api", "API Path")
		.build();
	const document = SwaggerModule.createDocument(app, config, {

	});
	SwaggerModule.setup('/docs', app, document);
}

async function bootstrap() {
	mime.define({ 'audio/mpeg': [ 'm4a', ...mime.extension('audio/mpeg')!] })
	const app = await NestFactory.create(AppModule);
	const { httpAdapter } = app.get(HttpAdapterHost);
	app.useGlobalFilters(
		new AllExceptionsFilter(httpAdapter),
		new NotFoundExceptionFilter(),
		new MeeloExceptionFilter()
	);
	app.useGlobalPipes(new ValidationPipe());
	if (process.env.NODE_ENV === 'development')
		app.enableCors();
	await bootstrapSwagger(app);
	await app.listen(4000);
}
bootstrap();

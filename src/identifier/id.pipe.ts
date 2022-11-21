import {
	ArgumentMetadata, Injectable, PipeTransform
} from '@nestjs/common';
import InvalidIdParsingInput from './id.exceptions';

@Injectable()
export class ParseIdPipe implements PipeTransform<string> {
	transform(value: string, _metadata: ArgumentMetadata): number {
		if (isNaN(+value)) {
			throw new InvalidIdParsingInput(value);
		}
		return parseInt(value);
	}
}

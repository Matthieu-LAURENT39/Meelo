/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Body, Controller, Post } from "@nestjs/common";
import { ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import MetadataDto from "./models/metadata.dto";
import { MicroserviceOnly } from "src/authentication/roles/roles.decorators";
import { FormDataRequest, MemoryStoredFile } from "nestjs-form-data";
import { MetadataService } from "./metadata.service";

@ApiTags("Metadata")
@Controller("metadata")
export class MetadataController {
	constructor(private metadataService: MetadataService) {}
	@ApiOperation({
		description:
			"Handles the metadata of a single media file, and creates the related artist, album, etc.",
	})
	@Post()
	@MicroserviceOnly()
	@ApiConsumes("multipart/form-data")
	@FormDataRequest({ storage: MemoryStoredFile })
	async saveFile(@Body() metadata: MetadataDto) {
		return this.metadataService.saveMetadata(metadata);
	}
}

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { VrchatService } from '@/core/VrchatService.js';

export const meta = {
	tags: ['vrchat'],
	requireCredential: false,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private vrchatService: VrchatService) {
		super(meta, paramDef, async (ps) => {
			return await this.vrchatService.getInfo(ps.userId);
		});
	}
}

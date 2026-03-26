import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { VrchatService } from '@/core/VrchatService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['vrchat'],
	requireCredential: true,
	kind: 'write:account',
	errors: {
		notEnabled: { message: 'VRChat integration is not enabled.', code: 'VRCHAT_NOT_ENABLED', id: 'f0a0b1c1-0004-4000-a000-000000000001' },
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private vrchatService: VrchatService) {
		super(meta, paramDef, async (ps, me) => {
			const config = await this.vrchatService.getConfig();
			if (!config.enabled) throw new ApiError(meta.errors.notEnabled);
			await this.vrchatService.unbind(me.id);
		});
	}
}

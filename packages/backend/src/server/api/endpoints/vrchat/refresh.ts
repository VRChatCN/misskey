import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { VrchatService } from '@/core/VrchatService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['vrchat'],
	requireCredential: true,
	kind: 'write:account',
	errors: {
		notEnabled: { message: 'VRChat integration is not enabled.', code: 'VRCHAT_NOT_ENABLED', id: 'f0a0b1c1-0006-4000-a000-000000000001' },
		noBinding: { message: 'No VRChat binding found.', code: 'NO_BINDING', id: 'f0a0b1c1-0006-4000-a000-000000000002' },
		cooldown: { message: 'Please wait before refreshing again.', code: 'COOLDOWN', id: 'f0a0b1c1-0006-4000-a000-000000000003' },
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
			const result = await this.vrchatService.manualRefresh(me.id);
			if (!result.success) {
				if (result.error === 'NO_BINDING') throw new ApiError(meta.errors.noBinding);
				if (result.error === 'COOLDOWN') throw new ApiError(meta.errors.cooldown);
			}
			return { cooldownSeconds: result.cooldownSeconds };
		});
	}
}

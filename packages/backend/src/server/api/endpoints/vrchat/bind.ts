import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { VrchatService } from '@/core/VrchatService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['vrchat'],
	requireCredential: true,
	kind: 'write:account',
	errors: {
		notEnabled: { message: 'VRChat integration is not enabled.', code: 'VRCHAT_NOT_ENABLED', id: 'f0a0b1c1-0002-4000-a000-000000000001' },
		alreadyBound: { message: 'Already bound to a VRChat account.', code: 'ALREADY_BOUND', id: 'f0a0b1c1-0002-4000-a000-000000000002' },
		alreadyTaken: { message: 'This VRChat account is already bound to another user.', code: 'VRCHAT_ACCOUNT_ALREADY_BOUND', id: 'f0a0b1c1-0002-4000-a000-000000000003' },
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		vrchatId: { type: 'string', minLength: 1, maxLength: 128 },
	},
	required: ['vrchatId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private vrchatService: VrchatService) {
		super(meta, paramDef, async (ps, me) => {
			const config = await this.vrchatService.getConfig();
			if (!config.enabled) throw new ApiError(meta.errors.notEnabled);
			try {
				return await this.vrchatService.startBinding(me.id, ps.vrchatId);
			} catch (e: any) {
				if (e.message === 'ALREADY_BOUND') throw new ApiError(meta.errors.alreadyBound);
				if (e.message === 'VRCHAT_ACCOUNT_ALREADY_BOUND') throw new ApiError(meta.errors.alreadyTaken);
				throw e;
			}
		});
	}
}

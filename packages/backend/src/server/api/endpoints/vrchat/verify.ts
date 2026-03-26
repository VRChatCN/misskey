import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { VrchatService } from '@/core/VrchatService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['vrchat'],
	requireCredential: true,
	kind: 'write:account',
	errors: {
		notEnabled: { message: 'VRChat integration is not enabled.', code: 'VRCHAT_NOT_ENABLED', id: 'f0a0b1c1-0003-4000-a000-000000000001' },
		noBinding: { message: 'No pending VRChat binding found.', code: 'NO_BINDING', id: 'f0a0b1c1-0003-4000-a000-000000000002' },
		alreadyVerified: { message: 'Binding is already verified.', code: 'ALREADY_VERIFIED', id: 'f0a0b1c1-0003-4000-a000-000000000003' },
		vrcUserNotFound: { message: 'VRChat user not found.', code: 'VRC_USER_NOT_FOUND', id: 'f0a0b1c1-0003-4000-a000-000000000004' },
		keyNotFound: { message: 'Verification key not found in VRChat bio.', code: 'KEY_NOT_FOUND_IN_BIO', id: 'f0a0b1c1-0003-4000-a000-000000000005' },
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
			const result = await this.vrchatService.verifyBinding(me.id);
			if (!result.success) {
				const errorMap: Record<string, any> = {
					NO_BINDING: meta.errors.noBinding,
					ALREADY_VERIFIED: meta.errors.alreadyVerified,
					VRC_USER_NOT_FOUND: meta.errors.vrcUserNotFound,
					KEY_NOT_FOUND_IN_BIO: meta.errors.keyNotFound,
				};
				throw new ApiError(errorMap[result.error!] ?? meta.errors.noBinding);
			}
		});
	}
}

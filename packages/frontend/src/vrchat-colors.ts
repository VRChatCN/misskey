import { reactive } from 'vue';
import { misskeyApi } from '@/utility/misskey-api.js';

export type TrustRank = 'visitor' | 'new_user' | 'user' | 'known_user' | 'trusted_user';

const defaultColors: Record<TrustRank, string> = {
	visitor: '#CCCCCC',
	new_user: '#1778FF',
	user: '#2BCF5C',
	known_user: '#FF7B42',
	trusted_user: '#8143E6',
};

export const vrchatColors = reactive<Record<string, string>>({ ...defaultColors });

let loaded = false;

export async function loadVrchatColors(): Promise<void> {
	if (loaded) return;
	try {
		const config = await misskeyApi('vrchat/config');
		if (config?.colors) {
			Object.assign(vrchatColors, config.colors);
		}
		loaded = true;
	} catch {
		// VRChat integration may not be enabled
	}
}

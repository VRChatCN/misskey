<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<FormSection>
		<template #label>{{ i18n.ts._vrchat.binding }}</template>

		<div v-if="!vrchatEnabled" class="_gaps_s">
			<MkInfo>{{ i18n.ts._vrchat.notEnabled }}</MkInfo>
		</div>

		<!-- Not bound yet -->
		<div v-else-if="!binding" class="_gaps_s">
			<!-- Search step -->
			<div v-if="step === 'search'" class="_gaps_s">
				<MkInput v-model="searchQuery" :placeholder="i18n.ts._vrchat.searchByDisplayName">
					<template #prefix><i class="ti ti-search"></i></template>
				</MkInput>
				<MkButton primary :disabled="!searchQuery" @click="doSearch">{{ i18n.ts._vrchat.searchUser }}</MkButton>

				<div v-if="searchResults.length > 0" class="_gaps_s">
					<div style="font-weight: bold;">{{ i18n.ts._vrchat.selectUser }}</div>
					<div v-for="u in searchResults" :key="u.id"
						:class="[$style.searchItem, { [$style.selected]: selectedUser?.id === u.id }]"
						@click="selectedUser = u"
					>
						<div :class="$style.searchItemName">{{ u.displayName }}</div>
						<div :class="$style.searchItemId">{{ u.id }}</div>
					</div>
					<MkButton primary :disabled="!selectedUser" @click="doBind">{{ i18n.ts._vrchat.startBind }}</MkButton>
				</div>
			</div>

			<!-- Verify step -->
			<div v-if="step === 'verify'" class="_gaps_s">
				<MkInfo>{{ i18n.ts._vrchat.verificationHint }}</MkInfo>
				<div :class="$style.keyBox">
					<code>{{ verificationKey }}</code>
					<MkButton small @click="copyKey"><i class="ti ti-copy"></i></MkButton>
				</div>
				<MkButton primary @click="doVerify">{{ i18n.ts._vrchat.verify }}</MkButton>
			</div>
		</div>

		<!-- Bound -->
		<div v-else class="_gaps_s">
			<div :class="$style.boundInfo">
				<div :class="$style.boundLabel">{{ i18n.ts._vrchat.boundAccount }}</div>
				<div :class="$style.boundName">{{ binding.displayName || binding.vrchatId }}</div>
				<div :class="$style.trustBadge" :style="{ backgroundColor: trustColor }">
					{{ trustLabel }}
				</div>
			</div>
			<div :class="$style.actions">
				<MkButton :disabled="refreshing" @click="doRefresh">
					<i class="ti ti-refresh"></i> {{ i18n.ts._vrchat.refreshInfo }}
				</MkButton>
				<a :href="`https://vrchat.com/home/user/${binding.vrchatId}`" target="_blank" rel="noopener noreferrer">
					<MkButton>
						<i class="ti ti-external-link"></i> {{ i18n.ts._vrchat.viewVrcProfile }}
					</MkButton>
				</a>
				<MkButton danger @click="doUnbind">
					<i class="ti ti-unlink"></i> {{ i18n.ts._vrchat.unbindVrchat }}
				</MkButton>
			</div>
		</div>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import FormSection from '@/components/form/section.vue';
import MkInput from '@/components/MkInput.vue';
import MkButton from '@/components/MkButton.vue';
import MkInfo from '@/components/MkInfo.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { definePage } from '@/page.js';
import { copyToClipboard } from '@/utility/copy-to-clipboard.js';
import { $i } from '@/i.js';

const vrchatEnabled = ref(false);
const binding = ref<{ vrchatId: string; displayName: string | null; trustRank: string | null } | null>(null);
const step = ref<'search' | 'verify'>('search');
const searchQuery = ref('');
const searchResults = ref<{ id: string; displayName: string }[]>([]);
const selectedUser = ref<{ id: string; displayName: string } | null>(null);
const verificationKey = ref('');
const refreshing = ref(false);

const trustRankLabels: Record<string, string> = {
	visitor: i18n.ts._vrchat.visitor,
	new_user: i18n.ts._vrchat.newUser,
	user: i18n.ts._vrchat.user,
	known_user: i18n.ts._vrchat.knownUser,
	trusted_user: i18n.ts._vrchat.trustedUser,
};

const vrcColors = ref<Record<string, string>>({});

const trustLabel = computed(() => {
	if (!binding.value?.trustRank) return '';
	return trustRankLabels[binding.value.trustRank] || binding.value.trustRank;
});

const trustColor = computed(() => {
	if (!binding.value?.trustRank) return '#888';
	return vrcColors.value[binding.value.trustRank] || '#888';
});

async function loadConfig() {
	try {
		const config = await misskeyApi('vrchat/config');
		vrchatEnabled.value = config.enabled;
		vrcColors.value = config.colors;
	} catch {
		vrchatEnabled.value = false;
	}
}

async function loadBinding() {
	if (!$i) return;
	try {
		const info = await misskeyApi('vrchat/info', { userId: $i.id });
		binding.value = info;
	} catch {
		binding.value = null;
	}
}

async function doSearch() {
	try {
		searchResults.value = await misskeyApi('vrchat/search', { query: searchQuery.value });
		selectedUser.value = null;
	} catch (e: any) {
		os.alert({ type: 'error', text: e.message || String(e) });
	}
}

async function doBind() {
	if (!selectedUser.value) return;
	try {
		const result = await misskeyApi('vrchat/bind', { vrchatId: selectedUser.value.id });
		verificationKey.value = result.verificationKey;
		step.value = 'verify';
	} catch (e: any) {
		os.alert({ type: 'error', text: e.message || String(e) });
	}
}

async function doVerify() {
	try {
		await misskeyApi('vrchat/verify');
		os.alert({ type: 'success', text: i18n.ts._vrchat.verifySuccess });
		await loadBinding();
		step.value = 'search';
	} catch (e: any) {
		os.alert({ type: 'error', text: i18n.ts._vrchat.verifyFailed });
	}
}

async function doRefresh() {
	refreshing.value = true;
	try {
		const result = await misskeyApi('vrchat/refresh');
		if (result.cooldownSeconds) {
			os.alert({ type: 'warning', text: i18n.tsx._vrchat.refreshCooldown({ seconds: String(result.cooldownSeconds) }) });
		} else {
			os.alert({ type: 'success', text: i18n.ts._vrchat.refreshSuccess });
			await loadBinding();
		}
	} catch (e: any) {
		os.alert({ type: 'error', text: e.message || String(e) });
	} finally {
		refreshing.value = false;
	}
}

async function doUnbind() {
	const { canceled } = await os.confirm({ type: 'warning', text: i18n.ts._vrchat.unbindConfirm });
	if (canceled) return;
	try {
		await misskeyApi('vrchat/unbind');
		binding.value = null;
		step.value = 'search';
	} catch (e: any) {
		os.alert({ type: 'error', text: e.message || String(e) });
	}
}

function copyKey() {
	copyToClipboard(verificationKey.value);
}

onMounted(async () => {
	await loadConfig();
	if (vrchatEnabled.value) {
		await loadBinding();
	}
});

definePage(() => ({
	title: i18n.ts._vrchat.binding,
	icon: 'ti ti-device-gamepad-2',
}));
</script>

<style lang="scss" module>
.searchItem {
	padding: 8px 12px;
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 8px;
	cursor: pointer;
	transition: background-color 0.2s;

	&:hover {
		background-color: color(from var(--MI_THEME-panel) srgb r g b / 0.5);
	}
}

.selected {
	border-color: var(--MI_THEME-accent);
	background-color: color(from var(--MI_THEME-accent) srgb r g b / 0.1);
}

.searchItemName {
	font-weight: bold;
}

.searchItemId {
	font-size: 0.85em;
	opacity: 0.7;
}

.keyBox {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px;
	background: var(--MI_THEME-bg);
	border-radius: 8px;
	word-break: break-all;

	code {
		flex: 1;
		font-family: monospace;
	}
}

.boundInfo {
	display: flex;
	align-items: center;
	gap: 12px;
	flex-wrap: wrap;
}

.boundLabel {
	opacity: 0.7;
}

.boundName {
	font-weight: bold;
	font-size: 1.1em;
}

.trustBadge {
	padding: 2px 10px;
	border-radius: 99px;
	color: #fff;
	font-size: 0.85em;
	font-weight: bold;
}

.actions {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
}
</style>

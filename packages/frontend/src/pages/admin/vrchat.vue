<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<div class="_gaps_m">
			<!-- Enable toggle -->
			<FormSection>
				<template #label>{{ i18n.ts._vrchat.config }}</template>
				<MkSwitch v-model="enabled">{{ i18n.ts._vrchat.enableIntegration }}</MkSwitch>
			</FormSection>

			<!-- Bot account -->
			<FormSection>
				<template #label>{{ i18n.ts._vrchat.botAccount }}</template>
				<div class="_gaps_s">
					<div :class="$style.statusLine">
						<span>{{ i18n.ts._vrchat.botStatus }}:</span>
						<span v-if="botLoggedIn" style="color: var(--MI_THEME-success); font-weight: bold;">
							<i class="ti ti-check"></i> {{ i18n.ts._vrchat.botLoggedIn }} ({{ botDisplayName }})
						</span>
						<span v-else style="color: var(--MI_THEME-warn);">
							<i class="ti ti-x"></i> {{ i18n.ts._vrchat.botNotLoggedIn }}
						</span>
					</div>
					<MkInput v-model="botUsername" :placeholder="i18n.ts._vrchat.botUsername">
						<template #label>{{ i18n.ts._vrchat.botUsername }}</template>
					</MkInput>
					<MkInput v-model="botPassword" type="password" :placeholder="i18n.ts._vrchat.botPassword">
						<template #label>{{ i18n.ts._vrchat.botPassword }}</template>
					</MkInput>
					<MkButton primary :disabled="!botUsername || !botPassword || logging" @click="doLogin">
						<i class="ti ti-login"></i> {{ i18n.ts._vrchat.botLogin }}
					</MkButton>

					<div v-if="needs2fa" class="_gaps_s">
						<MkInfo>{{ i18n.ts._vrchat.botRequires2fa }}</MkInfo>
						<MkInput v-model="totpCode" :placeholder="i18n.ts._vrchat.bot2fa">
							<template #label>{{ i18n.ts._vrchat.bot2fa }}</template>
						</MkInput>
						<MkButton primary :disabled="!totpCode" @click="doVerify2fa">
							{{ i18n.ts._vrchat.botVerify2fa }}
						</MkButton>
					</div>
				</div>
			</FormSection>

			<!-- Role config -->
			<FormSection>
				<template #label>{{ i18n.ts._vrchat.roleConfig }}</template>
				<div class="_gaps_s">
					<MkInput v-model="verifiedRoleId" :placeholder="'Role ID'">
						<template #label>{{ i18n.ts._vrchat.verifiedRole }}</template>
					</MkInput>
					<MkInput v-model="visitorRoleId" :placeholder="'Role ID'">
						<template #label>{{ i18n.ts._vrchat.visitorRole }}</template>
					</MkInput>
					<MkInput v-model="newUserRoleId" :placeholder="'Role ID'">
						<template #label>{{ i18n.ts._vrchat.newUserRole }}</template>
					</MkInput>
					<MkInput v-model="userRoleId" :placeholder="'Role ID'">
						<template #label>{{ i18n.ts._vrchat.userRole }}</template>
					</MkInput>
					<MkInput v-model="knownUserRoleId" :placeholder="'Role ID'">
						<template #label>{{ i18n.ts._vrchat.knownUserRole }}</template>
					</MkInput>
					<MkInput v-model="trustedUserRoleId" :placeholder="'Role ID'">
						<template #label>{{ i18n.ts._vrchat.trustedUserRole }}</template>
					</MkInput>
				</div>
			</FormSection>

			<!-- Color config -->
			<FormSection>
				<template #label>{{ i18n.ts._vrchat.colorConfig }}</template>
				<div class="_gaps_s">
					<div :class="$style.colorRow">
						<span>{{ i18n.ts._vrchat.visitorColor }}</span>
						<input v-model="visitorColor" type="color"/>
						<code>{{ visitorColor }}</code>
					</div>
					<div :class="$style.colorRow">
						<span>{{ i18n.ts._vrchat.newUserColor }}</span>
						<input v-model="newUserColor" type="color"/>
						<code>{{ newUserColor }}</code>
					</div>
					<div :class="$style.colorRow">
						<span>{{ i18n.ts._vrchat.userColor }}</span>
						<input v-model="userColor" type="color"/>
						<code>{{ userColor }}</code>
					</div>
					<div :class="$style.colorRow">
						<span>{{ i18n.ts._vrchat.knownUserColor }}</span>
						<input v-model="knownUserColor" type="color"/>
						<code>{{ knownUserColor }}</code>
					</div>
					<div :class="$style.colorRow">
						<span>{{ i18n.ts._vrchat.trustedUserColor }}</span>
						<input v-model="trustedUserColor" type="color"/>
						<code>{{ trustedUserColor }}</code>
					</div>
				</div>
			</FormSection>

			<!-- Cache config -->
			<FormSection>
				<template #label>{{ i18n.ts._vrchat.cacheConfig }}</template>
				<div class="_gaps_s">
					<MkInput v-model="cacheTtlMinutes" type="number">
						<template #label>{{ i18n.ts._vrchat.cacheTtl }}</template>
					</MkInput>
					<MkInput v-model="manualRefreshCooldownMinutes" type="number">
						<template #label>{{ i18n.ts._vrchat.refreshCooldownConfig }}</template>
					</MkInput>
				</div>
			</FormSection>

			<MkButton primary @click="saveConfig">
				<i class="ti ti-check"></i> {{ i18n.ts._vrchat.saveConfig }}
			</MkButton>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import FormSection from '@/components/form/section.vue';
import MkInput from '@/components/MkInput.vue';
import MkButton from '@/components/MkButton.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInfo from '@/components/MkInfo.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { definePage } from '@/page.js';

const enabled = ref(false);
const botUsername = ref('');
const botPassword = ref('');
const totpCode = ref('');
const needs2fa = ref(false);
const twoFaMethods = ref<string[]>([]);
const logging = ref(false);
const botLoggedIn = ref(false);
const botDisplayName = ref('');

const verifiedRoleId = ref('');
const visitorRoleId = ref('');
const newUserRoleId = ref('');
const userRoleId = ref('');
const knownUserRoleId = ref('');
const trustedUserRoleId = ref('');

const visitorColor = ref('#CCCCCC');
const newUserColor = ref('#1778FF');
const userColor = ref('#2BCF5C');
const knownUserColor = ref('#FF7B42');
const trustedUserColor = ref('#8143E6');

const cacheTtlMinutes = ref(360);
const manualRefreshCooldownMinutes = ref(5);

async function loadConfig() {
	try {
		const config = await misskeyApi('admin/vrchat/config');
		enabled.value = config.enabled;
		botUsername.value = config.botUsername ?? '';
		cacheTtlMinutes.value = config.cacheTtlMinutes;
		manualRefreshCooldownMinutes.value = config.manualRefreshCooldownMinutes;
		verifiedRoleId.value = config.verifiedRoleId ?? '';
		visitorRoleId.value = config.visitorRoleId ?? '';
		newUserRoleId.value = config.newUserRoleId ?? '';
		userRoleId.value = config.userRoleId ?? '';
		knownUserRoleId.value = config.knownUserRoleId ?? '';
		trustedUserRoleId.value = config.trustedUserRoleId ?? '';
		visitorColor.value = config.visitorColor;
		newUserColor.value = config.newUserColor;
		userColor.value = config.userColor;
		knownUserColor.value = config.knownUserColor;
		trustedUserColor.value = config.trustedUserColor;
	} catch (e) {
		console.error('Failed to load VRChat config', e);
	}
}

async function loadBotStatus() {
	try {
		const status = await misskeyApi('admin/vrchat/status');
		botLoggedIn.value = status.loggedIn;
		botDisplayName.value = status.displayName ?? '';
	} catch {
		botLoggedIn.value = false;
	}
}

async function doLogin() {
	logging.value = true;
	needs2fa.value = false;
	twoFaMethods.value = [];
	try {
		const result = await misskeyApi('admin/vrchat/login', {
			username: botUsername.value,
			password: botPassword.value,
		});
		if (result.requires2fa && Array.isArray(result.requires2fa) && result.requires2fa.length > 0) {
			needs2fa.value = true;
			twoFaMethods.value = result.requires2fa;
			os.alert({ type: 'info', text: i18n.ts._vrchat.botRequires2fa });
		} else if (result.success) {
			os.alert({ type: 'success', text: `${i18n.ts._vrchat.botLoginSuccess}: ${result.displayName}` });
			botLoggedIn.value = true;
			botDisplayName.value = result.displayName ?? '';
		}
	} catch (e: any) {
		os.alert({ type: 'error', text: i18n.ts._vrchat.botLoginFailed });
	} finally {
		logging.value = false;
	}
}

async function doVerify2fa() {
	const method = twoFaMethods.value.includes('emailOtp') ? 'emailOtp' : 'totp';
	try {
		const result = await misskeyApi('admin/vrchat/verify-2fa', { code: totpCode.value, method });
		if (result.success) {
			os.alert({ type: 'success', text: `${i18n.ts._vrchat.botLoginSuccess}: ${result.displayName}` });
			botLoggedIn.value = true;
			botDisplayName.value = result.displayName ?? '';
			needs2fa.value = false;
			twoFaMethods.value = [];
			totpCode.value = '';
		}
	} catch (e: any) {
		os.alert({ type: 'error', text: i18n.ts._vrchat.botLoginFailed });
	}
}

async function saveConfig() {
	try {
		await misskeyApi('admin/vrchat/update-config', {
			enabled: enabled.value,
			cacheTtlMinutes: Number(cacheTtlMinutes.value),
			manualRefreshCooldownMinutes: Number(manualRefreshCooldownMinutes.value),
			verifiedRoleId: verifiedRoleId.value || null,
			visitorRoleId: visitorRoleId.value || null,
			newUserRoleId: newUserRoleId.value || null,
			userRoleId: userRoleId.value || null,
			knownUserRoleId: knownUserRoleId.value || null,
			trustedUserRoleId: trustedUserRoleId.value || null,
			visitorColor: visitorColor.value,
			newUserColor: newUserColor.value,
			userColor: userColor.value,
			knownUserColor: knownUserColor.value,
			trustedUserColor: trustedUserColor.value,
		});
		os.alert({ type: 'success', text: i18n.ts._vrchat.configSaved });
	} catch (e: any) {
		os.alert({ type: 'error', text: e.message || String(e) });
	}
}

onMounted(async () => {
	await Promise.all([loadConfig(), loadBotStatus()]);
});

const headerActions = computed(() => []);
const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts._vrchat.config,
	icon: 'ti ti-device-gamepad-2',
}));
</script>

<style lang="scss" module>
.statusLine {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 0;
}

.colorRow {
	display: flex;
	align-items: center;
	gap: 12px;

	span {
		min-width: 120px;
	}

	input[type="color"] {
		width: 40px;
		height: 32px;
		padding: 2px;
		border: 1px solid var(--MI_THEME-divider);
		border-radius: 6px;
		cursor: pointer;
	}

	code {
		font-family: monospace;
		opacity: 0.7;
	}
}
</style>

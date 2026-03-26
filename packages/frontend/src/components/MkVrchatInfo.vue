<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="vrchatBinding" :class="$style.root">
	<a :href="`https://vrchat.com/home/user/${vrchatBinding.vrchatId}`" target="_blank" rel="noopener noreferrer" :class="$style.link">
<!--		<i class="ti ti-device-gamepad-2" :class="$style.icon"></i>-->
		<img style="height: 1.3em; vertical-align: -22%;" src="/icon/vrc.png"/>
		<span :class="$style.name">{{ vrchatBinding.displayName || vrchatBinding.vrchatId }}</span>
		<span :class="$style.badge" :style="{ backgroundColor: trustColor }">{{ trustLabel }}</span>
		<i class="ti ti-external-link" :class="$style.extIcon"></i>
	</a>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { i18n } from '@/i18n.js';
import { vrchatColors } from '@/vrchat-colors.js';

const props = defineProps<{
	vrchatBinding?: {
		vrchatId: string;
		displayName: string | null;
		trustRank: string | null;
	} | null;
}>();

const trustRankLabels: Record<string, string> = {
	visitor: i18n.ts._vrchat.visitor,
	new_user: i18n.ts._vrchat.newUser,
	user: i18n.ts._vrchat.user,
	known_user: i18n.ts._vrchat.knownUser,
	trusted_user: i18n.ts._vrchat.trustedUser,
};

const trustLabel = computed(() => {
	const rank = props.vrchatBinding?.trustRank;
	if (!rank) return '';
	return trustRankLabels[rank] || rank;
});

const trustColor = computed(() => {
	const rank = props.vrchatBinding?.trustRank;
	if (!rank) return '#888';
	return vrchatColors[rank] || '#888';
});
</script>

<style lang="scss" module>
.root {
	padding: 4px 0;
}

.link {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	text-decoration: none;
	color: inherit;

	&:hover {
		text-decoration: underline;
	}
}

.icon {
	opacity: 0.7;
}

.name {
	font-weight: bold;
}

.badge {
	padding: 1px 8px;
	border-radius: 99px;
	color: #fff;
	font-size: 0.8em;
	font-weight: bold;
}

.extIcon {
	font-size: 0.8em;
	opacity: 0.5;
}
</style>

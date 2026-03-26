<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<span :style="vrchatColorStyle"><Mfm :text="user.name ?? user.username" :author="user" :plain="true" :nowrap="nowrap" :emojiUrls="user.emojis"/></span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import { vrchatColors } from '@/vrchat-colors.js';

const props = withDefaults(defineProps<{
	user: Misskey.entities.User;
	nowrap?: boolean;
}>(), {
	nowrap: true,
});

const vrchatColorStyle = computed(() => {
	const vrc = (props.user as any).vrchatBinding;
	if (!vrc?.trustRank) return {};
	const color = vrchatColors[vrc.trustRank];
	return color ? { color } : {};
});
</script>

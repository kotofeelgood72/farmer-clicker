<script setup lang="ts">
import { computed, nextTick, onMounted, useTemplateRef, watch } from 'vue'
import { usePremiumAccess } from '@/composables/usePremiumAccess'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import QuickReply from '@/components/QuickReply.vue'
import IconCheckRead from '~icons/solar/check-read-outline'
import ChatTypingIndicator from '@/components/ChatTypingIndicator.vue'
import { getDailyDateById } from '@/data/dates'
import { useAchievements } from '@/composables/useAchievements'
import { fireConfetti } from '@/composables/useConfetti'
import { useAppNavigation } from '@/composables/useAppNavigation'
import { maybeInterstitialOnReply, runAfterInterstitial } from '@/composables/useAdPlacements'
import { useDiamonds } from '@/composables/useDiamonds'
import { usePremium } from '@/composables/usePremium'
import {
  findStartedMeetingLocationForGirl,
  useMeetingChat,
} from '@/composables/useMeetingChat'
import EnterItem from '@/components/EnterItem.vue'

const route = useRoute()
const { pushFrom, back } = useAppNavigation()
const { canStartDate, openPremiumShop } = usePremiumAccess()
const { canSpend, spend } = useDiamonds()
const { isPremium } = usePremium()

function replyDisplayCost(cost: number): number {
  return isPremium.value ? 0 : cost
}
const {
  trackDiamondsSpent,
  trackPlayerMessage,
  trackThemMessage,
  trackDateCompleted,
  refreshAchievements,
} = useAchievements()

const dateId = computed(() => {
  const id = Number(route.params.id)
  return Number.isFinite(id) && id > 0 ? id : 1
})

const daily = computed(() => getDailyDateById(dateId.value))

const title = computed(() => daily.value?.title ?? 'Свидание')
const girlName = computed(() => daily.value?.girlName ?? 'Она')
const girlImage = computed(() => daily.value?.girlImage)
const girlColor = computed(() => daily.value?.girlColor ?? '#5a5a6a')
const locationImage = computed(() => daily.value?.locationImage)

const girlId = computed(() => daily.value?.girlId ?? 0)

const locationId = computed(() => {
  const g = girlId.value
  if (g > 0) {
    const started = findStartedMeetingLocationForGirl(g)
    if (started != null) return started
  }
  return daily.value?.locationId ?? 0
})

watch(
  [daily, girlId, locationId],
  () => {
    const d = daily.value
    if (!d) return
    if (d.status === 'premium' || !canStartDate(d.girlId, d.locationId)) {
      openPremiumShop()
      back('/dates')
    }
  },
  { immediate: true },
)

const {
  dialog,
  messages,
  replies,
  hasReplies,
  isTyping,
  dialogComplete,
  pickReply,
  nodeIndex,
} = useMeetingChat(locationId, girlId)

const totalSteps = computed(() => dialog.value?.nodes.length ?? 0)
const stepLabel = computed(() => {
  const total = totalSteps.value
  if (!total) return ''
  const current = Math.min(nodeIndex.value + 1, total)
  return `${current}/${total}`
})

const scroller = useTemplateRef<HTMLDivElement>('scroller')

async function scrollToBottom() {
  await nextTick()
  if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
}

watch(() => messages.value.length, () => void scrollToBottom())
watch(isTyping, (typing) => { if (typing) void scrollToBottom() })
watch(dialogComplete, (done) => {
  if (done) {
    fireConfetti()
    trackDateCompleted()
    refreshAchievements()
    void scrollToBottom()
  }
})

watch(
  () => messages.value.at(-1)?.sender,
  (sender) => {
    if (sender === 'them') trackThemMessage()
  },
)

onMounted(() => void scrollToBottom())

function onBack() {
  const go = () => back('/dates')
  if (dialogComplete.value) {
    runAfterInterstitial(go, 'date_complete', { reviewAfter: true })
  } else {
    go()
  }
}

function onPick(reply: { id: number; text: string; cost: number }) {
  if (!canSpend(reply.cost)) {
    void pushFrom('/shop')
    return
  }
  if (!spend(reply.cost)) {
    void pushFrom('/shop')
    return
  }
  if (!isPremium.value && reply.cost > 0) {
    trackDiamondsSpent(reply.cost)
  }
  trackPlayerMessage()
  maybeInterstitialOnReply(() => pickReply(reply))
}
</script>

<template>
  <div class="scene">
    <EnterItem :order="0" solo>
      <PageHeader :title="title" @back="onBack">
        <template #right>
          <span v-if="stepLabel" class="step-counter">{{ stepLabel }}</span>
        </template>
      </PageHeader>
    </EnterItem>

    <div ref="scroller" class="scroll page-enter">
      <EnterItem :order="1" class="hero" :style="{ background: girlColor }">
        <img
          v-if="locationImage"
          :src="locationImage"
          :alt="title"
          class="hero-bg"
        />
        <div class="hero-grad" />
        <img
          v-if="girlImage"
          :src="girlImage"
          :alt="girlName"
          class="hero-girl"
        />
        <span v-else class="hero-letter">{{ girlName.charAt(0) }}</span>
      </EnterItem>

      <TransitionGroup name="msg" tag="div" class="msg-list">
        <div
          v-for="m in messages"
          :key="m.id"
          :class="['message', `message--${m.sender}`]"
        >
          <div class="bubble">
            {{ m.text }}
            <span class="bubble-meta">
              <span class="time">{{ m.time }}</span>
              <IconCheckRead v-if="m.sender === 'me'" class="check" />
            </span>
          </div>
        </div>
      </TransitionGroup>

      <ChatTypingIndicator
        v-if="isTyping"
        :avatar-url="girlImage"
        :avatar-color="girlColor"
        :letter="girlName.charAt(0)"
      />

      <div v-if="dialogComplete" class="finale">
        <div class="finale__emoji">💞</div>
        <div class="finale__title">Свидание окончено</div>
        <div class="finale__text">{{ girlName }} запомнит этот вечер</div>
        <button class="finale__btn" type="button" @click="onBack">
          К списку свиданий
        </button>
      </div>
    </div>

    <footer v-if="hasReplies" class="replies-bar">
      <QuickReply
        v-for="r in replies"
        :key="r.id"
        :text="r.text"
        :cost="replyDisplayCost(r.cost)"
        @pick="onPick(r)"
      />
    </footer>
  </div>
</template>

<style scoped>
.scene {
  width: 100%;
  height: 100%;
  background: var(--bg);
  color: var(--text);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.step-counter {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-muted);
}

.scroll {
  flex: 1;
  overflow-y: auto;
  padding: 14px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.scroll::-webkit-scrollbar { display: none; }

.hero {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 18px;
  overflow: hidden;
  isolation: isolate;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.hero-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}

.hero-grad {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0) 30%,
    rgba(0, 0, 0, 0.55) 100%
  );
  z-index: 1;
  pointer-events: none;
}

.hero-girl {
  position: relative;
  z-index: 2;
  height: 100%;
  width: auto;
  max-width: 100%;
  object-fit: contain;
  object-position: bottom center;
  filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.45));
  -webkit-user-drag: none;
}

.hero-letter {
  position: relative;
  z-index: 2;
  font-size: 88px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.55);
  padding-bottom: 20px;
}

.msg-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.msg-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.96);
}
.msg-enter-active {
  transition: opacity 0.28s ease-out, transform 0.32s cubic-bezier(0.22, 1.2, 0.36, 1);
}
.msg-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.message {
  display: flex;
  max-width: 100%;
  transform-origin: bottom left;
}
.message--me {
  justify-content: flex-end;
  transform-origin: bottom right;
}
.message--them {
  justify-content: flex-start;
}

.bubble {
  max-width: 78%;
  padding: 10px 14px;
  border-radius: 18px;
  font-size: 14px;
  line-height: var(--lh-ui);
  position: relative;
  word-wrap: break-word;
  white-space: pre-line;
}

.message--them .bubble {
  background: var(--bubble-them-bg);
  color: var(--bubble-them-text);
  border-bottom-left-radius: 6px;
  box-shadow: var(--shadow-sm);
}

.message--me .bubble {
  background: var(--bubble-me-bg);
  color: var(--bubble-me-text);
  border-bottom-right-radius: 6px;
  box-shadow: 0 4px 14px rgba(177, 75, 255, 0.22);
}

.bubble-meta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  margin-left: 8px;
  vertical-align: bottom;
  white-space: nowrap;
  opacity: 0.7;
}

.message--them .bubble-meta { color: var(--text-muted); }
.message--me .bubble-meta { color: rgba(255, 255, 255, 0.92); }

.check {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.replies-bar {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px 20px;
  background: var(--header-bg);
  border-top: 1px solid var(--hairline);
  z-index: 2;
}

.finale {
  margin-top: 6px;
  padding: 22px 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.finale__emoji {
  font-size: 38px;
  line-height: 1;
  margin-bottom: 10px;
}

.finale__title {
  font-size: 17px;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 4px;
}

.finale__text {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 18px;
}

.finale__btn {
  display: inline-block;
  padding: 12px 22px;
  border-radius: 12px;
  border: none;
  outline: none;
  background: var(--gradient-brand-violet);
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(177, 75, 255, 0.28);
  transition: transform 0.1s ease;
}

.finale__btn:active { transform: scale(0.98); }
</style>

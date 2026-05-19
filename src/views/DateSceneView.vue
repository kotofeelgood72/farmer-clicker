<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import QuickReply from '@/components/QuickReply.vue'

interface Reply {
  id: number
  text: string
  affinity: number
}

interface Scene {
  narration: string
  replies: Reply[]
  imageColor: string
  imageLetter: string
}

const router = useRouter()

const dateInfo = ref({
  title: 'Прогулка в парке',
})

const scenes = ref<Scene[]>([
  {
    narration:
      'Она сняла очки и посмотрела на тебя. «Знаешь, я редко гуляю после работы. Но с тобой… приятно»',
    imageColor: '#5e7d4a',
    imageLetter: 'У',
    replies: [
      { id: 1, text: 'Сказать, что тебе тоже приятно', affinity: 10 },
      { id: 2, text: 'Предложить зайти в кафе',         affinity: 5 },
      { id: 3, text: 'Сменить тему',                    affinity: -5 },
    ],
  },
  {
    narration:
      'Училка улыбнулась и взяла тебя под руку. «Ты не такой, как я думала. С тобой легко».',
    imageColor: '#7d5a3a',
    imageLetter: 'У',
    replies: [
      { id: 1, text: 'Сделать комплимент',          affinity: 10 },
      { id: 2, text: 'Расспросить про работу',      affinity: 5 },
      { id: 3, text: 'Промолчать',                  affinity: -5 },
    ],
  },
  {
    narration:
      'Она остановилась у фонаря. «Спасибо за этот вечер. Мне правда было хорошо».',
    imageColor: '#3a4a6e',
    imageLetter: 'У',
    replies: [
      { id: 1, text: 'Поцеловать на прощание',      affinity: 10 },
      { id: 2, text: 'Пригласить на новое свидание', affinity: 5 },
      { id: 3, text: 'Просто кивнуть',              affinity: -5 },
    ],
  },
])

const step = ref(0)
const totalSteps = computed(() => scenes.value.length)
const currentScene = computed(() => scenes.value[step.value])

function onBack() { void router.push('/dates') }

function onPick(reply: Reply) {
  // eslint-disable-next-line no-console
  console.info('[date] reply', reply)
  if (step.value < totalSteps.value - 1) {
    step.value++
  } else {
    void router.push('/dates')
  }
}
</script>

<template>
  <div class="scene">
    <PageHeader :title="dateInfo.title" @back="onBack">
      <template #right>
        <span class="step-counter">{{ step + 1 }}/{{ totalSteps }}</span>
      </template>
    </PageHeader>

    <div class="scroll">
      <div
        v-if="currentScene"
        class="scene-image"
        :style="{ background: currentScene.imageColor }"
      >
        <span class="scene-letter">{{ currentScene.imageLetter }}</span>
      </div>

      <div v-if="currentScene" class="narration">
        {{ currentScene.narration }}
      </div>

      <div v-if="currentScene" class="replies">
        <QuickReply
          v-for="r in currentScene.replies"
          :key="r.id"
          :text="r.text"
          :affinity="r.affinity"
          @pick="onPick(r)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.scene {
  width: 100%;
  height: 100%;
  background: #0a0a14;
  color: #fff;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  display: flex;
  flex-direction: column;
}

.step-counter {
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
}

.scroll {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px 18px;
}
.scroll::-webkit-scrollbar { display: none; }

.scene-image {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 16px;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.scene-letter {
  font-size: 90px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.35);
}

.narration {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  padding: 14px 16px;
  font-size: 13px;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 16px;
}

.replies {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>

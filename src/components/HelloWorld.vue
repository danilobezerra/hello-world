<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Renderer } from '../renderer.js'

import { createTriangle } from '../triangle.js'

const canvasRef = ref(null)
const status = ref('Inicializando...')
const errorMessage = ref('')

let renderer = null

async function initializeScene() {
    renderer = new Renderer(canvasRef.value, {
        onDeviceLost(info) {
            status.value = 'Dispositivo WebGPU perdido.'
            errorMessage.value = info.message || 'Dispositivo gráfico desconectado.'
        }
    })

    status.value = 'Inicializando WebGPU...'

    try {
        await renderer.initialize({
            signal: null
        })

        const triangle = await createTriangle(renderer.device, renderer.format)
        renderer.addObject(triangle)

        status.value = 'Triangulo renderizado.'
    } catch (error) {
        console.error('Falha ao inicializar WebGPU, error')

        renderer?.destroy()
        renderer = null
    }
}

onMounted(() => {
    initializeScene()
})

onBeforeUnmount(() => {
    renderer?.destroy()
    renderer = null
})
</script>

<template>
    <main class="helloworld">
        <h1>Hello World!</h1>
        <p>{{ status }}</p>

        <canvas ref="canvasRef" width="640" height="480"></canvas>

        <p v-if="errorMessage" class="error">
            {{ status }}
        </p>
    </main>
</template>

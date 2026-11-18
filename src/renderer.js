const DEFAULT_CLEAR_COLOR = {
    r: 0.05,
    g: 0.05,
    b: 0.10,
    a: 1.0
}

export class Renderer {
    #canvas
    #clearColor
    #onDeviceLost

    #device = null
    #format = null
    #context = null

    #objects = new Set()

    #initialized = false


    constructor(canvas, {
        clearColor = DEFAULT_CLEAR_COLOR,
        onDeviceLost = null
    } = {}) {
        if (!canvas) {
            throw new Error("O elemento canvas é obrigatório.")
        }

        this.#canvas = canvas
        this.#clearColor = clearColor
        this.#onDeviceLost = onDeviceLost
    }

    get device() {
        if (!this.#device) {
            throw new Error("Renderer não inicializado.")
        }

        return this.#device
    }

    get format() {
        if (!this.#format) {
            throw new Error("Renderer não inicializado.")
        }

        return this.#format
    }

    async initialize({ signal } = {}) {
        if (this.#initialized) {
            throw new Error("Renderer inicializado.")
        }

        if (!navigator.gpu) {
            throw new Error("WebGPU indisponível.")
        }

        try {
            const adapter = await navigator.gpu.requestAdapter()
            if (!adapter) {
                throw new Error("Não foi possível obter um GPUAdapter.")
            }

            const device = await adapter.requestDevice()

            this.#device = device
            this.#format = navigator.gpu.getPreferredCanvasFormat()

            this.#context = this.#canvas.getContext('webgpu')
            if (!this.#context) {
                throw new Error("Não foi possível obter um contexto WebGPU.")
            }

            this.#context.configure({
                device: this.#device,
                format: this.#format,
                alphaMode: 'opaque'
            })

            // Device loss
            // Resize

            this.#initialized = true

        } catch (error) {
            this.destroy()
            throw error
        }
    }

    addObject(object) {
        if (!this.#initialized) {
            throw new Error("Inicialize o Renderer antes de adicionar objetos.")
        }

        if (!object || typeof object.draw !== 'function') {
            throw new TypeError("Objeto deve implementar draw(renderPass).")
        }

        this.#objects.add(object)
        this.render()

        return object
    }

    removeObject(object) {
        if (!this.#objects.delete(object)) {
            return false
        }

        object.destroy?.()
        this.render()

        return true
    }

    render() {
        if (!this.#initialized || !this.#device || !this.#context) {
            return
        }

        const commandEncoder = this.#device.createCommandEncoder()
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: this.#context.getCurrentTexture().createView(),
                clearValue: this.#clearColor,
                loadOp: 'clear',
                storeOp: 'store'
            }]
        })

        try {
            for (const object of this.#objects) {
                object.draw(renderPass)
            }
        } finally {
            renderPass.end()
        }

        this.#device.queue.submit([
            commandEncoder.finish()
        ])
    }

    destroy() {

    }
}
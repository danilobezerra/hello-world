import code from './shaders/triangle.wgsl?raw'

const vertices = new Float32Array([0.0, 0.75, -0.75, -0.65, 0.75, -0.65])

export async function createTriangle(device, format) {
    let vertexBuffer = null
    let destroyed = false

    try {
        const shaderModule = device.createShaderModule({ code })
        const compilationInfo = await shaderModule.getCompilationInfo()

        const errors = compilationInfo.messages.filter(message => message.type === 'error')
        if (errors.length > 0) {
            throw new Error(errors.map(message => message.message).join('\n'))
        }

        const pipeline = await device.createRenderPipelineAsync({
            layout: 'auto',
            vertex: {
                module: shaderModule,
                entryPoint: 'vertexMain',
                buffers: [{
                    arrayStride: 2 * Float32Array.BYTES_PER_ELEMENT,
                    attributes: [{
                        shaderLocation: 0,
                        offset: 0,
                        format: 'float32x2'
                    }]
                }]
            },
            fragment: {
                module: shaderModule,
                entryPoint: 'fragmentMain',
                targets: [{ format }]
            },
            primitive: {
                topology: 'triangle-list'
            }
        })

        vertexBuffer = device.createBuffer({
            size: vertices.byteLength,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true
        })

        new Float32Array(vertexBuffer.getMappedRange()).set(vertices)
        vertexBuffer.unmap()

        return {
            draw(renderPass) {
                if (destroyed) {
                    return
                }

                renderPass.setPipeline(pipeline)
                renderPass.setVertexBuffer(0, vertexBuffer)
                renderPass.draw(3)
            },
            destroy() {
                if (destroyed) {
                    return
                }

                destroyed = true

                vertexBuffer?.destroy()
                vertexBuffer = null
            }
        }
    } catch (error) {
        vertexBuffer?.destroy()
        throw error
    }
}
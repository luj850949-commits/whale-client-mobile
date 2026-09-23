import { defineConfig } from 'vite'
import uniModule from '@dcloudio/vite-plugin-uni'
import tailwindModule from '@tailwindcss/vite'

const uni = uniModule.default || uniModule
const tailwindcss = tailwindModule.default || tailwindModule

export default defineConfig({
  plugins: [
    uni(),
    tailwindcss(),
  ],
})
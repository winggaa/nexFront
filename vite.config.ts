import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  //  "global 찾으면 그냥 브라우저의 window로 표시"
  define: {
    global: 'window',
  },
})

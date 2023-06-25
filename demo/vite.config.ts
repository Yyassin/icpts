import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    optimizeDeps: {
        include: ["icpts"]
    },
    resolve: {
        dedupe: ["icpts"]
    },
    define: {},
    build: {
        // https://vitejs.dev/guide/dep-pre-bundling.html#monorepos-and-linked-dependencies
        commonjsOptions: { include: [/icpts/, /node_modules/] }
    }
});

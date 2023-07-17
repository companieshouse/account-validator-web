import esbuild from "esbuild";
import path from "path";
import { globPlugin } from "esbuild-plugin-glob";

async function buildAssets() {
    const srcDir = path.join(__dirname, "assets/src");
    const outDir = path.join(__dirname, "assets/dist");

    try {
        await esbuild.build({
            entryPoints: [`${srcDir}/**/*.ts`],
            outdir: outDir,
            bundle: true,
            platform: "browser",
            target: ["es2015"],
            // sourcemap: true, // Uncomment this to emit a source map to view the typescript code in the browser
            minify: true,
            format: "iife",
            plugins: [globPlugin()],
        });
    } catch (error) {
        console.error(`Error building static assets: ${error.message}`);
        process.exit(1);
    }
}

buildAssets();

import esbuild from "esbuild";
import path from "path";

async function buildAssets() {
    // Get command line arguments
    const args = process.argv.slice(2);
    const shouldGenerateSourcemap = args.includes("--sourcemap");

    const srcDir = path.join(__dirname, "assets/src");
    const outDir = path.join(__dirname, "assets/dist");

    try {
        await esbuild.build({
            entryPoints: [`${srcDir}/*.ts`],
            outdir: outDir,
            bundle: true,
            platform: "browser",
            target: ["es2015"],
            sourcemap: shouldGenerateSourcemap,
            minify: true,
            format: "iife",
        });
    } catch (error) {
        console.error(`Error building static assets: ${error.message}`);
        process.exit(1);
    }
}

buildAssets();

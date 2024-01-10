const esbuild = require('esbuild');

(async () => {
    let ctx = await esbuild.context({
        entryPoints: ['src/index.ts'],
        bundle: true,
        outfile: 'dist/index.js',
        format: 'esm',
        platform: 'browser'
    });
    
    await ctx.rebuild();
    
    console.log('Watching...');
    
    await ctx.watch();
})();

import { HtmlRspackPlugin, type RspackPluginInstance } from 'npm:@rspack/core';

const P5PluginName = 'P5InjectPlugin';
const WSPluginName = 'WSScriptPlugin';

/**
 * Defines script that will properly load all files related to a sketch.
 *
 * @param lib - Name of the sketch; it will be used to define the output window Object with setup/draw functions.
 * @param entry - File name of the entrypoint of a sketch.
 * @param scripts - All script names (or single name) of the files that will be loaded and used in the sketch.
 * @returns Script string with all the logic to properly load sketch files and link their exports for global-like use.
 */
const p5GlobalInstanceScript = (
  lib: string,
  entry: string,
  scripts: string | string[],
): string => {
  let sketchCheckingCode: string;
  if (Array.isArray(scripts)) {
    const scriptsStr = scripts.map((s) => `"${s}"`).join(',');

    const scriptPromiseFn = `
      function onLoadPromise(script) {
        return new Promise((resolve, reject) => {
          script.element.onload = function(e) {
            resolve(script.name)
          }
          script.element.onerror = function(e) {
            reject(script.name)
          }
        })
      }
    `;

    sketchCheckingCode = `
      ${scriptPromiseFn}

      const sketchScripts = []
      const scripts = [${scriptsStr}]
      const isSketch = (src) => scripts.some((s) => src.includes(s))
      for (let i = 0; i < bodyE.children.length; i++) {
        const c = bodyE.children[i]
        if (c.tagName === 'SCRIPT' && isSketch(c.src)) {
          const name = scripts.find((s) => c.src.includes(s))
          sketchScripts.push({ name, element: c })
        }
      }

      const promises = sketchScripts.map((s) => onLoadPromise(s))
      const sketchExports = {}
      Promise.all(promises).then((names) => {
        for (let i = 0; i < names.length; i++) {
          const n = names[i]
          if (n === "${entry}") {
            Object.assign(window, window.${lib})
            continue
          }

          Object.assign(window, window[n])
        }
      })
    `;
  } else {
    sketchCheckingCode = `
      let sketchScript
      let i = 0
      while (i < bodyE.children.length) {
          const c = bodyE.children[i]
          if (c.tagName === 'SCRIPT' && c.src.includes("${entry}")) {
              sketchScript = c
              break
          }
          i++
      }

      sketchScript.onload = function(e) {
          Object.assign(window, window.${lib})
      }
    `;
  }

  return `
    <!-- script injected by milka to correctly set p5 global instance -->
    <script defer>
        const bodyE = document.getElementsByTagName('body')[0]
        ${sketchCheckingCode}
    </script>
`;
};

const wsReloadScript = `
  <!-- script injected by milka -->
  <script>
    const ws = new WebSocket(location.href.replace('http', 'ws'))
    ws.onmessage = (e) => {
      const action = e.data
      if (action === 'woof') {
        console.log('🐶 woof!')
      } else if (action === 'reload') {
        location.reload()
      }
    }
  </script>
`;

export const P5InjectPlugin = (
  lib: string,
  sketchEntry: string,
  sketches: string | string[],
): RspackPluginInstance => ({
  apply(compiler) {
    compiler.hooks.compilation.tap(P5PluginName, (compilation) => {
      const hooks = HtmlRspackPlugin.getCompilationHooks(compilation);
      hooks.beforeAssetTagGeneration
        .tap(
          P5PluginName,
          (data) => {
            data.assets.js = [
              'https://cdn.jsdelivr.net/npm/p5@2.1.1/lib/p5.min.js',
              ...data.assets.js,
            ];
            return data;
          },
        );

      hooks.alterAssetTags
        .tap(
          P5PluginName,
          (data) => {
            data.assetTags.scripts = data.assetTags.scripts.map((tag) => {
              const deferCheck = (t: typeof tag) =>
                Array.isArray(sketches)
                  ? sketches.some((e) => t.asset?.includes(e))
                  : t.asset?.includes(sketchEntry);
              if (
                tag.tagName === 'script' && deferCheck(tag)
              ) {
                tag.attributes.defer = true;
              }
              return tag;
            });
            return data;
          },
        );

      hooks.alterAssetTagGroups
        .tap(
          P5PluginName,
          (data) => {
            data.headTags = data.bodyTags.filter((t) =>
              t.asset?.includes('p5')
            );
            data.bodyTags = data.bodyTags.filter((t) =>
              !t.asset?.includes('p5')
            );
            return data;
          },
        );

      hooks.beforeEmit.tap(
        P5PluginName,
        (data) => {
          data.html = data.html.replace(
            '</body>',
            `${p5GlobalInstanceScript(lib, sketchEntry, sketches)}</body>`,
          );
          return data;
        },
      );
    });
  },
});

export const WSScriptPlugin: RspackPluginInstance = {
  apply(compiler) {
    compiler.hooks.compilation.tap(WSPluginName, (compilation) => {
      HtmlRspackPlugin.getCompilationHooks(compilation).beforeEmit.tap(
        WSPluginName,
        (data) => {
          data.html = data.html.replace('</body>', `${wsReloadScript}</body>`);
          return data;
        },
      );
    });
  },
};

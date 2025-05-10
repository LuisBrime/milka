import { HtmlRspackPlugin, type RspackPluginInstance } from 'npm:@rspack/core'

const P5PluginName = 'P5InjectPlugin'

const p5GlobalInstanceScript = `
    <!-- script injected by milka to create p5 global instance -->
    <script defer>
        const bodyE = document.getElementsByTagName('body')[0]
        let sketchScript
        let i = 0
        while (i < bodyE.children.length) {
            const c = bodyE.children[i]
            if (c.tagName === 'SCRIPT' && c.src.includes('sketch')) {
                sketchScript = c
                break
            }
            i++
        }

        sketchScript.onload = function(e) {
            Object.assign(window, window.sketch)
            // new p5()
        }
    </script>
`

export const P5InjectPlugin: RspackPluginInstance = {
  apply(compiler) {
    compiler.hooks.compilation.tap(P5PluginName, (compilation) => {
      const hooks = HtmlRspackPlugin.getCompilationHooks(compilation)
      hooks.beforeAssetTagGeneration
        .tap(
          P5PluginName,
          (data) => {
            data.assets.js = [
              'https://cdn.jsdelivr.net/npm/p5@1.11.5/lib/p5.min.js',
              ...data.assets.js,
            ]
            return data
          },
        )

      hooks.alterAssetTags
        .tap(
          P5PluginName,
          (data) => {
            data.assetTags.scripts = data.assetTags.scripts.map((tag) => {
              if (
                tag.tagName === 'script' && tag.asset?.includes('sketch')
              ) {
                // tag.attributes.type = 'module'
                tag.attributes.defer = true
              }
              return tag
            })
            return data
          },
        )

      hooks.alterAssetTagGroups
        .tap(
          P5PluginName,
          (data) => {
            data.headTags = data.bodyTags.filter((t) => t.asset?.includes('p5'))
            data.bodyTags = data.bodyTags.filter((t) =>
              !t.asset?.includes('p5')
            )
            return data
          },
        )

      hooks.beforeEmit.tap(
        P5PluginName,
        (data) => {
          data.html = data.html.replace(
            '</body>',
            `${p5GlobalInstanceScript}</body>`,
          )
          return data
        },
      )
    })
  },
}

<h1 align="center">milka</h1>

$\color{Lavender}{creative\ coding\ companion.}$

<br>
<h2>🐶 about</h2>

`milka` is a custom server tool built using [deno](https://deno.com/) and
[rspack](https://rspack.dev/) to locally run and reload creative coding sketches
without having to manually create html files for each one. [^1]

<sub><sup> currently only [p5js](https://p5js.org/) is supported for rendering
sketches. </sup></sub>

<br>
<h2>☕️ features</h2>

some features will be added as project progresses, like building projects for
NFT marketplaces; but for now:

### p5js

work with p5js sketches out of the box with no configuration needed, just create
your sketch code with `setup()` and `draw()` functions; making sure to export
them:

```javascript
function setup() {
  // sketch setup
}

function draw() {
  // sketch draw
}

// export them for milka to correctly link them
export default { setup, draw }
```

### hot reload development 💻

> [!IMPORTANT]
> there's no need to setup an `index.html` or any configuration to start working
> on a sketch. just your code and `milka` will handle everything for you

you can add code for your sketches and visualize them on your `localhost` once
`milka` is up and running; any changes done to the sketches files will
automatically be detected and the page will be reloaded.

there's currently 3 formats accepted to work with sketches:

<h4>standalone file</h4>

- creating any `.js` file under `projects/` allows the sketch to be rendered
  when navigating to `localhost:PORT/yourFile`.

<h4>standalone file with configuration</h4>

- you can save your project under a directory inside `projects/` and add your
  sketch `.js` file there, this allows you to add a `milka.config.ts` file if
  you want to configure the project with specific values (more configuration
  will be added as features are created).

<h4>multiple files</h4>

- having a directory inside `projects/` allows you to organize your sketch into
  different files that `milka` will still handle and show when rendering your
  sketch.

- the default entry file used by `milka` for your sketch will be `sketch.js`, if
  you wish to change this value be sure to add a `milka.config.ts` file
  overriding with your preferences:

```typescript
import { ProjectConfig } from '@/compiler/config/index.ts'

export const config: ProjectConfig = {
  entry: 'otherEntryPoint',
}
```

- be sure to export any needed functions or classes needed for your entrypoint
  to render the sketch so `milka` can properly link them:

```javascript
// inside yourOtherFile.js

// ...
// define `myFunction` and `myClass` as you wish
// ...

// make sure to export them
export default { myFunction, MyClass }
```

<br>
<h2>⚙️ installing & running</h2>

only [deno](https://deno.com/) is required to run the project:

1. install dependencies:

```bash
deno install
```

2. run the local server:

```bash
deno run serve
```

the environment variable `PORT` can be set on the `.env` file to change the
default port.

3. navigate to the project you wish to work on:

<strong>example:</strong>

- `localhost:8000/milka` 🔗 this will try to render the sketch found on
  `projects/milka.js`; listen for changes on the file and reload if needed.

> [!NOTE]
> note: for `p5js`, make sure to export the sketch functions (like `setup()` and
> `draw()`) for `milka` to correctly render them.

:shipit:

[^1]: built with 🤍 by me for me

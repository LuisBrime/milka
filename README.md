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

### ⭐️ p5js

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

### ⭐️ hot reload development 💻

> [!IMPORTANT]
> there's no need to setup an `index.html` or any configuration to start working
> on a sketch. just your code and `milka` will handle everything for you

you can add code for your sketches and visualize them on your `localhost` once
`milka` is up and running; any changes done to the sketches files will
automatically be detected and the page will be reloaded.

there's currently 3 formats accepted to work with sketches:

<table>
<tr>
<td width="50%">
<strong>standalone file</strong>
</td>
<td width="50%">
creating any <code>.js</code> file under <code>projects/</code> allows the sketch to be rendered
  when navigating to <code>localhost:PORT/yourFile</code>.
</td>
</tr>
<tr>
<td width="50%">
<strong>standalone with config</strong>
</td>
<td width="50%">
you can save your project under a directory inside <code>projects/</code> and add your
  sketch <code>.js</code> file there, this allows you to add a <code>milka.config.ts</code> file if
  you want to configure the project with specific values (more configuration
  will be added as features are created).
</td>
</tr>
<tr>
<td width="50%">
<strong>multiple files</strong>
</td>
<td width="50%">
having a directory inside <code>projects/</code> allows you to organize your sketch into
  different files that <code>milka</code> will still handle and show when rendering your
  sketch.<br><br>
  the default entry file used by <code>milka</code> for your sketch will be <code>sketch.js</code>, if
  you wish to change this value be sure to add a <code>milka.config.ts</code> file
  overriding with your preferences:<br>
  <pre lang="ts">
  import { ProjectConfig } from '@/compiler/config/index.ts'

export const config: ProjectConfig = {
  entry: 'otherEntryPoint',
}
</pre><br>
be sure to export any needed functions or classes needed for your entrypoint
  to render the sketch so <code>milka</code> can properly link them:<br>
  <pre lang="js">
// inside yourOtherFile.js

// ...
// define `myFunction` and `myClass` as you wish
// ...

// make sure to export them
export default { myFunction, MyClass }
  </pre>
</td>
</tr>
</table>


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

- `localhost:8000/milka` 🔗 this will try to render the sketch matching `milka` (directory or standalone file); listen for changes on the file and reload if needed.

:shipit:

[^1]: built with 🤍 by me for me

<p align="center">
    <h1>milka</h1>
    <samp>$\color{Lavender}{creative\ coding\ companion}$</samp>
</p>

<h2>🐶 about</h2>

`milka` is a custom server tool built using [deno](https://deno.com/) and [rspack](https://rspack.dev/) to locally 
run and reload creative coding sketches without having to manually create html files for each one.[^1]

<sub><sup> currently only [p5js](https://p5js.org/) is supported for rendering sketches. </sup></sub>

<h2>☕️ features</h2>

some features will be added as project progresses, marked ones are available:
- [x] saving sketches under `projects/` and routing website requests to the html with the running sketch.
- [ ] handling multiple file sketches as directories within `projects/`.
- [ ] handling custom css for individual projects.
- [ ] use `lib/` to add shared utilities for projects and make them available for each sketch.

<h2>⚙️ installing & running</h2>

only [deno](https://deno.com/) is required to run the project:

1. Install dependencies:

```bash
deno install
```

2. Run the local server:

```bash
deno run serve
```

the environment variable `PORT` can be set on the `.env` file to change the default port.

3. navigate to the project you wish to work on:

example: 
- `localhost:8000/milka` 🔗 this will try to render the sketch found on `projects/milka.js`; listen for 
changes on the file and reload if needed.

<table><tr><td>
    note: for [p5js](https://p5js.org/), make sure to export the sketch functions for `milka` to correctly 
    render them:
    <pre lang="js">
        export default { sketch, draw }
    </pre>
</table></tr></td>

[^1]built with 🤍 by me for me

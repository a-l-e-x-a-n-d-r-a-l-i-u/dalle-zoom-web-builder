# dalle-zoom-web-builder

This project is an attempt to make automatic tooling to help make dalle zoom videos using the dalle infill feature over and over with the same image set.
It will take your image and crop and resize it for appropriate upload back to dalle, and it will (hopefully) merge those images together into one continuous video.

## TODO

- The video looks terrible. The speed is inconsistent. And composite is unaligned. FFMPEG filters are an art, apparently.
- The website UI is terrible. It is all boilerplate now, but the plan is to put some retro looking UI in like https://github.com/botoxparty/XP.css or https://github.com/sakofchit/system.css

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

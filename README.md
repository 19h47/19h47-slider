# @19h47/slider

Multi-thumb range slider controller (APG-style).
**One instance controls both thumbs** inside a rail and prevents crossing (\(min \le max\)).

Based on the W3C APG multi-thumb slider pattern:
[W3C APG – Horizontal Multi-Thumb Slider Example](https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/examples/slider-multithumb/)

## Installation

```bash
npm i @19h47/slider
```

## Markup (HTML-first)

The controller expects a **rail element** that contains **exactly 2 thumbs** with `role="slider"`.

The library is HTML-first for ARIA attributes (it does not set `aria-orientation` at runtime),
but its internal `orientation` is determined by the JS option.

**Important:** thumbs order matters (matches APG):
- **first thumb** = **max**
- **second thumb** = **min**

Example:

```html
<div class="rail">
  <button
    role="slider"
    tabindex="0"
    class="max"
    aria-label="Maximum value"
    aria-valuemin="0"
    aria-valuemax="35"
    aria-valuenow="35"
    aria-valuetext="35"
    aria-orientation="horizontal"
  ></button>

  <button
    role="slider"
    tabindex="0"
    class="min"
    aria-label="Minimum value"
    aria-valuemin="0"
    aria-valuemax="35"
    aria-valuenow="0"
    aria-valuetext="0"
    aria-orientation="horizontal"
  ></button>
</div>
```

The controller keeps these attributes updated:
- `aria-valuenow` / `aria-valuetext` on both thumbs
- `aria-valuemin` on the **max** thumb (set to current min)
- `aria-valuemax` on the **min** thumb (set to current max)

## Usage

```javascript

import Slider from '@19h47/slider'

const rail = document.querySelector('.rail')
const slider = new Slider(rail, { orientation: 'horizontal', width: 24, height: 24 })

slider.init();
```

If you attach sliders dynamically, call `destroy()` to remove global listeners:

```js
slider.destroy()
```

## Options

```ts
type Orientation = 'horizontal' | 'vertical'

type Options = {
  orientation: Orientation
  width: number
  height: number
  direction: 'auto' | 'ltr' | 'rtl'
  step: number
  page: number
}
```

Defaults:
- `orientation`: `'horizontal'`
- `width`: `24`
- `height`: `24`
- `direction`: `'auto'` (reads `getComputedStyle(rail).direction`)
- `step`: `1`
- `page`: `10`

Notes:
- This implementation keeps the thumbs **always visible** by applying a constant 1-thumb offset (vertical: min thumb; horizontal: max thumb), matching the original library approach.
- In RTL (`direction: 'rtl'` or `dir="rtl"`), the horizontal slider reverses the value axis (higher values to the left) and swaps Left/Right arrow behavior.

## Events

The controller dispatches a DOM event on the **rail**:

- **name**: `Slider.change`
- **target**: rail element
- **detail**:

```ts
type Detail = {
  min: number
  max: number
  active: 'min' | 'max'
}
```

Example:

```js
rail.addEventListener('Slider.change', (event) => {
  const { min, max, active } = event.detail
  console.log({ min, max, active })
})
```

## Keyboard support

| Key         | Function                                                                   |
| ----------- | -------------------------------------------------------------------------- |
| Right Arrow | Increases slider value one step.                                           |
| Up Arrow    | Increases slider value one step.                                           |
| Left Arrow  | Decreases slider value one step.                                           |
| Down Arrow  | Decreases slider value one step.                                           |
| Page Up     | Increases slider value by `page`.                                          |
| Page Down   | Decreases slider value by `page`.                                          |
| Home        | Sets slider to its minimum value.                                          |
| End         | Sets slider to its maximum value.                                          |

## Orientation + positioning

This package positions thumbs via `transform: translate3d(...)`.

It uses a “thumb origin” coordinate system (top-left of the thumb) and:

- **track**: `railLength - 2 * thumbSize`
- **offset** (always visible):
  - vertical: min thumb is offset by `+height`
  - horizontal: max thumb is offset by `+width`

So your CSS should set a stable origin for thumbs (e.g. `top: 0` for vertical, `left: 0` for horizontal) and let JS handle positioning.

## Acknowledgments

- [Multithumb slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/)

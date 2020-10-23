# @19h47/slider

## Usage

```javascript

import Slider from @19h47/slider

const $slider = document.querySelector('[role=slider]');
const slider = new Slider($slider);

slider.init();
```

## Keyboard Support

| Key         | Function                                                                   |
| ----------- | -------------------------------------------------------------------------- |
| Right Arrow | Increases slider value one step.                                           |
| Up Arrow    | Increases slider value one step.                                           |
| Left Arrow  | Decreases slider value one step.                                           |
| Down Arrow  | Decreases slider value one step.                                           |
| Page Up     | Increases slider value multiple steps.<br>In this slider, jumps ten steps. |
| Page Down   | Decreases slider value multiple steps.<br>In this slider, jumps ten steps. |
| Home        | Sets slider to its minimum value.                                          |
| End         | Sets slider to its maximum value.                                          |

## Event

| Event         | Arguments | Description                      |
| ------------- | --------- | -------------------------------- |
| Slider.change | event     | Object containing **now** value. |

```javascript

import Slider from @19h47/slider

const $slider = document.querySelector('[role=slider]');
const slider = new Slider($slider);

slider.init();

slider.on('Slider.change', ({ now ) => {
	console.log(now);
});

```

## Acknowledgments

-   [Multithumb slider](https://www.w3.org/TR/wai-aria-practices/examples/slider/multithumb-slider.html)

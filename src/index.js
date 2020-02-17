import {
	ARROW_UP,
	ARROW_RIGHT,
	ARROW_DOWN,
	ARROW_LEFT,
	PAGE_UP,
	PAGE_DOWN,
	HOME,
	END,
} from '@19h47/keycode';
import EventDispatcher from '@/EventDispatcher';


const optionsDefault = {
	valueNow: 50,
	valueText: 50,
	valueMin: 0,
	valueMax: 100,
	thumbWidth: 20,
	thumbHeight: 24,
};


class Slider extends EventDispatcher {
	constructor(element, options = {}) {
		super(['Slider.change']);

		this.rootElement = element;

		this.options = Object.assign({}, optionsDefault, options);

		// Elements
		this.$rail = this.rootElement.parentNode;

		// this.$label = false;
		this.$min = false;
		this.$max = false;

		this.valueNow = this.options.valueNow;
		this.valueText = this.options.valueText;
		this.valueMin = this.options.valueMin;
		this.valueMax = this.options.valueMax;

		// Rail
		this.railRect = this.$rail.getBoundingClientRect();
		this.railWidth = parseInt(this.railRect.width, 10);
		this.railLeft = parseInt(this.railRect.left, 10);
		this.railBorderWidth = 0;

		this.thumbWidth = this.options.thumbWidth;
		this.thumbHeight = this.options.thumbHeight;

		// Bind
		this.onKeydown = this.onKeydown.bind(this);
	}


	init() {
		const { previousElementSibling: $previous, nextElementSibling: $next } = this.rootElement;

		if ($next) {
			this.$min = $next;
			this.valueMin = parseInt((this.$min.getAttribute('aria-valuemin')), 10);
		} else {
			this.valueMin = parseInt((this.rootElement.getAttribute('aria-valuemin')), 10);
		}

		if ($previous) {
			this.$max = $previous;
			this.valueMax = parseInt((this.$max.getAttribute('aria-valuemax')), 10);
		} else {
			this.valueMax = parseInt((this.rootElement.getAttribute('aria-valuemax')), 10);
		}

		this.valueNow = parseInt((this.rootElement.getAttribute('aria-valuenow')), 10);

		this.initEvents();
		this.moveSliderTo(this.valueNow);
	}


	initEvents() {
		this.rootElement.addEventListener('keydown', this.onKeydown);
		this.rootElement.addEventListener('mousedown', this.drag.bind(this));
		this.rootElement.addEventListener('focus', this.handleFocus.bind(this));
		this.rootElement.addEventListener('blur', this.handleBlur.bind(this));

		this.rootElement.addEventListener('touchstart', this.drag.bind(this), { passive: false });
	}


	onKeydown(event) {
		const key = event.keyCode || event.which;

		const move = value => {
			this.moveSliderTo(value);

			event.preventDefault();
			event.stopPropagation();
		};

		const codes = {
			[ARROW_UP]: () => move(this.valueNow + 1),
			[ARROW_RIGHT]: () => move(this.valueNow + 1),
			[ARROW_DOWN]: () => move(this.valueNow - 1),
			[ARROW_LEFT]: () => move(this.valueNow - 1),
			[PAGE_UP]: () => move(this.valueNow + 10),
			[PAGE_DOWN]: () => move(this.valueNow - 10),
			[HOME]: () => move(this.valueMin),
			[END]: () => move(this.valueMax),
			default: () => false,
		};

		return (codes[key] || codes.default)();
	}

	drag(event) {
		const railRect = this.$rail.getBoundingClientRect();

		const handleMouseMove = e => {
			const diffY = (e.touches ? e.touches[0].clientY : e.clientY) - railRect.top; // eslint-disable-line max-len

			this.valueNow = this.valueMax - parseInt(((this.valueMax - this.valueMin) * diffY) / railRect.height, 10); // eslint-disable-line max-len

			this.moveSliderTo(this.valueNow);

			if (!e.touches) {
				e.preventDefault();
				e.stopPropagation();
			}
		};

		const handleMouseUp = () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);

			document.removeEventListener('touchmove', handleMouseMove, { passive: true });
			document.removeEventListener('touchend', handleMouseUp, { passive: true });
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);

		document.addEventListener('touchmove', handleMouseMove, false);
		document.addEventListener('touchend', handleMouseUp, false);

		event.preventDefault();
		event.stopPropagation();

		// Set focus to the clicked handle
		this.rootElement.focus();
	}


	moveSliderTo(value) {
		const valueMax = parseInt(this.rootElement.getAttribute('aria-valuemax'), 10);
		const valueMin = parseInt(this.rootElement.getAttribute('aria-valuemin'), 10);
		const railRect = this.$rail.getBoundingClientRect();

		if (value > valueMax) {
			value = valueMax; // eslint-disable-line no-param-reassign
		}

		if (value < valueMin) {
			value = valueMin; // eslint-disable-line no-param-reassign
		}

		this.valueNow = value;
		this.valueText = value;

		this.rootElement.setAttribute('aria-valuenow', this.valueNow);
		this.rootElement.setAttribute('aria-valuetext', this.dolValueNow);

		const position = Math.round((this.valueMax - this.valueNow) * (railRect.height - 2 * (this.thumbHeight - this.railBorderWidth))) / (this.valueMax - this.valueMin); // eslint-disable-line max-len

		if (this.$min) {
			this.$min.setAttribute('aria-valuemax', this.valueNow);
			this.$rail.setAttribute('data-max', this.valueNow);
			this.rootElement.style.setProperty('top', `${(position * 100) / this.railRect.height}%`);
		}

		if (this.$max) {
			this.$max.setAttribute('aria-valuemin', this.valueNow);
			this.$rail.setAttribute('data-min', this.valueNow);
			this.rootElement.style.setProperty('top', `calc( ${(position * 100) / this.railRect.height}% + ${this.thumbHeight - this.railBorderWidth}px )`);
		}

		if (this.$label) {
			this.$label.innerHTML = this.valueText.toString();
		}

		this.emit('Slider.change', { now: this.valueNow });
	}

	handleFocus() {
		this.rootElement.classList.add('focus');
		this.$rail.classList.add('focus');
	}

	handleBlur() {
		this.rootElement.classList.remove('focus');
		this.$rail.classList.remove('focus');
	}
}


export default Slider;

type Orientation = "horizontal" | "vertical";
type Direction = "auto" | "ltr" | "rtl";

export interface Options {
	orientation: Orientation;
	width: number;
	height: number;
	direction: Direction;
	step: number;
	page: number;
}

const defaults: Options = {
	orientation: "horizontal",
	width: 24,
	height: 24,
	direction: "auto",
	step: 1,
	page: 10,
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const blur = (target: Element | null) => target && target.classList.remove("focus");
const focus = (target: Element | null) => target && target.classList.add("focus");

function toInt(value: string | null, fallback: number) {
	const n = parseInt(value || "", 10);
	return Number.isFinite(n) ? n : fallback;
}

export type Detail = {
	min: number;
	max: number;
	active: "min" | "max";
};

/**
 * Multi-thumb slider controller (APG-style).
 * One instance controls BOTH thumbs and prevents crossing.
 */
export default class Slider {
	$rail: HTMLElement;
	$min: HTMLElement;
	$max: HTMLElement;

	orientation: Orientation;
	width: number;
	height: number;
	direction: Direction;
	step: number;
	page: number;

	private active: "min" | "max" = "min";
	private isMoving = false;
	private moving: "min" | "max" | null = null;

	constructor(rail: HTMLElement, options: Partial<Options> = {}) {
		this.$rail = rail;
		const opts = { ...defaults, ...options };
		this.orientation = opts.orientation;
		this.width = opts.width;
		this.height = opts.height;
		this.direction = opts.direction;
		this.step = opts.step;
		this.page = opts.page;

		const thumbs = [...this.$rail.querySelectorAll<HTMLElement>('[role="slider"]')];

		if (thumbs.length < 2) {
			throw new Error("Slider: expected 2 thumbs inside rail");
		}

		this.$max = thumbs[0];
		this.$min = thumbs[1];
	}

	private get horizontal() {
		return this.orientation === "horizontal";
	}

	private get rtl() {
		if (this.direction === "rtl") {
			return true;
		}

		if (this.direction === "ltr") {
			return false;
		}

		return getComputedStyle(this.$rail).direction === "rtl";
	}

	/**
	 * Returns a snapshot of the rail bounding rect.
	 */
	rect() {
		return this.$rail.getBoundingClientRect();
	}

	private get length() {
		const { width, height } = this.rect();
		return this.horizontal ? width : height;
	}

	private get size() {
		return this.horizontal ? this.width : this.height;
	}

	private get track() {
		return Math.max(0, this.length - 2 * this.size);
	}

	private get state() {
		return {
			min: toInt(this.$min.getAttribute("aria-valuemin"), 0),
			max: toInt(this.$max.getAttribute("aria-valuemax"), 100),
		};
	}

	private get min() {
		return toInt(this.$min.getAttribute("aria-valuenow"), this.state.min);
	}

	private get max() {
		return toInt(this.$max.getAttribute("aria-valuenow"), this.state.max);
	}

	init() {
		this.$min.addEventListener("pointerdown", this.handlePointerdown);
		this.$max.addEventListener("pointerdown", this.handlePointerdown);

		this.$min.addEventListener("keydown", this.handleKeydown);
		this.$max.addEventListener("keydown", this.handleKeydown);

		this.$min.addEventListener("focus", this.handleFocus);
		this.$max.addEventListener("focus", this.handleFocus);
		this.$min.addEventListener("blur", this.handleBlur);
		this.$max.addEventListener("blur", this.handleBlur);

		document.addEventListener("pointermove", this.handlePointermove);
		document.addEventListener("pointerup", this.handlePointerup);

		this.update(this.min, this.max);
	}

	destroy() {
		this.$min.removeEventListener("pointerdown", this.handlePointerdown);
		this.$max.removeEventListener("pointerdown", this.handlePointerdown);

		this.$min.removeEventListener("keydown", this.handleKeydown);
		this.$max.removeEventListener("keydown", this.handleKeydown);

		this.$min.removeEventListener("focus", this.handleFocus);
		this.$max.removeEventListener("focus", this.handleFocus);
		this.$min.removeEventListener("blur", this.handleBlur);
		this.$max.removeEventListener("blur", this.handleBlur);

		document.removeEventListener("pointermove", this.handlePointermove);
		document.removeEventListener("pointerup", this.handlePointerup);
	}

	update(minimum: number, maximum: number, active: "min" | "max" = this.active) {
		const { min: gmin, max: gmax } = this.state;

		let min = clamp(minimum, gmin, gmax);
		let max = clamp(maximum, gmin, gmax);

		if (active === "min") {
			min = Math.min(min, max);
		} else {
			max = Math.max(max, min);
		}

		this.$min.setAttribute("aria-valuenow", String(min));
		this.$max.setAttribute("aria-valuenow", String(max));
		this.$min.setAttribute("aria-valuetext", String(min));
		this.$max.setAttribute("aria-valuetext", String(max));

		this.$min.setAttribute("aria-valuemax", String(max));
		this.$max.setAttribute("aria-valuemin", String(min));

		this.position(this.$max, max);
		this.position(this.$min, min);
		this.applyZIndex(min, max, active);

		this.$rail.dispatchEvent(
			new CustomEvent("Slider.change", {
				detail: { min, max, active },
				bubbles: true,
			}),
		);
	}

	private applyZIndex(min: number, max: number, active: "min" | "max") {
		this.$min.style.zIndex = "1";
		this.$max.style.zIndex = "1";

		if (min !== max) {
			this.$max.style.zIndex = "2";
			return;
		}

		if (active === "min") {
			this.$min.style.zIndex = "3";
			return;
		}

		this.$max.style.zIndex = "3";
	}

	/**
	 * Returns the thumb offset (in px) applied to keep thumbs always visible.
	 *
	 * - vertical: the **min** thumb is offset down by 1 thumb height
	 * - horizontal: the **max** thumb is offset right by 1 thumb width
	 */
	private offset(which: "min" | "max"): number {
		if (!this.horizontal) {
			return which === "min" ? this.height : 0;
		}

		if (this.rtl) {
			return which === "min" ? this.width : 0;
		}

		return which === "max" ? this.width : 0;
	}

	private position(el: HTMLElement, value: number) {
		const { min: gmin, max: gmax } = this.state;
		const range = Math.max(1, gmax - gmin);
		const base = this.horizontal ? (this.rtl ? gmax - value : value - gmin) : gmax - value;
		const pos = Math.round((base * this.track) / range);

		const which = el === this.$min ? "min" : "max";
		const translate = clamp(pos, 0, this.track) + this.offset(which);

		if (this.horizontal) {
			el.style.setProperty("transform", `translate3d(${translate}px, 0, 0)`);
			return;
		}

		el.style.setProperty("transform", `translate3d(0, ${translate}px, 0)`);
	}

	private value(event: PointerEvent, which: "min" | "max"): number {
		const { left, top } = this.rect();
		const coordinate = this.horizontal ? event.clientX : event.clientY;
		const start = this.horizontal ? left : top;
		const offset = this.offset(which);

		const difference = coordinate - start - offset;

		const position = clamp(difference, 0, this.track);
		const ratio = this.track > 0 ? position / this.track : 0;
		const { min, max } = this.state;
		const span = max - min;

		if (!this.horizontal) {
			return Math.round(max - span * ratio);
		}

		if (this.rtl) {
			return Math.round(max - span * ratio);
		}

		return Math.round(min + span * ratio);
	}

	private handlePointerdown = (event: PointerEvent) => {
		const target = event.currentTarget as HTMLElement;
		this.active = target === this.$min ? "min" : "max";
		this.isMoving = true;
		this.moving = this.active;
		target.focus({ preventScroll: true });

		event.preventDefault();
		event.stopPropagation();
	};

	private handlePointermove = (event: PointerEvent) => {
		if (!this.isMoving || !this.moving) {
			return;
		}

		const next = this.value(event, this.moving);

		if (this.moving === "min") {
			this.update(next, this.max, "min");
		} else {
			this.update(this.min, next, "max");
		}

		event.preventDefault();
		event.stopPropagation();
	};

	private handlePointerup = () => {
		this.isMoving = false;
		this.moving = null;
	};

	private handleKeydown = (event: KeyboardEvent) => {
		const target = event.currentTarget as HTMLElement;

		this.active = target === this.$min ? "min" : "max";

		const step = this.step;
		const page = this.page;

		const current = () => (this.active === "min" ? this.min : this.max);

		const move = (value: number) => {
			if (this.active === "min") {
				this.update(value, this.max, "min");
			}

			if (this.active === "max") {
				this.update(this.min, value, "max");
			}

			event.preventDefault();
			event.stopPropagation();
		};

		const horizontalIncrease = () =>
			this.horizontal && this.rtl ? current() - step : current() + step;
		const horizontalDecrease = () =>
			this.horizontal && this.rtl ? current() + step : current() - step;

		const codes: Record<string, () => void> & { default: () => false } = {
			ArrowUp: () => move(current() + step),
			ArrowRight: () => move(horizontalIncrease()),
			ArrowDown: () => move(current() - step),
			ArrowLeft: () => move(horizontalDecrease()),
			PageUp: () => move(current() + page),
			PageDown: () => move(current() - page),
			Home: () => move(this.active === "min" ? this.state.min : this.min),
			End: () => move(this.active === "max" ? this.state.max : this.max),
			default: () => false,
		};

		return (codes[event.key] || codes.default)();
	};

	private handleFocus = (event: FocusEvent) => {
		const $el = event.currentTarget as HTMLElement;

		focus($el);
		focus(this.$rail);
	};

	private handleBlur = (event: FocusEvent) => {
		const $el = event.currentTarget as HTMLElement;

		blur($el);
		blur(this.$rail);
	};
}

type Orientation = 'horizontal' | 'vertical'
type Direction = 'auto' | 'ltr' | 'rtl'

export interface Options {
	orientation: Orientation
	width: number
	height: number
	direction: Direction
}

const defaults: Options = {
	orientation: 'vertical',
	width: 24,
	height: 24,
	direction: 'auto',
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
const blur = (target: Element | null) => target && target.classList.remove('focus')
const focus = (target: Element | null) => target && target.classList.add('focus')

function toInt(value: string | null, fallback: number) {
	const n = parseInt(value || '', 10)
	return Number.isFinite(n) ? n : fallback
}

export type SliderChangeDetail = {
	min: number
	max: number
	active: 'min' | 'max'
}

/**
 * Multi-thumb slider controller (APG-style).
 * One instance controls BOTH thumbs and prevents crossing.
 */
export default class Slider {
	$rail: HTMLElement
	$min: HTMLElement
	$max: HTMLElement

	orientation: Orientation
	width: number
	height: number
	direction: Direction

	private active: 'min' | 'max' = 'min'
	private isMoving = false
	private moving: 'min' | 'max' | null = null

	constructor(rail: HTMLElement, options: Partial<Options> = {}) {
		this.$rail = rail
		const opts = { ...defaults, ...options }
		this.orientation = opts.orientation
		this.width = opts.width
		this.height = opts.height
		this.direction = opts.direction

		const thumbs = [...this.$rail.querySelectorAll<HTMLElement>('[role="slider"]')]

		if (thumbs.length < 2) {
			throw new Error('Slider: expected 2 thumbs inside rail')
		}

		this.$max = thumbs[0]
		this.$min = thumbs[1]
	}

	private get horizontal() {
		return this.orientation === 'horizontal'
	}

	private get rtl() {
		if (this.direction === 'rtl') {
			return true
		}

		if (this.direction === 'ltr') {
			return false
		}

		return getComputedStyle(this.$rail).direction === 'rtl'
	}

	private get railRect() {
		return this.$rail.getBoundingClientRect()
	}

	private get railLength() {
		return this.horizontal ? this.railRect.width : this.railRect.height
	}

	private get size() {
		return this.horizontal ? this.width : this.height
	}

	private get track() {
		return Math.max(0, this.railLength - 2 * this.size)
	}

	private get globalMin() {
		return toInt(this.$min.getAttribute('aria-valuemin'), 0)
	}

	private get globalMax() {
		return toInt(this.$max.getAttribute('aria-valuemax'), 100)
	}

	private get min() {
		return toInt(this.$min.getAttribute('aria-valuenow'), this.globalMin)
	}

	private get max() {
		return toInt(this.$max.getAttribute('aria-valuenow'), this.globalMax)
	}

	init() {
		// Ensure HTML-first orientation is reflected when option provided.
		this.$min.setAttribute('aria-orientation', this.orientation)
		this.$max.setAttribute('aria-orientation', this.orientation)

		this.$min.addEventListener('pointerdown', this.handlePointerdown)
		this.$max.addEventListener('pointerdown', this.handlePointerdown)

		this.$min.addEventListener('keydown', this.handleKeydown)
		this.$max.addEventListener('keydown', this.handleKeydown)

		this.$min.addEventListener('focus', this.handleFocus)
		this.$max.addEventListener('focus', this.handleFocus)
		this.$min.addEventListener('blur', this.handleBlur)
		this.$max.addEventListener('blur', this.handleBlur)

		document.addEventListener('pointermove', this.handlePointermove)
		document.addEventListener('pointerup', this.handlePointerup)

		this.update(this.min, this.max)
	}

	destroy() {
		this.$min.removeEventListener('pointerdown', this.handlePointerdown)
		this.$max.removeEventListener('pointerdown', this.handlePointerdown)

		this.$min.removeEventListener('keydown', this.handleKeydown)
		this.$max.removeEventListener('keydown', this.handleKeydown)

		this.$min.removeEventListener('focus', this.handleFocus)
		this.$max.removeEventListener('focus', this.handleFocus)
		this.$min.removeEventListener('blur', this.handleBlur)
		this.$max.removeEventListener('blur', this.handleBlur)

		document.removeEventListener('pointermove', this.handlePointermove)
		document.removeEventListener('pointerup', this.handlePointerup)
	}

	private update(minimum: number, maximum: number, active: 'min' | 'max' = this.active) {
		const gmin = this.globalMin
		const gmax = this.globalMax

		let min = clamp(minimum, gmin, gmax)
		let max = clamp(maximum, gmin, gmax)

		if (active === 'min') {
			min = Math.min(min, max)
		} else {
			max = Math.max(max, min)
		}

		this.$min.setAttribute('aria-valuenow', String(min))
		this.$max.setAttribute('aria-valuenow', String(max))
		this.$min.setAttribute('aria-valuetext', String(min))
		this.$max.setAttribute('aria-valuetext', String(max))

		this.$min.setAttribute('aria-valuemax', String(max))
		this.$max.setAttribute('aria-valuemin', String(min))

		this.positionThumb(this.$max, max)
		this.positionThumb(this.$min, min)
		this.applyZIndex(min, max, active)

		this.$rail.dispatchEvent(
			new CustomEvent('Slider.change', {
				detail: { min, max, active },
				bubbles: true,
			}),
		)
	}

	private applyZIndex(min: number, max: number, active: 'min' | 'max') {
		this.$min.style.zIndex = '1'
		this.$max.style.zIndex = '1'

		if (min !== max) {
			this.$max.style.zIndex = '2'
			return
		}

		if (active === 'min') {
			this.$min.style.zIndex = '3'
		} else {
			this.$max.style.zIndex = '3'
		}
	}


	// - vertical: min thumb is offset down by 1 thumb so both are visible
	// - horizontal: max thumb is offset right by 1 thumb so both are visible
	private offset(which: 'min' | 'max'): number {
		if (this.horizontal) {
			if (this.rtl) {
				return which === 'min' ? this.width : 0
			}

			return which === 'max' ? this.width : 0
		}

		return which === 'min' ? this.height : 0
	}

	private positionThumb(el: HTMLElement, value: number) {
		const gmin = this.globalMin
		const gmax = this.globalMax
		const range = Math.max(1, gmax - gmin)
		const base = this.horizontal ? (this.rtl ? gmax - value : value - gmin) : gmax - value
		const pos = Math.round((base * this.track) / range)

		const which = el === this.$min ? 'min' : 'max'
		const t = clamp(pos, 0, this.track) + this.offset(which)

		el.style.setProperty(
			'transform',
			this.horizontal
				? `translate3d(${t}px, 0, 0)`
				: `translate3d(0, ${t}px, 0)`,
		)
	}

	private valueFromPointer(event: PointerEvent, which: 'min' | 'max') {
		const { left, top } = this.railRect
		const coordinate = this.horizontal ? event.clientX : event.clientY
		const start = this.horizontal ? left : top
		const offset = this.offset(which)

		const difference = coordinate - start - offset

		const x = clamp(difference, 0, this.track)
		const ratio = this.track > 0 ? x / this.track : 0
		const span = this.globalMax - this.globalMin

		const raw = this.horizontal
			? this.rtl
				? this.globalMax - span * ratio
				: this.globalMin + span * ratio
			: this.globalMax - span * ratio
		return Math.round(raw)
	}

	private handlePointerdown = (event: PointerEvent) => {
		const target = event.currentTarget as HTMLElement
		this.active = target === this.$min ? 'min' : 'max'
		this.isMoving = true
		this.moving = this.active
		target.focus({ preventScroll: true })

		event.preventDefault()
		event.stopPropagation()
	}

	private handlePointermove = (event: PointerEvent) => {
		if (!this.isMoving || !this.moving) {
			return
		}

		const next = this.valueFromPointer(event, this.moving)

		if (this.moving === 'min') {
			this.update(next, this.max, 'min')
		} else {
			this.update(this.min, next, 'max')
		}

		event.preventDefault()
		event.stopPropagation()
	}

	private handlePointerup = () => {
		this.isMoving = false
		this.moving = null
	}

	private handleKeydown = (event: KeyboardEvent) => {
		const target = event.currentTarget as HTMLElement

		this.active = target === this.$min ? 'min' : 'max'

		const step = 1
		const page = 10

		const current = () => (this.active === 'min' ? this.min : this.max)

		const move = (value: number) => {
			if (this.active === 'min') {
				this.update(value, this.max, 'min')
			} else {
				this.update(this.min, value, 'max')
			}

			event.preventDefault()
			event.stopPropagation()
		}

		const horizontalIncrease = () => (this.horizontal && this.rtl ? current() - step : current() + step)
		const horizontalDecrease = () => (this.horizontal && this.rtl ? current() + step : current() - step)

		const codes: Record<string, () => void> & { default: () => false } = {
			ArrowUp: () => move(current() + step),
			ArrowRight: () => move(horizontalIncrease()),
			ArrowDown: () => move(current() - step),
			ArrowLeft: () => move(horizontalDecrease()),
			PageUp: () => move(current() + page),
			PageDown: () => move(current() - page),
			Home: () => move(this.active === 'min' ? this.globalMin : this.min),
			End: () => move(this.active === 'max' ? this.globalMax : this.max),
			default: () => false,
		}

		return (codes[event.key] || codes.default)()
	}

	private handleFocus = (event: FocusEvent) => {
		const $el = event.currentTarget as HTMLElement

		focus($el)
		focus(this.$rail)
	}

	private handleBlur = (event: FocusEvent) => {
		const $el = event.currentTarget as HTMLElement

		blur($el)
		blur(this.$rail)
	}
}


const $ = {
  orientation: "horizontal",
  width: 24,
  height: 24,
  direction: "auto",
  step: 1,
  page: 10
}, p = (l, e, r) => Math.min(r, Math.max(e, l)), x = (l) => l && l.classList.remove("focus"), f = (l) => l && l.classList.add("focus");
function g(l, e) {
  const r = parseInt(l || "", 10);
  return Number.isFinite(r) ? r : e;
}
class w {
  constructor(e, r = {}) {
    this.active = "min", this.isMoving = !1, this.moving = null, this.handlePointerdown = (i) => {
      const t = i.currentTarget;
      this.active = t === this.$min ? "min" : "max", this.isMoving = !0, this.moving = this.active, t.focus({ preventScroll: !0 }), i.preventDefault(), i.stopPropagation();
    }, this.handlePointermove = (i) => {
      if (!this.isMoving || !this.moving)
        return;
      const t = this.value(i, this.moving);
      this.moving === "min" ? this.update(t, this.max, "min") : this.update(this.min, t, "max"), i.preventDefault(), i.stopPropagation();
    }, this.handlePointerup = () => {
      this.isMoving = !1, this.moving = null;
    }, this.handleKeydown = (i) => {
      const t = i.currentTarget;
      this.active = t === this.$min ? "min" : "max";
      const n = this.step, m = this.page, a = () => this.active === "min" ? this.min : this.max, o = (v) => {
        this.active === "min" && this.update(v, this.max, "min"), this.active === "max" && this.update(this.min, v, "max"), i.preventDefault(), i.stopPropagation();
      }, c = () => this.horizontal && this.rtl ? a() - n : a() + n, u = () => this.horizontal && this.rtl ? a() + n : a() - n, d = {
        ArrowUp: () => o(a() + n),
        ArrowRight: () => o(c()),
        ArrowDown: () => o(a() - n),
        ArrowLeft: () => o(u()),
        PageUp: () => o(a() + m),
        PageDown: () => o(a() - m),
        Home: () => o(this.active === "min" ? this.state.min : this.min),
        End: () => o(this.active === "max" ? this.state.max : this.max),
        default: () => !1
      };
      return (d[i.key] || d.default)();
    }, this.handleFocus = (i) => {
      const t = i.currentTarget;
      f(t), f(this.$rail);
    }, this.handleBlur = (i) => {
      const t = i.currentTarget;
      x(t), x(this.$rail);
    }, this.$rail = e;
    const s = { ...$, ...r };
    this.orientation = s.orientation, this.width = s.width, this.height = s.height, this.direction = s.direction, this.step = s.step, this.page = s.page;
    const h = [...this.$rail.querySelectorAll('[role="slider"]')];
    if (h.length < 2)
      throw new Error("Slider: expected 2 thumbs inside rail");
    this.$max = h[0], this.$min = h[1];
  }
  get horizontal() {
    return this.orientation === "horizontal";
  }
  get rtl() {
    return this.direction === "rtl" ? !0 : this.direction === "ltr" ? !1 : getComputedStyle(this.$rail).direction === "rtl";
  }
  get railRect() {
    return this.$rail.getBoundingClientRect();
  }
  get railLength() {
    return this.horizontal ? this.railRect.width : this.railRect.height;
  }
  get size() {
    return this.horizontal ? this.width : this.height;
  }
  get track() {
    return Math.max(0, this.railLength - 2 * this.size);
  }
  get state() {
    return {
      min: g(this.$min.getAttribute("aria-valuemin"), 0),
      max: g(this.$max.getAttribute("aria-valuemax"), 100)
    };
  }
  get min() {
    return g(this.$min.getAttribute("aria-valuenow"), this.state.min);
  }
  get max() {
    return g(this.$max.getAttribute("aria-valuenow"), this.state.max);
  }
  init() {
    this.$min.addEventListener("pointerdown", this.handlePointerdown), this.$max.addEventListener("pointerdown", this.handlePointerdown), this.$min.addEventListener("keydown", this.handleKeydown), this.$max.addEventListener("keydown", this.handleKeydown), this.$min.addEventListener("focus", this.handleFocus), this.$max.addEventListener("focus", this.handleFocus), this.$min.addEventListener("blur", this.handleBlur), this.$max.addEventListener("blur", this.handleBlur), document.addEventListener("pointermove", this.handlePointermove), document.addEventListener("pointerup", this.handlePointerup), this.update(this.min, this.max);
  }
  destroy() {
    this.$min.removeEventListener("pointerdown", this.handlePointerdown), this.$max.removeEventListener("pointerdown", this.handlePointerdown), this.$min.removeEventListener("keydown", this.handleKeydown), this.$max.removeEventListener("keydown", this.handleKeydown), this.$min.removeEventListener("focus", this.handleFocus), this.$max.removeEventListener("focus", this.handleFocus), this.$min.removeEventListener("blur", this.handleBlur), this.$max.removeEventListener("blur", this.handleBlur), document.removeEventListener("pointermove", this.handlePointermove), document.removeEventListener("pointerup", this.handlePointerup);
  }
  update(e, r, s = this.active) {
    const { min: h, max: i } = this.state;
    let t = p(e, h, i), n = p(r, h, i);
    s === "min" ? t = Math.min(t, n) : n = Math.max(n, t), this.$min.setAttribute("aria-valuenow", String(t)), this.$max.setAttribute("aria-valuenow", String(n)), this.$min.setAttribute("aria-valuetext", String(t)), this.$max.setAttribute("aria-valuetext", String(n)), this.$min.setAttribute("aria-valuemax", String(n)), this.$max.setAttribute("aria-valuemin", String(t)), this.position(this.$max, n), this.position(this.$min, t), this.applyZIndex(t, n, s), this.$rail.dispatchEvent(
      new CustomEvent("Slider.change", {
        detail: { min: t, max: n, active: s },
        bubbles: !0
      })
    );
  }
  applyZIndex(e, r, s) {
    if (this.$min.style.zIndex = "1", this.$max.style.zIndex = "1", e !== r) {
      this.$max.style.zIndex = "2";
      return;
    }
    if (s === "min") {
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
  offset(e) {
    return this.horizontal ? this.rtl ? e === "min" ? this.width : 0 : e === "max" ? this.width : 0 : e === "min" ? this.height : 0;
  }
  position(e, r) {
    const { min: s, max: h } = this.state, i = Math.max(1, h - s), t = this.horizontal ? this.rtl ? h - r : r - s : h - r, n = Math.round(t * this.track / i), m = e === this.$min ? "min" : "max", a = p(n, 0, this.track) + this.offset(m);
    if (this.horizontal) {
      e.style.setProperty("transform", `translate3d(${a}px, 0, 0)`);
      return;
    }
    e.style.setProperty("transform", `translate3d(0, ${a}px, 0)`);
  }
  value(e, r) {
    const { left: s, top: h } = this.railRect, i = this.horizontal ? e.clientX : e.clientY, t = this.horizontal ? s : h, n = this.offset(r), m = i - t - n, a = p(m, 0, this.track), o = this.track > 0 ? a / this.track : 0, { min: c, max: u } = this.state, d = u - c;
    return !this.horizontal || this.rtl ? Math.round(u - d * o) : Math.round(c + d * o);
  }
}
export {
  w as default
};

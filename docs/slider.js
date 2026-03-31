const f = {
  orientation: "vertical",
  width: 24,
  height: 24,
  direction: "auto"
}, u = (l, n, s) => Math.min(s, Math.max(n, l)), p = (l) => l && l.classList.remove("focus"), $ = (l) => l && l.classList.add("focus");
function c(l, n) {
  const s = parseInt(l || "", 10);
  return Number.isFinite(s) ? s : n;
}
class b {
  constructor(n, s = {}) {
    this.active = "min", this.isMoving = !1, this.moving = null, this.handlePointerdown = (i) => {
      const t = i.currentTarget;
      this.active = t === this.$min ? "min" : "max", this.isMoving = !0, this.moving = this.active, t.focus({ preventScroll: !0 }), i.preventDefault(), i.stopPropagation();
    }, this.handlePointermove = (i) => {
      if (!this.isMoving || !this.moving)
        return;
      const t = this.valueFromPointer(i, this.moving);
      this.moving === "min" ? this.update(t, this.max, "min") : this.update(this.min, t, "max"), i.preventDefault(), i.stopPropagation();
    }, this.handlePointerup = () => {
      this.isMoving = !1, this.moving = null;
    }, this.handleKeydown = (i) => {
      const t = i.currentTarget;
      this.active = t === this.$min ? "min" : "max";
      const e = 1, m = 10, a = () => this.active === "min" ? this.min : this.max, h = (v) => {
        this.active === "min" ? this.update(v, this.max, "min") : this.update(this.min, v, "max"), i.preventDefault(), i.stopPropagation();
      }, d = () => this.horizontal && this.rtl ? a() - e : a() + e, g = () => this.horizontal && this.rtl ? a() + e : a() - e, x = {
        ArrowUp: () => h(a() + e),
        ArrowRight: () => h(d()),
        ArrowDown: () => h(a() - e),
        ArrowLeft: () => h(g()),
        PageUp: () => h(a() + m),
        PageDown: () => h(a() - m),
        Home: () => h(this.active === "min" ? this.globalMin : this.min),
        End: () => h(this.active === "max" ? this.globalMax : this.max),
        default: () => !1
      };
      return (x[i.key] || x.default)();
    }, this.handleFocus = (i) => {
      const t = i.currentTarget;
      $(t), $(this.$rail);
    }, this.handleBlur = (i) => {
      const t = i.currentTarget;
      p(t), p(this.$rail);
    }, this.$rail = n;
    const r = { ...f, ...s };
    this.orientation = r.orientation, this.width = r.width, this.height = r.height, this.direction = r.direction;
    const o = [...this.$rail.querySelectorAll('[role="slider"]')];
    if (o.length < 2)
      throw new Error("Slider: expected 2 thumbs inside rail");
    this.$max = o[0], this.$min = o[1];
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
  get globalMin() {
    return c(this.$min.getAttribute("aria-valuemin"), 0);
  }
  get globalMax() {
    return c(this.$max.getAttribute("aria-valuemax"), 100);
  }
  get min() {
    return c(this.$min.getAttribute("aria-valuenow"), this.globalMin);
  }
  get max() {
    return c(this.$max.getAttribute("aria-valuenow"), this.globalMax);
  }
  init() {
    this.$min.setAttribute("aria-orientation", this.orientation), this.$max.setAttribute("aria-orientation", this.orientation), this.$min.addEventListener("pointerdown", this.handlePointerdown), this.$max.addEventListener("pointerdown", this.handlePointerdown), this.$min.addEventListener("keydown", this.handleKeydown), this.$max.addEventListener("keydown", this.handleKeydown), this.$min.addEventListener("focus", this.handleFocus), this.$max.addEventListener("focus", this.handleFocus), this.$min.addEventListener("blur", this.handleBlur), this.$max.addEventListener("blur", this.handleBlur), document.addEventListener("pointermove", this.handlePointermove), document.addEventListener("pointerup", this.handlePointerup), this.update(this.min, this.max);
  }
  destroy() {
    this.$min.removeEventListener("pointerdown", this.handlePointerdown), this.$max.removeEventListener("pointerdown", this.handlePointerdown), this.$min.removeEventListener("keydown", this.handleKeydown), this.$max.removeEventListener("keydown", this.handleKeydown), this.$min.removeEventListener("focus", this.handleFocus), this.$max.removeEventListener("focus", this.handleFocus), this.$min.removeEventListener("blur", this.handleBlur), this.$max.removeEventListener("blur", this.handleBlur), document.removeEventListener("pointermove", this.handlePointermove), document.removeEventListener("pointerup", this.handlePointerup);
  }
  update(n, s, r = this.active) {
    const o = this.globalMin, i = this.globalMax;
    let t = u(n, o, i), e = u(s, o, i);
    r === "min" ? t = Math.min(t, e) : e = Math.max(e, t), this.$min.setAttribute("aria-valuenow", String(t)), this.$max.setAttribute("aria-valuenow", String(e)), this.$min.setAttribute("aria-valuetext", String(t)), this.$max.setAttribute("aria-valuetext", String(e)), this.$min.setAttribute("aria-valuemax", String(e)), this.$max.setAttribute("aria-valuemin", String(t)), this.positionThumb(this.$max, e), this.positionThumb(this.$min, t), this.applyZIndex(t, e, r), this.$rail.dispatchEvent(
      new CustomEvent("Slider.change", {
        detail: { min: t, max: e, active: r },
        bubbles: !0
      })
    );
  }
  applyZIndex(n, s, r) {
    if (this.$min.style.zIndex = "1", this.$max.style.zIndex = "1", n !== s) {
      this.$max.style.zIndex = "2";
      return;
    }
    r === "min" ? this.$min.style.zIndex = "3" : this.$max.style.zIndex = "3";
  }
  // - vertical: min thumb is offset down by 1 thumb so both are visible
  // - horizontal: max thumb is offset right by 1 thumb so both are visible
  offset(n) {
    return this.horizontal ? this.rtl ? n === "min" ? this.width : 0 : n === "max" ? this.width : 0 : n === "min" ? this.height : 0;
  }
  positionThumb(n, s) {
    const r = this.globalMin, o = this.globalMax, i = Math.max(1, o - r), t = this.horizontal ? this.rtl ? o - s : s - r : o - s, e = Math.round(t * this.track / i), m = n === this.$min ? "min" : "max", a = u(e, 0, this.track) + this.offset(m);
    n.style.setProperty(
      "transform",
      this.horizontal ? `translate3d(${a}px, 0, 0)` : `translate3d(0, ${a}px, 0)`
    );
  }
  valueFromPointer(n, s) {
    const { left: r, top: o } = this.railRect, i = this.horizontal ? n.clientX : n.clientY, t = this.horizontal ? r : o, e = this.offset(s), m = i - t - e, a = u(m, 0, this.track), h = this.track > 0 ? a / this.track : 0, d = this.globalMax - this.globalMin, g = this.horizontal ? this.rtl ? this.globalMax - d * h : this.globalMin + d * h : this.globalMax - d * h;
    return Math.round(g);
  }
}
export {
  b as default
};

const $ = {
  orientation: "horizontal",
  width: 24,
  height: 24,
  direction: "auto",
  step: 1,
  page: 10
}, p = (m, e, s) => Math.min(s, Math.max(e, m)), x = (m) => m && m.classList.remove("focus"), f = (m) => m && m.classList.add("focus");
function v(m, e) {
  const s = parseInt(m || "", 10);
  return Number.isFinite(s) ? s : e;
}
class w {
  constructor(e, s = {}) {
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
      const n = this.step, l = this.page, h = () => this.active === "min" ? this.min : this.max, o = (g) => {
        this.active === "min" && this.update(g, this.max, "min"), this.active === "max" && this.update(this.min, g, "max"), i.preventDefault(), i.stopPropagation();
      }, c = () => this.horizontal && this.rtl ? h() - n : h() + n, u = () => this.horizontal && this.rtl ? h() + n : h() - n, d = {
        ArrowUp: () => o(h() + n),
        ArrowRight: () => o(c()),
        ArrowDown: () => o(h() - n),
        ArrowLeft: () => o(u()),
        PageUp: () => o(h() + l),
        PageDown: () => o(h() - l),
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
    };
    const r = { ...$, ...s };
    this.$rail = e, this.orientation = r.orientation, this.width = r.width, this.height = r.height, this.direction = r.direction, this.step = r.step, this.page = r.page;
    const a = [...this.$rail.querySelectorAll('[role="slider"]')];
    if (a.length < 2)
      throw new Error("Slider: expected 2 thumbs inside rail");
    this.$max = a[0], this.$min = a[1];
  }
  get horizontal() {
    return this.orientation === "horizontal";
  }
  get rtl() {
    return this.direction === "rtl" ? !0 : this.direction === "ltr" ? !1 : getComputedStyle(this.$rail).direction === "rtl";
  }
  /**
   * Returns a snapshot of the rail bounding rect.
   */
  rect() {
    return this.$rail.getBoundingClientRect();
  }
  get length() {
    const { width: e, height: s } = this.rect();
    return this.horizontal ? e : s;
  }
  get size() {
    return this.horizontal ? this.width : this.height;
  }
  get track() {
    return Math.max(0, this.length - 2 * this.size);
  }
  get state() {
    return {
      min: v(this.$min.getAttribute("aria-valuemin"), 0),
      max: v(this.$max.getAttribute("aria-valuemax"), 100)
    };
  }
  get min() {
    return v(this.$min.getAttribute("aria-valuenow"), this.state.min);
  }
  get max() {
    return v(this.$max.getAttribute("aria-valuenow"), this.state.max);
  }
  init() {
    this.$min.addEventListener("pointerdown", this.handlePointerdown), this.$max.addEventListener("pointerdown", this.handlePointerdown), this.$min.addEventListener("keydown", this.handleKeydown), this.$max.addEventListener("keydown", this.handleKeydown), this.$min.addEventListener("focus", this.handleFocus), this.$max.addEventListener("focus", this.handleFocus), this.$min.addEventListener("blur", this.handleBlur), this.$max.addEventListener("blur", this.handleBlur), document.addEventListener("pointermove", this.handlePointermove), document.addEventListener("pointerup", this.handlePointerup), this.update(this.min, this.max);
  }
  destroy() {
    this.$min.removeEventListener("pointerdown", this.handlePointerdown), this.$max.removeEventListener("pointerdown", this.handlePointerdown), this.$min.removeEventListener("keydown", this.handleKeydown), this.$max.removeEventListener("keydown", this.handleKeydown), this.$min.removeEventListener("focus", this.handleFocus), this.$max.removeEventListener("focus", this.handleFocus), this.$min.removeEventListener("blur", this.handleBlur), this.$max.removeEventListener("blur", this.handleBlur), document.removeEventListener("pointermove", this.handlePointermove), document.removeEventListener("pointerup", this.handlePointerup);
  }
  update(e, s, r = this.active) {
    const { min: a, max: i } = this.state;
    let t = p(e, a, i), n = p(s, a, i);
    r === "min" ? t = Math.min(t, n) : n = Math.max(n, t), this.$min.setAttribute("aria-valuenow", String(t)), this.$max.setAttribute("aria-valuenow", String(n)), this.$min.setAttribute("aria-valuetext", String(t)), this.$max.setAttribute("aria-valuetext", String(n)), this.$min.setAttribute("aria-valuemax", String(n)), this.$max.setAttribute("aria-valuemin", String(t)), this.position(this.$max, n), this.position(this.$min, t), this.applyZIndex(t, n, r), this.$rail.dispatchEvent(
      new CustomEvent("Slider.change", {
        detail: { min: t, max: n, active: r },
        bubbles: !0
      })
    );
  }
  applyZIndex(e, s, r) {
    if (this.$min.style.zIndex = "1", this.$max.style.zIndex = "1", e !== s) {
      this.$max.style.zIndex = "2";
      return;
    }
    if (r === "min") {
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
  position(e, s) {
    const { min: r, max: a } = this.state, i = Math.max(1, a - r), t = this.horizontal ? this.rtl ? a - s : s - r : a - s, n = Math.round(t * this.track / i), l = e === this.$min ? "min" : "max", h = p(n, 0, this.track) + this.offset(l);
    if (this.horizontal) {
      e.style.setProperty("transform", `translate3d(${h}px, 0, 0)`);
      return;
    }
    e.style.setProperty("transform", `translate3d(0, ${h}px, 0)`);
  }
  value(e, s) {
    const { left: r, top: a } = this.rect(), i = this.horizontal ? e.clientX : e.clientY, t = this.horizontal ? r : a, n = this.offset(s), l = i - t - n, h = p(l, 0, this.track), o = this.track > 0 ? h / this.track : 0, { min: c, max: u } = this.state, d = u - c;
    return !this.horizontal || this.rtl ? Math.round(u - d * o) : Math.round(c + d * o);
  }
}
export {
  w as default
};

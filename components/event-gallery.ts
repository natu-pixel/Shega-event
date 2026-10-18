export interface EventItem {
  id?: string;
  slug?: string;
  title: string;
  detail?: string;
  date?: string;
  location?: string;
  href?: string;
  description?: string;
  image: string;
  gallery?: readonly string[];
  instagramUrl?: string;
}

export interface EventGalleryOptions {
  onSelect?: (event: EventItem) => void;
  onClose?: () => void;
  onProgress?: (progress: number) => void;
  onReady?: () => void;
}

type Tile = {
  event: EventItem;
  src: string;
  image: HTMLImageElement;
  sphereX: number;
  sphereY: number;
  sphereZ: number;
};

type PositionedTile = {
  tile: Tile;
  x: number;
  y: number;
  w: number;
  h: number;
  centerX: number;
  centerY: number;
  z: number;
};

const eventKey = (event: EventItem) => event.slug ?? event.id ?? event.href ?? event.image;
const eventDetail = (event: EventItem) => [event.detail, event.date, event.location].filter(Boolean).join(' / ');
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export class EventGallery {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly events: EventItem[] = [];
  private options: EventGalleryOptions;
  private tiles: Tile[] = [];
  private images = new Map<string, HTMLImageElement>();
  private pendingImages = new Set<HTMLImageElement>();
  private readyFired = false;
  private selected: Tile | null = null;
  private hovered: Tile | null = null;
  private pointerX = 0;
  private pointerY = 0;
  private pointerKnown = false;
  private pointerDown = false;
  private dragged = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private activeEvent = 0;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private scrollProgress = 0;
  private rotationX = 0;
  private rotationY = 0;
  private rotationVelocityX = 0;
  private rotationVelocityY = 0;
  private expanded: Tile | null = null;
  private expansionProgress = 0;
  private focus = { x: 0, y: 0, w: 0, h: 0 };
  private lastScrollAt = performance.now();
  private glitchUntil = 0;
  private glitchStrength = 0;
  private frame = 0;
  private destroyed = false;
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  private resizeObserver: ResizeObserver;
  private lastLayout: PositionedTile[] = [];

  constructor(
    private readonly root: HTMLElement,
    events: readonly EventItem[],
    options: EventGalleryOptions = {},
  ) {
    this.events = [...events];
    this.options = options;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'eg-canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.context = this.canvas.getContext('2d', { alpha: false })!;
    this.root.prepend(this.canvas);
    this.setEvents(events);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(root);
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    window.addEventListener('resize', this.handleScroll, { passive: true });
    this.reducedMotion.addEventListener('change', this.handleScroll);
    this.canvas.addEventListener('click', this.handlePointer);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerUp);
    this.canvas.addEventListener('lostpointercapture', this.handlePointerUp);
    this.canvas.addEventListener('pointerleave', this.handlePointerLeave);
    window.addEventListener('keydown', this.handleKeydown);
    this.updateFromScroll();
    this.resize();
  }

  setEvents(events: readonly EventItem[]) {
    this.events.splice(0, this.events.length, ...events);
    this.pendingImages.clear();
    this.readyFired = false;

    const sources: Array<{ event: EventItem; src: string; image: HTMLImageElement }> = [];
    for (const event of this.events) {
      const seen = new Set<string>();
      for (const src of event.gallery?.length ? event.gallery : [event.image]) {
        if (seen.has(src)) continue;
        seen.add(src);
        let image = this.images.get(src);
        if (!image) {
          image = new Image();
          image.decoding = 'async';
          image.src = src;
          this.images.set(src, image);
        }
        if (!image.complete) {
          this.pendingImages.add(image);
          image.onload = () => this.settleImage(image!);
          image.onerror = () => this.settleImage(image!);
        }
        sources.push({ event, src, image });
      }
    }

    // Fibonacci sphere distribution keeps event photos evenly spaced while
    // reusing the supplied collection to build a full photographic surface.
    const count = Math.min(128, Math.max(64, sources.length * 6));
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    this.tiles = sources.length ? Array.from({ length: count }, (_, index) => {
      const source = sources[index % sources.length];
      const y = 1 - 2 * (index + .5) / count;
      const ring = Math.sqrt(1 - y * y);
      const angle = goldenAngle * index;
      return {
        ...source,
        sphereX: Math.cos(angle) * ring,
        sphereY: y,
        sphereZ: Math.sin(angle) * ring,
      };
    }) : [];

    this.selected = this.tiles[0] ?? null;
    this.updateOverlay();
    this.scheduleDraw();
  }

  updateOptions(options: EventGalleryOptions) {
    this.options = options;
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.handleScroll);
    this.reducedMotion.removeEventListener('change', this.handleScroll);
    this.canvas.removeEventListener('click', this.handlePointer);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
    this.canvas.removeEventListener('lostpointercapture', this.handlePointerUp);
    this.canvas.removeEventListener('pointerleave', this.handlePointerLeave);
    window.removeEventListener('keydown', this.handleKeydown);
    this.images.forEach((image) => { image.onload = null; image.onerror = null; });
    this.canvas.remove();
  }

  private handleScroll = () => {
    const before = this.scrollProgress;
    this.updateFromScroll();
    const delta = this.scrollProgress - before;
    if (!this.reducedMotion.matches) {
      this.rotationY += delta * Math.PI * 5;
      this.rotationX += delta * Math.PI * 2.2;
    }

    const now = performance.now();
    const elapsed = Math.max(16, now - this.lastScrollAt);
    const speed = Math.abs(delta) / (elapsed / 1000);
    if (speed > .3) {
      this.glitchStrength = Math.min(1, (speed - .3) * .16);
      this.glitchUntil = now + 120;
    }
    this.lastScrollAt = now;
    this.scheduleDraw();
  };

  private handlePointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || this.expanded) return;
    this.pointerDown = true;
    this.dragged = false;
    this.lastPointerX = event.clientX;
    this.lastPointerY = event.clientY;
    this.canvas.setPointerCapture(event.pointerId);
    this.canvas.style.cursor = 'grabbing';
  };

  private handlePointerUp = () => {
    this.pointerDown = false;
    if (this.dragged) window.setTimeout(() => { this.dragged = false; }, 0);
    if (!this.hovered) this.canvas.style.cursor = 'grab';
  };

  private handlePointerMove = (event: PointerEvent) => {
    const bounds = this.canvas.getBoundingClientRect();
    this.pointerX = event.clientX - bounds.left;
    this.pointerY = event.clientY - bounds.top;
    this.pointerKnown = true;

    if (this.pointerDown) {
      const dx = event.clientX - this.lastPointerX;
      const dy = event.clientY - this.lastPointerY;
      if (Math.abs(dx) + Math.abs(dy) > 2) this.dragged = true;
      this.rotationVelocityY = dx * .006;
      this.rotationVelocityX = dy * .006;
      this.rotationY += this.rotationVelocityY;
      this.rotationX += this.rotationVelocityX;
      this.lastPointerX = event.clientX;
      this.lastPointerY = event.clientY;
      this.scheduleDraw();
      return;
    }

    this.hovered = this.hitTest(this.pointerX, this.pointerY);
    this.canvas.style.cursor = this.hovered ? 'zoom-in' : 'grab';
    this.scheduleDraw();
  };

  private handlePointer = (event: MouseEvent) => {
    if (this.dragged) {
      this.dragged = false;
      return;
    }
    if (this.expanded) {
      this.expanded = null;
      this.expansionProgress = this.reducedMotion.matches ? 1 : 0;
      this.options.onClose?.();
      this.scheduleDraw();
      return;
    }

    const bounds = this.canvas.getBoundingClientRect();
    const tile = this.hitTest(event.clientX - bounds.left, event.clientY - bounds.top);
    if (!tile) return;
    this.select(tile);
    this.expanded = tile;
    this.expansionProgress = this.reducedMotion.matches ? 1 : 0;
    this.glitchStrength = .85;
    this.glitchUntil = performance.now() + 420;
    this.scheduleDraw();
  };

  private handlePointerLeave = () => {
    if (this.pointerDown || (!this.hovered && !this.pointerKnown)) return;
    this.hovered = null;
    this.pointerKnown = false;
    this.pointerX = this.width / 2;
    this.pointerY = this.height / 2;
    this.canvas.style.cursor = 'grab';
    this.scheduleDraw();
  };

  private handleKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    if (this.expanded) {
      this.expanded = null;
      this.expansionProgress = this.reducedMotion.matches ? 1 : 0;
      this.options.onClose?.();
      this.scheduleDraw();
      return;
    }
    const overlay = this.root.querySelector<HTMLElement>('.eg-overlay');
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    this.options.onClose?.();
  };

  private scheduleDraw = () => {
    if (this.destroyed || this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      const now = performance.now();
      if (!this.reducedMotion.matches && (Math.abs(this.rotationVelocityX) > .0008 || Math.abs(this.rotationVelocityY) > .0008)) {
        this.rotationX += this.rotationVelocityX;
        this.rotationY += this.rotationVelocityY;
        this.rotationVelocityX *= .94;
        this.rotationVelocityY *= .94;
      }
      if (this.expanded) this.expansionProgress = Math.min(1, this.expansionProgress + .045);
      if (now >= this.glitchUntil) this.glitchStrength = 0;
      this.draw();
      const stillRotating = Math.abs(this.rotationVelocityX) > .0008 || Math.abs(this.rotationVelocityY) > .0008;
      const stillFocusing = this.focus.w > 0 && this.getFocusTarget()?.some((value, index) => Math.abs(value - [this.focus.x, this.focus.y, this.focus.w, this.focus.h][index]) > 1);
      if (now < this.glitchUntil || stillRotating || stillFocusing || (this.expanded && this.expansionProgress < 1)) this.scheduleDraw();
      else this.glitchStrength = 0;
    });
  };

  private updateFromScroll() {
    const scrollSection = this.root.closest<HTMLElement>('.eg-section') ?? this.root;
    const bounds = scrollSection.getBoundingClientRect();
    const travel = Math.max(1, scrollSection.offsetHeight - window.innerHeight);
    this.scrollProgress = this.reducedMotion.matches
      ? 0
      : clamp(-bounds.top / travel, 0, 1);
    this.options.onProgress?.(this.scrollProgress);
    if (this.events.length) {
      const next = Math.min(this.events.length - 1, Math.floor(this.scrollProgress * this.events.length));
      if (next !== this.activeEvent) {
        this.activeEvent = next;
        const tile = this.tiles.find((item) => eventKey(item.event) === eventKey(this.events[next]));
        if (tile) this.select(tile, false);
      }
    }
  }

  private resize() {
    const bounds = this.root.getBoundingClientRect();
    this.width = bounds.width;
    this.height = bounds.height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (!this.pointerKnown) {
      this.pointerX = this.width / 2;
      this.pointerY = this.height / 2;
    }
    this.scheduleDraw();
  }

  private drawImage(image: HTMLImageElement, x: number, y: number, width: number, height: number) {
    if (!image.complete || image.naturalWidth === 0) {
      this.context.fillStyle = '#080808';
      this.context.fillRect(x, y, width, height);
      return;
    }
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const sw = width / scale;
    const sh = height / scale;
    const sx = (image.naturalWidth - sw) / 2;
    const sy = (image.naturalHeight - sh) / 2;
    this.context.drawImage(image, sx, sy, sw, sh, x, y, width, height);
  }

  private projectTiles() {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const radiusX = this.width * .48;
    const radiusY = this.height * .49;
    const baseSize = Math.min(250, this.height * .31, this.width * .32);
    const cosX = Math.cos(this.rotationX);
    const sinX = Math.sin(this.rotationX);
    const cosY = Math.cos(this.rotationY);
    const sinY = Math.sin(this.rotationY);
    const result: PositionedTile[] = [];

    for (const tile of this.tiles) {
      const x1 = tile.sphereX * cosY + tile.sphereZ * sinY;
      const z1 = -tile.sphereX * sinY + tile.sphereZ * cosY;
      const y2 = tile.sphereY * cosX - z1 * sinX;
      const z = tile.sphereY * sinX + z1 * cosX;
      if (z < -.18) continue;

      const depth = clamp((z + .18) / 1.18, 0, 1);
      const perspective = .88 + depth * .12;
      const size = baseSize * (.28 + .72 * Math.pow(depth, .72)) * perspective;
      const centerX = cx + x1 * radiusX * perspective;
      const centerY = cy + y2 * radiusY * perspective;
      result.push({
        tile,
        x: centerX - size / 2,
        y: centerY - size / 2,
        w: size,
        h: size,
        centerX,
        centerY,
        z,
      });
    }

    return result.sort((a, b) => a.z - b.z);
  }

  private getFocusTarget(): [number, number, number, number] | null {
    const position = (this.hovered && this.lastLayout.find((item) => item.tile === this.hovered))
      ?? this.findVisibleSelected();
    return position ? [position.centerX, position.centerY, position.w, position.h] : null;
  }

  private drawFocus() {
    const target = this.getFocusTarget();
    if (!target) return;
    this.focus.x += (target[0] - this.focus.x) * .16;
    this.focus.y += (target[1] - this.focus.y) * .16;
    this.focus.w += (target[2] - this.focus.w) * .16;
    this.focus.h += (target[3] - this.focus.h) * .16;

    const ctx = this.context;
    ctx.save();
    ctx.strokeStyle = '#ff2b79';
    ctx.lineWidth = Math.max(3, this.focus.w * .022);
    ctx.shadowColor = 'rgba(255, 43, 121, .72)';
    ctx.shadowBlur = 18;
    ctx.strokeRect(this.focus.x - this.focus.w / 2, this.focus.y - this.focus.h / 2, this.focus.w, this.focus.h);
    ctx.restore();
  }

  private drawExpanded() {
    if (!this.expanded) return;
    const ctx = this.context;
    const tile = this.expanded;
    ctx.save();
    ctx.fillStyle = 'rgba(16, 8, 10, .88)';
    ctx.fillRect(0, 0, this.width, this.height);

    const image = tile.image;
    if (image.complete && image.naturalWidth > 0) {
      const boxW = this.width * .82;
      const boxH = this.height * .76;
      const scale = Math.min(boxW / image.naturalWidth, boxH / image.naturalHeight);
      const drawW = image.naturalWidth * scale;
      const drawH = image.naturalHeight * scale;
      const x = (this.width - drawW) / 2;
      const y = (this.height - drawH) / 2;
      const slices = 22;
      for (let index = 0; index < slices; index++) {
        const sliceY = Math.floor(image.naturalHeight * index / slices);
        const sliceH = Math.ceil(image.naturalHeight / slices) + 1;
        const local = clamp((this.expansionProgress - index / slices * .25) / .75, 0, 1);
        const shift = Math.sin(index * 12.4 + this.expansionProgress * 8) * (1 - local) * this.width * .07;
        ctx.globalAlpha = local;
        ctx.drawImage(image, 0, sliceY, image.naturalWidth, sliceH, x + shift, y + sliceY * scale, drawW, sliceH * scale);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#ff2b79';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 2, y - 2, drawW + 4, drawH + 4);
    }

    const strength = this.glitchStrength;
    if (strength > .04) {
      ctx.globalAlpha = strength * .65;
      for (let index = 0; index < 7; index++) {
        const y = ((index * 97 + this.expansionProgress * 170) % this.height);
        ctx.fillStyle = index % 2 ? '#ff2b79' : '#ff7a24';
        ctx.fillRect((index * 137) % this.width, y, this.width * (.08 + (index % 3) * .04), 2 + index % 3);
      }
    }
    ctx.restore();
  }

  private draw() {
    if (!this.width || !this.height) return;
    const ctx = this.context;
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, this.width, this.height);
    const layout = this.projectTiles();
    const baseSize = Math.min(250, this.height * .31, this.width * .32);

    for (const position of layout) {
      const depth = clamp((position.z + .18) / 1.18, 0, 1);
      const isHovered = position.tile === this.hovered;
      const sizeScale = isHovered ? 1.12 : 1;
      const size = baseSize * (.28 + .72 * Math.pow(depth, .72)) * sizeScale;
      const x = position.centerX - size / 2;
      const y = position.centerY - size / 2;
      ctx.save();
      ctx.globalAlpha = .2 + depth * .8;
      this.drawImage(position.tile.image, x, y, size, size);
      ctx.fillStyle = 'rgba(20, 5, 0, .08)';
      ctx.fillRect(x, y, size, size);
      ctx.restore();
      position.x = x;
      position.y = y;
      position.w = size;
      position.h = size;
    }

    this.lastLayout = layout;
    if (this.pointerKnown && !this.pointerDown) this.hovered = this.hitTest(this.pointerX, this.pointerY);
    this.drawFocus();

    if (this.glitchStrength > 0 && performance.now() < this.glitchUntil) {
      ctx.save();
      ctx.globalAlpha = .32 * this.glitchStrength;
      ctx.fillStyle = '#ff2b79';
      const tearX = (this.rotationY * 130) % Math.max(1, this.width);
      ctx.fillRect(tearX - 34, 1, Math.min(this.width * .2, 110), 2);
      ctx.fillRect((tearX + this.width * .42) % this.width, 5, Math.min(this.width * .12, 72), 1);
      ctx.restore();
    }

    this.drawExpanded();
    this.notifyReadyIfLoaded();
  }

  private findVisibleSelected() {
    if (!this.selected) return undefined;
    return this.lastLayout.find((position) => position.tile === this.selected)
      ?? this.lastLayout.find((position) => eventKey(position.tile.event) === eventKey(this.selected!.event));
  }

  private hitTest(x: number, y: number) {
    for (let index = this.lastLayout.length - 1; index >= 0; index--) {
      const position = this.lastLayout[index];
      if (x >= position.x && x <= position.x + position.w && y >= position.y && y <= position.y + position.h) return position.tile;
    }
    return null;
  }

  private select(tile: Tile, notify = true) {
    this.selected = tile;
    this.activeEvent = this.events.findIndex((event) => eventKey(event) === eventKey(tile.event));
    this.updateOverlay();
    if (notify) this.options.onSelect?.(tile.event);
    this.scheduleDraw();
  }

  private updateOverlay() {
    const event = this.selected?.event ?? this.events[0];
    const title = this.root.querySelector<HTMLElement>('.eg-title');
    const meta = this.root.querySelector<HTMLElement>('.eg-meta');
    const cta = this.root.querySelector<HTMLAnchorElement>('.eg-cta');
    if (!event || !title || !meta || !cta) return;
    const overlay = this.root.querySelector<HTMLElement>('.eg-overlay');
    if (overlay) overlay.hidden = false;
    title.textContent = event.title;
    meta.textContent = eventDetail(event);
    cta.href = event.href ?? (event.slug ? `/events/${event.slug}` : event.id ? `/events/${event.id}` : '#events');
    this.root.dataset.event = eventKey(event);
  }

  private settleImage(image: HTMLImageElement) {
    if (!this.pendingImages.delete(image)) return;
    image.onload = null;
    image.onerror = null;
    this.scheduleDraw();
  }

  private notifyReadyIfLoaded() {
    if (this.readyFired || this.pendingImages.size) return;
    this.readyFired = true;
    this.options.onReady?.();
  }
}

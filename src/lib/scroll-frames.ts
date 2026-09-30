type ScrollFramesOptions = {
  directory: string;
  count: number;
  width: number;
  height: number;
};

export function createScrollFrames(canvas: HTMLCanvasElement, options: ScrollFramesOptions) {
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) return null;

  canvas.width = options.width;
  canvas.height = options.height;
  const cache = new Map<number, HTMLImageElement>();
  const pending = new Map<number, HTMLImageElement>();
  const failed = new Set<number>();
  let queue: number[] = [];
  let target = 0;
  let direction = 1;
  let visible = false;
  let disposed = false;

  const paint = (index: number, image: HTMLImageElement) => {
    context.drawImage(image, 0, 0, options.width, options.height);
    canvas.dataset.frame = String(index);
    canvas.style.opacity = "1";
  };

  const pump = () => {
    if (!visible || disposed) return;
    while (pending.size < 4 && queue.length) {
      const index = queue.shift()!;
      if (cache.has(index) || pending.has(index) || failed.has(index)) continue;
      const image = new window.Image();
      image.decoding = "async";
      pending.set(index, image);
      image.onload = () => {
        pending.delete(index);
        if (disposed) return;
        cache.set(index, image);
        // Bound decoded image memory on phones; downloaded frames remain in the HTTP cache.
        if (cache.size > 24) cache.delete(cache.keys().next().value!);
        if (index === target) paint(index, image);
        pump();
      };
      image.onerror = () => {
        pending.delete(index);
        if (disposed) return;
        failed.add(index);
        pump();
      };
      image.src = `${options.directory}/${String(index).padStart(3, "0")}.webp`;
    }
  };

  const render = (progress: number) => {
    const next = Math.max(0, Math.min(options.count - 1, Math.round(progress * (options.count - 1))));
    if (next !== target) direction = next > target ? 1 : -1;
    target = next;
    const image = cache.get(target);
    if (image && visible) {
      cache.delete(target);
      cache.set(target, image);
      if (canvas.dataset.frame !== String(target)) paint(target, image);
    }
    // A quick reversal always puts the most recent scroll position first.
    queue = [target];
    for (let distance = 1; distance <= 10; distance++) {
      queue.push(target + direction * distance);
      if (distance <= 4) queue.push(target - direction * distance);
    }
    queue = queue.filter(index => index >= 0 && index < options.count);
    pump();
  };

  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) render(target / (options.count - 1));
    else queue = [];
  }, { rootMargin: "600px 0px" });
  observer.observe(canvas);

  return {
    render,
    dispose: () => {
      disposed = true;
      observer.disconnect();
      pending.forEach(image => { image.onload = null; image.onerror = null; });
      pending.clear();
      cache.clear();
      queue = [];
      context.clearRect(0, 0, options.width, options.height);
      canvas.style.opacity = "0";
      delete canvas.dataset.frame;
    },
  };
}

export function override<P, K extends keyof P> (target: P, key: K, cb: (original: P[K]) => P[K]): P {
  let original = target[key]
  if (typeof original === 'function') {
    if (!Object.prototype.hasOwnProperty.call(target, key)) {
      original = original.bind(target)
    }
  }
  target[key] = cb(original)
  return target
}

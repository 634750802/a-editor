// https://stackoverflow.com/questions/35940290/how-to-convert-base64-string-to-javascript-file-object-like-as-from-file-input-f
export function urlToFile (base64: string): Promise<File> {
  return fetch(base64)
    .then(async res => {
      if (res.ok) {
        return [await res.arrayBuffer(), res.headers.get('content-type') ?? undefined] as const;
      } else {
        return Promise.reject()
      }
    })
    .then(([buf, type]) => new File([buf as ArrayBuffer], '', { type }))
}

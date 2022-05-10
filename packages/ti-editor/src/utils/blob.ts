// https://stackoverflow.com/questions/35940290/how-to-convert-base64-string-to-javascript-file-object-like-as-from-file-input-f
export function urlToFile (url: string): Promise<File> {
  return fetch(url)
    .then(async res => {
      if (res.ok) {
        const filename = getUrlName(url)
        return [await res.arrayBuffer(), filename, res.headers.get('content-type') ?? undefined] as const;
      } else {
        return Promise.reject()
      }
    })
    .then(([buf, filename, type]) => new File([buf as ArrayBuffer], filename, { type }))
}

function getUrlName(url: string): string {
  try {
    const pathname = (new URL(url)).pathname
    return pathname.split('/').reverse()[0] || 'unnamed'
  } catch (e) {
    return 'unnamed'
  }
}

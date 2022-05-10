import { isElementType } from '@/slate-markdown/slate-utils';
import { urlToFile } from '@/utils/blob';
import { Image } from 'remark-slate-transformer/lib/transformers/mdast-to-slate';
import { visit } from 'unist-util-visit';
import { EditorFactory } from '../editor-factory'
import { Descendant, Node, Transforms } from 'slate'
import { override } from '../../../utils/override'
import { MdastContentType } from '../elements'
import { TiRemark, withTiRemark } from '@pingcap-inc/tidb-community-remark'

declare module '../editor-factory' {
  // eslint-disable-next-line
  interface EditorFactory extends TiRemark {
  }
}

const uploadFailedImage = 'data:image/svg+xml;utf8,<svg t="1652176551337" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1695" width="200" height="200"><path d="M512.504177 1023.999994C468.211373 1023.999994 423.585924 1018.165933 379.549 1006.344284 106.96018 933.290582-55.395594 652.104199 17.658108 379.540968 53.046293 247.48137 137.71694 137.120384 256.086965 68.774872 374.508166 0.429361 512.453001-17.712522 644.461423 17.650075 917.024655 90.678189 1079.380429 371.864572 1006.352316 644.478979 993.83979 691.177055 974.444096 736.237499 948.779346 778.4065 941.410006 790.458442 925.698982 794.271052 913.595865 786.952888 901.518335 779.583548 897.705725 763.846936 905.049477 751.769406 928.206605 713.771247 945.657612 673.214288 956.916326 631.224402 988.747781 512.368205 972.397058 388.240883 910.909126 281.692508 849.395607 175.144132 750.063043 98.91752 631.206846 67.086065 512.350649 35.280198 388.248915 51.579745 281.674952 113.118853 175.126576 174.632372 98.899964 273.964936 67.068509 392.795545 1.332972 638.107571 147.440375 891.198345 392.752401 956.933882 515.39562 989.840032 642.951732 971.211978 751.905378 904.683213 763.982908 897.313873 779.71952 901.126483 787.08886 913.178425 794.4582 925.255954 790.64559 940.992566 778.593648 948.361906 696.686504 998.360832 605.286216 1023.999994 512.504177 1023.999994L512.504177 1023.999994Z" p-id="1696"></path><path d="M511.992418 588.748345C497.842261 588.748345 486.404431 577.310515 486.404431 563.160358L486.404431 281.692508C486.404431 267.567939 497.842261 256.104521 511.992418 256.104521 526.142574 256.104521 537.580404 267.567939 537.580404 281.692508L537.580404 563.160358C537.605992 577.310515 526.142574 588.748345 511.992418 588.748345L511.992418 588.748345Z" p-id="1697"></path><path d="M511.992418 665.512304C526.116986 665.512304 537.580404 676.975722 537.580404 691.100291L537.580404 742.276263C537.580404 756.400832 526.116986 767.86425 511.992418 767.86425 497.867849 767.86425 486.404431 756.400832 486.404431 742.276263L486.404431 691.100291C486.404431 676.975722 497.867849 665.512304 511.992418 665.512304L511.992418 665.512304Z" p-id="1698"></path></svg>'

export function coreRemarkPlugin (factory: EditorFactory): void {
  factory = withTiRemark(factory)

  let __tempPlainText = ''

  override(factory, 'createDefaultEditableProps', createDefaultEditableProps => {
    return editor => {
      return override(createDefaultEditableProps(editor), 'onPaste', onPaste => {
        return event => {
          const dt = event.clipboardData
          if (dt) {
            if (dt.types.indexOf('application/x-slate-fragment') < 0) {
              if (dt.types.indexOf('text/plain') >= 0) {
                __tempPlainText = dt.getData('text/plain')
              }
              let nodes: Descendant[] | undefined = undefined
              if (dt.types.indexOf('text/html') >= 0) {
                const htmlData = dt.getData('text/html')
                nodes = factory.parseHtml(htmlData)
              } else if (dt.types.indexOf('text/plain') >= 0) {
                const textData = dt.getData('text/plain')
                nodes = factory.parseMarkdown(textData)
              }
              if (nodes !== undefined) {
                const outerImages: Image[] = []
                visit({ type: 'Root', children: nodes }, node => node.type === 'image', (node) => {
                  if (isElementType<Image>(node, 'image')) {
                    if (/^data:image\/\w+\/;base64,/.test(node.url)) {
                      outerImages.push(node)
                    } else {
                      if (!editor.isCdnHost?.(node.url)) {
                        outerImages.push(node)
                      }
                    }
                  }
                })

                editor.setHang?.(true)
                ;(async () => {
                  let failed = 0
                  try {
                    await Promise.all(outerImages.map(async image => {
                      try {
                        image.url = await editor.uploadFile?.(await urlToFile(image.url)) ?? uploadFailedImage
                      } catch (e) {
                        failed += 1
                        image.url = uploadFailedImage
                      }
                    }))
                    if (failed > 0) {
                      editor.onAlert(`${failed} 张图片上传失败`, '如果您希望上传其他站点的图片，需要下载到本地后粘贴至编辑器（否则可能会有图片跨域问题）')
                    }
                    editor.insertFragment(nodes)
                  } finally {
                    editor.setHang?.(false)
                  }
                })()

                event.preventDefault()
                return
              }
            }
          }
          onPaste?.(event)
        }
      })
    }
  })

  factory.onWrapEditor(editor => {
    override(editor, 'insertFragment', insertFragment => {
      return (fragment) => {
        if (editor.selection) {
          const el = Node.parent(editor, editor.selection.anchor.path)
          const cmt = editor.getContentModelType(el)
          if (cmt === MdastContentType.value) {
            if (__tempPlainText) {
              Transforms.insertText(editor, __tempPlainText)
            } else {
              Transforms.insertText(editor, factory.generateMarkdown(fragment as Descendant[]))
            }
            return
          }
        }
        insertFragment(fragment)
      }
    })

    override(editor, 'setFragmentData', setFragmentData => {
      return (dt) => {
        setFragmentData(dt)
        // copy the markdown content
        const fragment = editor.getFragment()
        dt.setData('text/plain', factory.generateMarkdown(fragment))
        __tempPlainText = fragment.map(Node.string).join('\n')
      }
    })
  })

}

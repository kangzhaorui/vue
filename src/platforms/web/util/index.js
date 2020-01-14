/* @flow */

import { warn } from 'core/util/index'

export * from './attrs'
export * from './class'
export * from './element'

/**
 * Query an element selector if it's not an element already.
 */
export function query (el: string | Element): Element {
  if (typeof el === 'string') {
    const selected = document.querySelector(el)
    if (!selected) {
       // 开发环境下给出错误提示
      process.env.NODE_ENV !== 'production' && warn(
        'Cannot find element: ' + el
      )
        // 没有找到的情况下容错处理
      return document.createElement('div')
    }
    return selected
  } else {
    return el
  }
}

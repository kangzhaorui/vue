/* @flow */

import config from 'core/config'
import { warn, cached } from 'core/util/index'
import { mark, measure } from 'core/util/perf'

import Vue from './runtime/index'
import { query } from './util/index'
import { compileToFunctions } from './compiler/index'
import { shouldDecodeNewlines, shouldDecodeNewlinesForHref } from './util/compat'

const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})
//扩展$mount，处理template
const mount = Vue.prototype.$mount
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
    // 没有找到的情况下容错处理
  el = el && query(el)

  /* istanbul ignore if */
   // 提示不能把body/html作为挂载点, 开发环境下给出错误提示
  // 因为挂载点是会被组件模板自身替换点, 显然body/html不能被替换
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }
 // $options是在new Vue(options)时候_init方法内执行.
 // $options可以访问到options的所有属性如data, filter, components, directives等
  const options = this.$options
  //render的优先级高，只有render不存在时才会考虑其他，render>template>el
   // 如果包含render函数则执行跳出,直接执行运行时版本的$mount方法
  // resolve template/el and convert to render function
  if (!options.render) {
    let template = options.template
     // 没有render函数时候优先考虑template属性
    if (template) {
       // template存在且template的类型是字符串
      if (typeof template === 'string') {
        if (template.charAt(0) === '#') {
             // template是ID
          template = idToTemplate(template)
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) {
         // template 的类型是元素节点,则使用该元素的 innerHTML 作为模板
        template = template.innerHTML
      } else {
           // 若 template既不是字符串又不是元素节点，那么在开发环境会提示开发者传递的 template 选项无效
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) {
         // 如果template选项不存在，那么使用el元素的outerHTML 作为模板内容
      template = getOuterHTML(el)//存在el直接获取当前dom下的html字符串模板
    }
    //编译过程
    // template: 存储着最终用来生成渲染函数的字符串
    if (template) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile')
      }
      //编译过程是将template字符串转换成render函数
      // 获取转换后的render函数与staticRenderFns,并挂在$options上
      const { render, staticRenderFns } = compileToFunctions(template, {//编译模板
        outputSourceRange: process.env.NODE_ENV !== 'production',
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)
      options.render = render
      options.staticRenderFns = staticRenderFns

      /* istanbul ignore if */
      // 用来统计编译器性能, config是全局配置对象
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end')
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
   // 调用之前说的公共mount方法
 // 重写$mount方法是为了添加模板编译的功能
  return mount.call(this, el, hydrating)//最后执行原先定义的mount方法
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
function getOuterHTML (el: Element): string {
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

Vue.compile = compileToFunctions

export default Vue

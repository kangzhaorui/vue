/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */
// 获得原生数组的原型
const arrayProto = Array.prototype
// 创建一个新的数组对象，修改该对象上的数组的七个方法，防止污染原生数组方法
export const arrayMethods = Object.create(arrayProto)
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
 /*这里重写了数组的这些方法，在保证不污染原生数组原型的情况下重写数组的这些方法，截获数组的成员发生的变化，执行原生数组操作的同时dep通知关联的所有观察者进行响应式处理*/

methodsToPatch.forEach(function (method) {
  // cache original method
  // 将数组的原生方法缓存起来，后面要调用 
  const original = arrayProto[method]
  def(arrayMethods, method, function mutator (...args) {
    // 调用原生数组的方法
    const result = original.apply(this, args)
    // 数组新插入的元素需要重新进行observe才能响应式
    const ob = this.__ob__
    let inserted
    switch (method) {
      case 'push':
        case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    if (inserted) ob.observeArray(inserted)
    // notify change
    // dep通知所有注册的观察者进行响应式处理
    ob.dep.notify()
    return result
  })
})


// 从数组的原型新建一个Object.create(arrayProto)对象，通过修改此原型可以保证原生数组方法不被污染。如果当前浏览器支持proto这个属性的话就可以直接覆盖该属性则使数组对象具
// 有了重写后的数组方法。如果没有该属性的浏览器，则必须通过遍历def所有需要重写的数组方法，这种方法效率较低，所以优先使用第一种。
// 在保证不污染不覆盖数组原生方法添加监听，主要做了两个操作，第一是通知所有注册的观察者进行响应式处理，第二是如果是添加成员的操作，需要对新成员进行observe。
// 但是修改了数组的原生方法以后我们还是没法像原生数组一样直接通过数组的下标或者设置length来修改数组，Vue.js提供了$set()及$remove()方法。
import 'abortcontroller-polyfill/dist/polyfill-patch-fetch'
import request from './request'
import omit from 'omit.js'

/**
 * 统一接口入口封装，后期提到单独库
 * 1.支持接口统一
 * 2.支持强大缓存功能
 */
class RequestContext {
  // 通用参数封装设置
  commonOptions = {}
  // 用于管理所有接口
  api = {}
  // 用于创建请求上下文，配置通用参数
  context(config) {
    // 暂时request相关配置在request中，后续提到库时在config配置
    // 目前只起单例创建作用
    this.commonOptions = Object.assign({}, this.commonOptions, config)
    return this
  }
  // 创建接口
  create(name, apiObj) {
    const apiList = this.analysisApiList(apiObj)
    this.api[name] = apiList
  }
  // 分析各模块接口中的接口list
  analysisApiList(apiObj) {
    if (typeof apiObj !== 'object') {
      throw new Error('接口定义列表类型必须为object')
    }
    const apiObjKeys = Object.keys(apiObj)
    const api$$obj = {}
    apiObjKeys.forEach(apiObjKey => {
      // 如果存在urlPrefix配置，则添加
      const apiObjItem = apiObj[apiObjKey]
      const {
        urlPrefix,
        ...resetOptions
      } = this.commonOptions
      if (urlPrefix) apiObj[apiObjKey]['url'] = `${urlPrefix}${apiObjItem.url}`
      
      // 对于手动终止的支持
      const controller = new AbortController()
      const signal = controller.signal

      api$$obj[apiObjKey] = param => {
        const {options, params} = this.getFinalOptionParam(apiObj[apiObjKey], param)
        console.log(options, params)
        return request({
          signal,
          body: params,
          ...resetOptions,
          ...options,
        })
      }
      api$$obj[apiObjKey]['abort'] = () => controller.abort()
    })
    return api$$obj
  }
  // 设置restful路径
  getFinalOptionParam(options, params) {
    if (!params) return {options, params}
    const paramKeys = Object.keys(params)
    const restParams = paramKeys.filter(paramKey => paramKey.charAt(0) === ':')
    if (!restParams.length) return {options, params}
    restParams.forEach(restParam => {
      options.url = options.url.replace(new RegExp(`(${restParam})(?=/)|${restParam}$`, 'ig'), params[restParam])
    })
    return ({options, params: omit(params, restParams)})
  }
}

export default RequestContext
/**
 * 文件编码: UTF-8(如不是UTF8编码可能会导致乱码或未知错误)
 * 禁止使用import、require导入模块
 * 若使用import * from *、import()、require()导入模块, 无法通过插件校验
 * import fs from 'fs';
 * import('fs').then().catch();
 * require('fs');
 */
plugin.exports = class Plugin implements BookSource {
  /**
   * 静态属性 ID  若使用插件开发工具生成模板则自动生成
   * 该值需符合正则表达式: [A-Za-z0-9_-]
   */
  public static readonly ID: string = 'gcpUH9FGdNGL11bIeZbZF';
  /**
   * 静态属性 TYPE  必填
   * 插件类型
   * 值类型:
   * plugin.type.BOOK_SOURCE  - 表示该插件为书源类
   * plugin.type.BOOK_STORE   - 表示该插件为书城类
   * plugin.type.TTS_ENGINE   - 表示该插件为TTS引擎类
   */
  public static readonly TYPE: number = plugin.type.BOOK_SOURCE;
  /**
   * 静态属性 GROUP  必填
   * 插件分组
   */
  public static readonly GROUP: string = 'ArcSurge';
  /**
   * 静态属性 NAME  必填
   * 插件名称
   */
  public static readonly NAME: string = '冬日小说网';
  /**
   * 静态属性 VERSION  必填
   * 插件版本  用于显示
   */
  public static readonly VERSION: string = '0.0.1';
  /**
   * 静态属性 VERSION_CODE  必填
   * 插件版本代码  用于比较本地插件与静态属性PLUGIN_FILE_URL所指插件的版本号
   */
  public static readonly VERSION_CODE: number = 1;
  /**
   * 静态属性 PLUGIN_FILE_URL  必填
   * 插件http、https链接, 如: http://example.com/plugin-template.js
   */
  public static readonly PLUGIN_FILE_URL: string = '';
  /**
   * 静态属性 BASE_URL  书源、书城类必填
   * 插件请求目标链接
   */
  public static readonly BASE_URL: string = 'https://www.drxsw.com';
  /**
   * 静态属性 REQUIRE  可选
   * 要求用户填写的值
   */
  public static readonly REQUIRE: Record<string, RequireItem> = {};
  /**
   * 书源类搜索结果过滤器  可选
   */
  public static readonly SEARCH_FILTER: SearchFilter = void 0;
  /**
   * 插件是否启用，为true表示该插件已弃用  可选
   */
  public static readonly DEPRECATED: boolean | undefined = void 0;
  private request: ReadCatRequest;
  private cheerio: CheerioModule.load;
  constructor(options: PluginConstructorOptions) {
    const { request, cheerio } = options;
    /**
     * request
     *   function get(url, config)
     *     url: string    请求链接
     *     config(可选): {
     *                     params(可选): { [key: string]: number | string | boolean } | URLSearchParams,    请求参数
     *                     headers(可选): { [key: string]: string },    请求头
     *                     proxy(可选): boolean    是否开启代理,
     *                     charset(可选): string    字符集, 默认为自动获取, 当出现乱码时请指定字符集
     *                     urlencode(可选): string   URL编码, 默认UTF8
     *                     maxRedirects(可选): number  最大重定向数, 为0时则禁止重定向
     *                     responseType(可选): 'arraybuffer' | 'text' | 'json'  响应体类型, 默认text
     *                     signal(可选): AbortSignal  中止信号
     *                   }
     *   return: Promise<{ body, code, headers }>
     *   function post(url, config)
     *     url: string    请求链接
     *     config(可选): {
     *                     params(可选): { [key: string]: number | string | boolean }, | URLSearchParams,    请求参数
     *                     headers(可选): { [key: string]: string },    请求头
     *                     proxy(可选): boolean    是否开启代理
     *                     charset(可选): string    字符集, 默认为自动获取, 当出现乱码时请指定字符集
     *                     urlencode(可选): string   URL编码, 默认UTF8
     *                     maxRedirects(可选): number  最大重定向数, 为0时则禁止重定向
     *                     responseType(可选): 'arraybuffer' | 'text' | 'json'  响应体类型, 默认text
     *                     signal(可选): AbortSignal  中止信号
     *                   }
     *   return: Promise<{ body, code, headers }>
     * 
     *   body: 响应体
     *   code: 响应码
     *   headers: 响应头
     */
    this.request = request;

    /**
     * function cheerio(html: string)
     * 该值是模块cheerio中的load方法, 用法 const $ = cheerio(HTMLString)
     * 文档: https://cheerio.nodejs.cn/docs/basics/loading#load
     */
    this.cheerio = cheerio;
  }

  isEmpty(r: any) {
    return r.length < 1;
  }

  async search(searchkey: string): Promise<SearchEntity[]> {
    console.log(searchkey);
    const results = [];
    const response = await this.request.post(Plugin.BASE_URL + "/s.php", {
      params: {
        searchkey,
        searchtype: "articlename"
      }
    });
    if (200 !== response.code) return results;
    console.log(response)
    let $ = this.cheerio(response.body);
    const list = $("#main #sitebox #nr");
    if (this.isEmpty(list)) return results;
    list.each((_, ele) => {
      const item = $(ele);
      const info = item.find("dd h3 a");
      const bookname = info.text().trim();
      const detailPageUrl = Plugin.BASE_URL + info.attr("href").trim();
      const author = "无";
      const coverImageUrl = Plugin.BASE_URL + item.find("img.lazy").attr("data-src").trim();
      const latestChapterTitle = item.find(".book_other a").text().trim();
      results.push({
        bookname,
        author,
        coverImageUrl,
        detailPageUrl,
        latestChapterTitle
      });
    });
    return results;
  }

  async getDetail(detailPageUrl: string): Promise<DetailEntity> {
    console.log(detailPageUrl);
    const response = await this.request.get(detailPageUrl);
    if (200 !== response.code) return null;
    const $ = this.cheerio(response.body);
    if (this.isEmpty($)) return null;
    const fmimg = $("#main #bookinfo #bookimg img");
    const coverImageUrl = this.isEmpty(fmimg) ? "" : Plugin.BASE_URL + fmimg.attr("src").trim();
    const bookname = $("#main #bookinfo .d_title h1").text().trim();
    const author = $("#main #bookinfo .d_title .p_author").text().replace("作者：", "").trim();
    const latestChapterTitle = $("#main #newlist ul.chaw li a").first().text().trim();
    const intro = $("#main #bookinfo #bookintro p").text().trim();
    const chapters = $("#main #newlist ul#chapterList li a");
    if (this.isEmpty(chapters)) return null;
    const chapterList = [];
    chapters.each((_, ele) => {
      const item = $(ele);
      chapterList.push({
        title: item.text().trim(),
        url: Plugin.BASE_URL + item.attr("href").trim(),
      });
    })
    return {
      coverImageUrl,
      bookname,
      latestChapterTitle,
      author,
      intro,
      chapterList
    };
  }

  async getTextContent(chapter: Chapter): Promise<string[]> {
    console.log(chapter);
    const response = await this.request.get(chapter.url);
    if (200 !== response.code) return [];
    const $ = this.cheerio(response.body);
    if (this.isEmpty($)) return [];
    const content = $("#TextContent.read-content p");
    let res = [];
    content.each((_, ele) => {
      const p = $(ele);
      res.push(p.text().trim());
    });
    return res;
  }
}

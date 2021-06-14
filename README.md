# pictureSpider

# 目录说明
repository                  数据仓库目录
    dao.js                      sqlite3 ado
    reposiotryFactory           repository工厂
    iRepository.js              repository抽象类
    catalogInfoRepository.js    catalogInfo表配置
    imageInfoRepository.js      imageInfo表配置
util                        工具目录
    logger.js                   logger
    rabbit.js                   rabbit
    tools.js                    tools
webParser                   网页分析器目录
    parserFactory.js            网页分析工厂
    iWebParser.js               web parser抽象类
    mm131.js                    某网站页面分析类
worker                      工人目录
    workmanFactory.js           工人工厂
    iWorkman.js                 工人抽象类
    checkImageWorker.js         检查图片是否完整工人
    downloadImageWorker.js      下载图片工人
    parsePicPageWorker.js       分析图片页面工人（分析图片页面的图片下载路径）
    parseTotalPicPageWorker.js  分析系列图片工人（分析系统图片页面该系列总共有多少页）
    parseCatalogPageWorker.js   分析目录页面工人(分析目录页面有哪些系列图片)
    postEnterPageWorker.js      图片网站类别目录工人（列出该图片网站的分类目录）
    spiderTimerWorker.js        报时工人
workLine                    生产线目录
    workLineFactory.js          生产线工厂
    iWorkLine.js                基础生产线抽象类
    iNormalWorkLine.js          普工生产线抽象类
    iAdoWorkLine.js             带访问数据库的生产线抽象类
    checkImageWorkLine.js       检查图片生产线
    downloadImageWorkLine.js    下载图片生产线
    parseCatalogPageWorkLine.js 分析目录页面生产线
    parsePicPageWorkLine.js     分析图片页面生产线
    parseTotalPicPageWorkLine.js    分析系列图片生产线
    postEnterPageWorkLine.js    网片网站类别目录生产线
    spiderTimerWorkLine.js      定时生产线
    versatileWorkLine.js        多能工生产线（带负载平衡）
    versatileWorksLine.js       多能工生产线
app.js          生产线建立入口
sendBegin.js    任务触发


# run.bat
以多生产线多能工方式启动进行抓图
# run2.bat
以多生产线专职工方式启动进行抓图
# run3.bat
以单生产线多能工方式启动进行抓图

# 
yarn worker VersatileWorkLine man1
{"workType":"PostEnterPageWorker","input":true}
yarn worker SpiderTimerWorkLine man1

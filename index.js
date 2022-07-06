// ==UserScript==
// @name         B站 Antfu
// @namespace    https://github.com/lilei2603/bilibili-follow
// @version      1.1
// @description  B站首页显示Antfu专区！
// @author       Lei
// @match        https://www.bilibili.com/*
// @icon         https://avatars.githubusercontent.com/u/11247099?v=4
// @grant        GM_addStyle
// @license      MIT

// ==/UserScript==
; (function () {
  'use strict'

  // 用户列表
  let USERS = []
  // 当前用户索引
  let currentUserIndex = 0

  let currentPage = 1
  let page = 0
  // 视频列表
  let videoList = []
  // 是否显示我的关注窗口
  let isShowFavorite = false
  // 窗口滚动距离
  let scrollTop = 0
  let totalCount = 0
  const API = {
    // 获取用户视频列表
    getNewVideo: async () => {
      let res = await fetch(
        `https://api.bilibili.com/x/space/arc/search?mid=${USERS[currentUserIndex].mid}&ps=30&tid=0&pn=${currentPage}&order=pubdate&jsonp=jsonp`
      )
      const json = await res.json()
      totalCount = json.data.page.count
      videoList = videoList.concat(json.data.list.vlist)
    },
    // 根据用户ID获取用户信息
    getUserInfoByMid: async (mid) => {
      let res = await fetch(`https://api.bilibili.com/x/space/acc/info?mid=${mid}&jsonp=jsonp`)
      const json = await res.json()
      return json
    }
  }
  // 用户初始化
  function initUser() {
    // 从缓存中获取用户列表
    if(!localStorage.getItem('favorites')) {
      USERS = [
        {
          key_words: 'AnthonyFu一个托尼',
          mid: 668380,
          avatar: 'http://i1.hdslb.com/bfs/face/519cb17285e6b9450a738472cb0b95aeb8676547.jpg',
        }
      ]
      localStorage.setItem('favorites', JSON.stringify(USERS))
    }else {
      USERS = JSON.parse(localStorage.getItem('favorites'))
    }
  }
  // 播放量格式化
  function bigNumber(num) {
    return num > 10000 ? `${(num / 10000).toFixed(2)}万` : num
  }

  function s2d(string) {
    return new DOMParser().parseFromString(string, 'text/html').body
      .childNodes[0]
  }
  // 播放时长格式化
  function timeFormat(time) {
    let res = []
    let [s = 0, m = 0] = time.split(':').reverse()
    res.unshift(String(s).padStart(2, '0'))
    res.unshift(String(m % 60).padStart(2, '0'))
    res.unshift(String(parseInt(m / 60)).padStart(2, '0'))

    return res.join(':')
  }
  // 日期时间格式化
  function timeago(dateTimeStamp) {
    const minute = 60;      //把分，时，天，周，半个月，一个月用毫秒表示
    const hour = minute * 60;
    const day = hour * 24;
    // const week = day * 7;
    const month = day * 30;
    const now = parseInt(new Date().getTime() / 1000);   //获取当前时间毫秒
    const diffValue = now - dateTimeStamp;//时间差
    let result = ''
    if (diffValue < 0) {
      return;
    }
    const minC = diffValue / minute;  //计算时间差的分，时，天，周，月
    const hourC = diffValue / hour;
    const dayC = diffValue / day;
    const monthC = diffValue / month;
    const datetime = new Date();
    datetime.setTime(dateTimeStamp * 1000);
    const Nyear = datetime.getFullYear();
    const Nmonth = datetime.getMonth() + 1;
    const Ndate = datetime.getDate();
    if (dayC >= 1 && dayC < 2) {
      result = '昨天'
    } else if (hourC >= 1 && hourC <= 23) {
      result = ' ' + parseInt(hourC) + '小时前'
    } else if (minC >= 1 && minC <= 59) {
      result = ' ' + parseInt(minC) + '分钟前'
    } else if (diffValue >= 0 && diffValue <= minute) {
      result = '刚刚'
    } else if (monthC < new Date().getMonth() + 1) {
      result = Nmonth + '-' + Ndate
    } else {
      result = Nyear + '-' + Nmonth + '-' + Ndate
    }
    return result;
  }
  // 换一换
  async function refresh() {
    page++
    if(videoList.length < totalCount){
      currentPage++
      await API.getNewVideo()
    }else {
      if(videoList.length % totalCount == 0){
        currentPage = 1
      }else{
        currentPage++
      }
      await API.getNewVideo()
    }
    drawVideos()
  }
  // 绘制视频
  function drawVideos() {
    const VIDEO_DOM = document.querySelector('#bili_custom .variety-body')
    VIDEO_DOM.innerHTML = ''

    videoList
      .slice(page * 10, page * 10 + 14)
      .forEach((item) => {
        const title = item.title.replace(/<em class="keyword">(.*?)<\/em>/g, '$1')
        const pic = item.pic.replace(/http/g, 'https') + '@672w_378h_1c'
        const webp = pic + '.webp'
        let DOM = s2d(`
        <div class="bili-video-card" data-report="partition_recommend.content">
  <div class="bili-video-card__skeleton hide">
    <div class="bili-video-card__skeleton--cover"></div>
    <div class="bili-video-card__skeleton--info">
      <div class="bili-video-card__skeleton--right">
        <p class="bili-video-card__skeleton--text"></p>
        <p class="bili-video-card__skeleton--text short"></p>
        <p class="bili-video-card__skeleton--light"></p>
      </div>
    </div>
  </div>
  <div class="bili-video-card__wrap __scale-wrap"><a href="//www.bilibili.com/video/${item.bvid}" target="_blank"
      data-mod="partition_recommend" data-idx="content" data-ext="click">
      <div class="bili-video-card__image __scale-player-wrap">
        <div class="bili-video-card__image--wrap">
          <div class="bili-watch-later" style="display: none;"><svg class="bili-watch-later__icon">
              <use xlink:href="#widget-watch-later"></use>
            </svg><span class="bili-watch-later__tip" style="display: none;"></span></div>
          <picture class="v-img bili-video-card__cover">
            <!---->
            <source srcset="${webp}"
              type="image/webp"><img
              src="${pic}"
              alt="${title}" loading="lazy" onload="">
          </picture>
          <div class="v-inline-player"></div>
        </div>
        <div class="bili-video-card__mask">
          <div class="bili-video-card__stats">
            <div class="bili-video-card__stats--left"><span class="bili-video-card__stats--item"><svg
                  class="bili-video-card__stats--icon">
                  <use xlink:href="#widget-video-play-count"></use>
                </svg><span class="bili-video-card__stats--text">${bigNumber(item.play)}</span></span><span
                class="bili-video-card__stats--item"><svg class="bili-video-card__stats--icon">
                  <use xlink:href="#widget-video-danmaku"></use>
                </svg><span class="bili-video-card__stats--text">${item.comment}</span></span></div><span
              class="bili-video-card__stats__duration">${timeFormat(item.length)}</span>
          </div>
        </div>
      </div>
    </a>
    <div class="bili-video-card__info __scale-disable">
      <div class="bili-video-card__info--right">
        <h3 class="bili-video-card__info--tit" title="${title}"><a href="//www.bilibili.com/video/${item.bvid}"
            target="_blank" data-mod="partition_recommend" data-idx="content" data-ext="click">${title}</a></h3>
        <div class="bili-video-card__info--bottom">
          <a class="bili-video-card__info--owner" href="//space.bilibili.com/${item.mid}" target="_blank"
            data-mod="partition_recommend" data-idx="content" data-ext="click"><svg
              class="bili-video-card__info--owner__up">
              <use xlink:href="#widget-up"></use>
            </svg><span class="bili-video-card__info--author">${item.author}</span><span
            class="bili-video-card__info--date">· ${timeago(item.created)}</span></a>
        </div>
      </div>
    </div>
  </div>
</div>
`)
        VIDEO_DOM.append(DOM)
      })
  }
  // 绘制我的关注按钮
  function drawFavorites() {

    const refreshBtn = document.querySelector('.custom-refresh')
    const refreshBtnParent = refreshBtn.parentNode
    const favorite = s2d(`
    <button class="primary-btn roll-btn favorite-btn" id="favorite-btn">
      <svg style="transform: rotate(180deg);">
        <use xlink:href="#widget-arrow"></use>
      </svg>
      <span>我的关注</span>
    </button>
  `)
  refreshBtnParent.insertBefore(favorite, refreshBtn)
  const modal = s2d(`
  <div class="custom-modal">
  <div class="modal-mask"></div>
  <div class="modal-wrap">
    <div class="modal" role="document">
      <div tabindex="0" aria-hidden="true" style="width: 0px; height: 0px; overflow: hidden; outline: none;"></div>
      <div class="modal-content"><button type="button" aria-label="Close" class="modal-close"><span
            class="modal-close-x"><span role="img" aria-label="close"
              class="anticon anticon-close modal-close-icon"><svg focusable="false" class="" data-icon="close"
                width="1em" height="1em" fill="currentColor" aria-hidden="true" viewBox="64 64 896 896">
                <path
                  d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 00203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z">
                </path>
              </svg></span></span></button>
        <div class="modal-header">
          <div class="modal-title">我的关注</div>
        </div>
        <div class="modal-body"></div>
        <div class="modal-footer">
          <div>
            <span>用户ID：</span>
            <input id="mid" style="height: 25px; padding: 5px;" />
          </div>
          <button class="btn btn-primary" type="button">
            <span>添 加</span>
          </button>
        </div>
      </div>
      <div tabindex="0" aria-hidden="true" style="width: 0px; height: 0px; overflow: hidden; outline: none;"></div>
    </div>
  </div>
</div>
    `)
    document.querySelector('#bili_custom').append(modal)
    appendFavoriteItem()
  }
  // 添加关注用户项
  function appendFavoriteItem() {
    document.querySelector('.modal-body').innerHTML = ''
    USERS.forEach((item, index) => {
      const DOM = s2d(`
      <div class="modal-content-item">
        <img src="${item.avatar}" style="width: 34px; height: 34px; border-radius: 17px; margin-right: 12px;">
        <span>${item.key_words}</span>
      </div>
      `)
      document.querySelector('.modal-body').append(DOM)
      DOM.addEventListener('click', () => {
        currentUserIndex = index
        showFavorite()
        injectDOM()
      })
    })
  }
  // 操作我的关注弹窗
  function showFavorite() {
    isShowFavorite = !isShowFavorite
    // 获取点击按钮时，当前窗口滚动距离
    if(window.pageYOffset != 0) {
      scrollTop = window.pageYOffset
    }
    // 如果显示弹窗，则禁用页面滚动
    document.body.style.position = isShowFavorite ? 'fixed' : 'static'
    // 设置页面滚动高度
    document.body.style.top = isShowFavorite ? `-${scrollTop}px` : '0';
    window.scrollTo(0, scrollTop)

    document.querySelector('.custom-modal').style.display = isShowFavorite ? 'block' : 'none'
    appendFavoriteItem()
  }
  // 添加用户信息
  async function appendFavorite() {
    const mid = document.querySelector('#mid')
    const isUserExist = USERS.findIndex(item => item.mid == mid)
    if(isUserExist == -1) {
      const userInfo = await API.getUserInfoByMid(mid.value)
      if(userInfo.code === 0) {
        USERS.push({
          mid: mid.value,
          key_words: userInfo.data.name,
          avatar: userInfo.data.face
        })
      }else{
        alert('获取用户信息失败')
      }
      localStorage.setItem('favorites', JSON.stringify(USERS))
      getMyFavorite()
      mid.value = ''
    }else{
      alert('用户已存在')
    }
  }
  // 获取用户信息
  function getMyFavorite() {
    const favorites = localStorage.getItem('favorites')
    if(favorites) {
      USERS = JSON.parse(favorites)
    }
    appendFavoriteItem()
  }
  // 关注信息
  async function useLive() {
    const { data } = await API.getUserInfoByMid(USERS[currentUserIndex].mid);
    return {
        liveRoomUrl: data.live_room.url,
        isLive: data.live_room.liveStatus === 1
    }
  }
  // 包装根据bool切换值
  function wrapperSwitchValue(flag) {
    return (t, f) => flag ? t : f
  }
  // 初始化容器
  async function injectDOM() {
    // currentUserIndex = mid ? USERS.findIndex(item => item.mid == mid) : 0
    videoList = []
    currentPage = 1
    page = 0
    const spaceVideoUrl = `https://space.bilibili.com/${USERS[currentUserIndex].mid}/video`
    const { liveRoomUrl, isLive } = await useLive();
    const switchLiving = wrapperSwitchValue(isLive);

    const DOM = `
    <div id="bili_custom">
      <section class="bili-grid">
        <div class="variety-area">
          <div class="area-header">
            <div class="left">
              <div class="avatar-container">
                <a href="${switchLiving(liveRoomUrl,spaceVideoUrl)}" target="_blank" class="space-user-avatar">
                <div class="avatar-wrap ${switchLiving('live-ani','')}">
                  <div>
                    <div class="bili-avatar" style="width: 34px;height:34px;">
                      <img class="bili-avatar-img bili-avatar-face bili-avatar-img-radius"
                        data-src="${USERS[currentUserIndex].avatar}"
                        alt=""
                        src="${USERS[currentUserIndex].avatar}">
                      <span class="bili-avatar-icon bili-avatar-right-icon  bili-avatar-size-60"></span>
                    </div>
                  </div>
                  <div class="a-cycle a-cycle-1"></div>
                  <div class="a-cycle a-cycle-2"></div>
                  <div class="a-cycle a-cycle-3"></div>
                </div>
                <div class="live-tab" style="${switchLiving('', 'display:none;')}"><img style="width: 15px;height: 15px;"
                    src="//s1.hdslb.com/bfs/static/jinkela/space/assets/live.gif" alt="live" class="live-gif">
                </div>
                </a>
            </div>
                <a class="title" href="https://space.bilibili.com/${USERS[currentUserIndex].mid}/video" target="_blank">
                  <span>${USERS[currentUserIndex].key_words}</span>
                </a>
            </div>
            <div class="right">
              <button class="primary-btn roll-btn custom-refresh">
                <svg style="transform: rotate(0deg);">
                  <use xlink:href="#widget-roll"></use>
                </svg>
                <span>换一换</span>
              </button>
              <a class="primary-btn see-more" href="https://space.bilibili.com/${USERS[currentUserIndex].mid}/video" target="_blank">
                <span>查看更多</span>
                <svg>
                  <use xlink:href="#widget-arrow"></use>
                </svg>
              </a>
            </div>
          </div>
          <div class="variety-body"></div>
        </div>
      </section>
    </div>`
    let content = document.querySelector('.bili-layout')
    if (document.querySelector('#bili_custom')) {
      content.removeChild(document.querySelector('#bili_custom'))
    }
    let anchor = document.querySelectorAll('.bili-grid')[2]
    let init = s2d(DOM)
    document.querySelector('#bili_custom') &&
    document.querySelector('#bili_custom').remove()
    // 插入初始模版
    console.log(anchor)
    content.insertBefore(init, anchor)
    // 插入关注UP主按钮
    drawFavorites()
    // 插入最新视频
    await API.getNewVideo()
    drawVideos()
    // 点击事件
    document.querySelector('.custom-refresh').addEventListener('click', refresh)
    document.querySelector('.favorite-btn').addEventListener('click', showFavorite)
    document.querySelector('.anticon').addEventListener('click', showFavorite)
    document.querySelector('.btn-primary').addEventListener('click', appendFavorite)
  }

  window.addEventListener(
    'load',
    async () => {
      initUser()
      await injectDOM()
    },
    false,
  )

  GM_addStyle(`

  .space-user-avatar {
    width: 34px;
    min-width: 34px;
  }
  .space-user-avatar .avatar-wrap {
    position: relative;
    width: 100%;
    height: 34px;
  }
  .bili-avatar {
    display: block;
    position: relative;
    background-image: url(data:image/gif;base64,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);
    background-size: cover;
    border-radius: 50%;
    margin: 0;
    padding: 0;
  }
  .space-user-avatar .avatar-wrap.live-ani .a-cycle {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%,-50%);
      width: 34px;
      height: 34px;
      border: 1px solid #f69;
      border-radius: 50%;
      z-index: 1;
      opacity: 0;
      animation: scaleUpCircle 1.5s linear;
      animation-iteration-count: infinite;
  }
  @keyframes scaleUpCircle{
    0%{
      transform:translate(-50%,-50%) scale(1);
      opacity:1
    }
    to
    {
    transform:translate(-50%,-50%) scale(1.5);
    opacity:0
    }
  }
  .space-user-avatar .avatar-wrap.live-ani .a-cycle-1 {
      animation-delay: 0s;
  }
  .space-user-avatar .avatar-wrap.live-ani .a-cycle-2 {
      animation-delay: .5s;
  }
  .space-user-avatar .avatar-wrap.live-ani .a-cycle-3 {
      animation-delay: 1s;
  }
  .avatar-container {
      position: relative;
      margin-right:15px;
  }
  .space-user-avatar .live-tab {
    position: absolute;
    left: 50%;
    bottom: 0;
    transform: translate(-50%,50%);
    height: 15px;
    white-space: nowrap;
    display: -ms-flexbox;
    display: flex;
    -ms-flex-align: center;
    align-items: center;
    -ms-flex-pack: center;
    justify-content: center;
    background: #f69;
    color: #fff;
    border-radius: 8px;
    border: 1.5px solid #fff;
    padding: 2px 3px;
    font-size: 12px;
    z-index: 2;
}


    .favorite-btn {
      background-color: #fb7299!important;
      color: #ffffff!important;
    }
    .favorite-btn:hover {
      background-color: #fc8bab!important;
    }
    #bili_custom {
      position: relative;
    }
    .custom-modal {

      display: none;
    }
    .modal-mask {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: 1000;
      height: 100%;
      background-color: #00000073;
    }
    .modal-wrap {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      overflow: auto;
      outline: 0;
      z-index: 1000;
    }
    .modal {
      box-sizing: border-box;
      padding: 0 0 24px;
      color: #000000d9;
      font-size: 14px;
      font-variant: tabular-nums;
      line-height: 1.5715;
      list-style: none;
      font-feature-settings: "tnum";
      pointer-events: none;
      position: relative;
      top: 100px;
      width: 500px;
      height: 500px;
      margin: 0 auto;
      transform-origin: 9px 204px;
  }
  .modal-content {
      position: relative;
      background-color: #fff;
      background-clip: padding-box;
      border: 0;
      border-radius: 2px;
      box-shadow: 0 3px 6px -4px #0000001f, 0 6px 16px #00000014, 0 9px 28px 8px #0000000d;
      pointer-events: auto;
  }
  .modal-close {
      position: absolute;
      top: 0;
      right: 0;
      z-index: 10;
      padding: 0;
      color: #00000073;
      font-weight: 700;
      line-height: 1;
      text-decoration: none;
      background: transparent;
      border: 0;
      outline: 0;
      cursor: pointer;
      transition: color .3s;
  }
  .modal-close-x {
      display: block;
      width: 56px;
      height: 56px;
      font-size: 16px;
      font-style: normal;
      line-height: 56px;
      text-align: center;
      text-transform: none;
      text-rendering: auto;
  }
  .anticon {
      display: inline-block;
      color: inherit;
      font-style: normal;
      line-height: 0;
      text-align: center;
      text-transform: none;
      vertical-align: -0.125em;
      text-rendering: optimizelegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
  }
  .anticon:hover {
    color: #fb7299;
  }
  .modal-header {
      padding: 16px 24px;
      color: #000000d9;
      background: #fff;
      border-bottom: 1px solid #f0f0f0;
      border-radius: 2px 2px 0 0;
  }
  .modal-title {
      margin: 0;
      color: #000000d9;
      font-weight: 500;
      font-size: 16px;
      line-height: 22px;
      word-wrap: break-word;
  }
  .modal-body {
      padding: 24px;
      font-size: 14px;
      line-height: 1.5715;
      word-wrap: break-word;
  }
  .modal-footer {
      padding: 10px 16px;
      text-align: right;
      background: transparent;
      border-top: 1px solid #f0f0f0;
      border-radius: 0 0 2px 2px;
      display: flex;
      justify-content: space-between;
      align-items: center;
  }
  .btn {
      line-height: 1.5715;
      position: relative;
      display: inline-block;
      font-weight: 400;
      white-space: nowrap;
      text-align: center;
      background-image: none;
      border: 1px solid transparent;
      box-shadow: 0 2px #00000004;
      cursor: pointer;
      transition: all .3s cubic-bezier(.645,.045,.355,1);
      -webkit-user-select: none;
      -moz-user-select: none;
      user-select: none;
      touch-action: manipulation;
      height: 32px;
      padding: 4px 15px;
      font-size: 14px;
      border-radius: 2px;
      color: #000000d9;
      border-color: #d9d9d9;
      background: #fff;
      outline: 0;
  }
  .btn:hover {
    border-color: #e3e5e7!important;
    background-color: #e3e5e7!important;
  }
  .btn-primary {
      margin-left: 20px;
      color: #fff;
      border-color: #fb7299;
      background: #fb7299!important;
      text-shadow: 0 -1px 0 rgb(0 0 0 / 12%);
      box-shadow: 0 2px #0000000b;
  }
  .btn-primary:hover {
    border-color: #fc8bab!important;
    background-color: #fc8bab!important;
  }
  .modal-body {
    display: flex;
    flex-wrap: wrap;
    align-content: start;
    justify-content: space-between;
    height: 300px;
    overflow-y: auto;
  }
  .modal-content-item {
    cursor: pointer;
    box-shadow: 0px 1px 4px 0px rgba(0, 0, 0, 0.16);
    padding: 0 12px;
    width: 45%;
    height: 60px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
  }
  .modal-content-item:hover {
    background-color: #efefef;
  }
  `)
})()
